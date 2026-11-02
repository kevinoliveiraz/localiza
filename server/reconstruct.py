"""Reconstrução local: PyCOLMAP (CPU) -> OpenMVS -> GLB. Nunca acessa rede."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import struct
import math
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT / '.tools' / 'python'))
os.environ.setdefault('OMP_NUM_THREADS', '4')
os.environ.setdefault('OPENBLAS_NUM_THREADS', '4')


def pack_glb(filename, up=None):
    """OpenMVS exporta GLB com PNG externo; empacota texturas no próprio GLB."""
    raw = filename.read_bytes()
    magic, version, total = struct.unpack_from('<III', raw)
    if magic != 0x46546C67 or version != 2 or total != len(raw):
        raise ValueError('O arquivo exportado não é um GLB 2 válido.')
    json_size = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20+json_size])
    extras = document.setdefault('asset', {}).setdefault('extras', {})
    if up and not extras.get('localizaUpAligned'):
        length = math.sqrt(sum(v*v for v in up))
        x, y, z = [v/length for v in up]
        quaternion = [-z, 0, x, 1+y] if y > -.999999 else [1, 0, 0, 0]
        length = math.sqrt(sum(v*v for v in quaternion))
        for scene in document.get('scenes', []):
            index = len(document['nodes'])
            document['nodes'].append({'name': 'Orientação pelas câmeras', 'rotation': [v/length for v in quaternion], 'children': scene['nodes']})
            scene['nodes'] = [index]
        extras['localizaUpAligned'] = True
        extras['units'] = 'relative'
    binary_start = 20 + json_size
    binary_size = struct.unpack_from('<I', raw, binary_start)[0]
    binary = bytearray(raw[binary_start+8:binary_start+8+binary_size])
    for image in document.get('images', []):
        uri = image.pop('uri', None)
        if uri:
            source = (filename.parent / uri).resolve()
            if source.parent != filename.parent.resolve() or source.suffix.lower() not in ['.png', '.jpg', '.jpeg']:
                raise ValueError('A textura precisa ser um arquivo local do trabalho.')
            content = source.read_bytes()
            binary.extend(b'\x00' * (-len(binary) % 4))
            view = {'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(content)}
            image['bufferView'] = len(document.setdefault('bufferViews', []))
            document['bufferViews'].append(view)
            image['mimeType'] = 'image/png' if source.suffix.lower() == '.png' else 'image/jpeg'
            binary.extend(content)
        image['name'] = 'Textura do ambiente'
    for collection in ['nodes', 'meshes', 'materials', 'scenes']:
        for item in document.get(collection, []):
            if 'name' in item:
                item['name'] = Path(item['name']).name
    document['buffers'] = [{'byteLength': len(binary)}]
    encoded = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\x00' * (-len(binary) % 4))
    length = 12 + 8 + len(encoded) + 8 + len(binary)
    filename.write_bytes(struct.pack('<III', magic, version, length) + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', len(binary), 0x004E4942) + binary)


def emit(kind, **values):
    print(json.dumps({'type': kind, **values}, ensure_ascii=False), flush=True)


def run_tool(binary, args, folder):
    command = [str(binary), *map(str, args), '--max-threads', '4', '--verbosity', '1']
    emit('log', message='Executando ' + binary.stem)
    result = subprocess.run(command, cwd=folder, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, errors='replace',
                            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.stdout:
        emit('log', message=result.stdout[-16000:])
    logs = sorted(folder.glob(binary.stem + '-*.log'), key=lambda p: p.stat().st_mtime)
    if logs:
        emit('log', message=logs[-1].read_text(errors='replace')[-22000:])
    if result.returncode:
        raise RuntimeError(f'{binary.stem} não concluiu a etapa (código {result.returncode}). Consulte o registro local.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--job', required=True)
    parser.add_argument('--mode', choices=['mesh', 'structure'], default='mesh')
    parser.add_argument('--openmvs', required=True)
    parser.add_argument('--quality', choices=['fast', 'balanced'], default='fast')
    args = parser.parse_args()
    folder = Path(args.job).resolve()
    binaries = Path(args.openmvs).resolve()
    started = time.monotonic()
    import pycolmap
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = 80_000_000

    def stage(name, message):
        emit('stage', stage=name, message=message)

    stage('preparing', 'Conferindo e preparando as fotografias neste computador.')
    images = folder / 'prepared'
    images.mkdir(exist_ok=True)
    originals = sorted((folder / 'images').iterdir())
    if len(originals) < 8:
        raise ValueError('Selecione pelo menos 8 fotos diferentes e sobrepostas do mesmo ambiente.')
    max_dimension = 1280 if args.quality == 'fast' else 1800
    sizes = []
    for index, source in enumerate(originals):
        with Image.open(source) as original:
            photo = ImageOps.exif_transpose(original).convert('RGB')
            if min(photo.size) < 240:
                raise ValueError('Uma fotografia é pequena demais. Use imagens com pelo menos 240 px em cada lado.')
            photo.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            sizes.append(photo.size)
            photo.save(images / f'photo_{index:04d}.jpg', quality=94)

    database = folder / 'features.db'
    extraction = pycolmap.FeatureExtractionOptions()
    extraction.max_image_size = max_dimension
    extraction.num_threads = 4
    extraction.use_gpu = False
    extraction.sift.max_num_features = 6000 if args.quality == 'fast' else 10000
    reader = pycolmap.ImageReaderOptions()
    reader.camera_model = 'SIMPLE_RADIAL'
    mode = pycolmap.CameraMode.SINGLE if len(set(sizes)) == 1 else pycolmap.CameraMode.AUTO
    stage('features', 'Encontrando detalhes que aparecem nas fotografias.')
    pycolmap.extract_features(database, images, camera_mode=mode,
                              reader_options=reader, extraction_options=extraction,
                              device=pycolmap.Device.cpu)
    stage('matching', 'Relacionando os detalhes vistos de diferentes posições.')
    matching = pycolmap.FeatureMatchingOptions()
    matching.num_threads = 4
    matching.use_gpu = False
    matching.guided_matching = True
    if args.mode == 'structure':
        pairing = pycolmap.SequentialPairingOptions()
        pairing.overlap = 6
        pairing.loop_detection = False
        pycolmap.match_sequential(database, matching_options=matching, pairing_options=pairing, device=pycolmap.Device.cpu)
    else:
        pycolmap.match_exhaustive(database, matching_options=matching, device=pycolmap.Device.cpu)
    stage('sparse', 'Estimando as posições das câmeras e os primeiros pontos 3D.')
    sparse = folder / 'sparse'
    sparse.mkdir(exist_ok=True)
    options = pycolmap.IncrementalPipelineOptions()
    options.num_threads = 4
    options.min_model_size = 3
    options.multiple_models = False
    options.ba_use_gpu = False
    options.mapper.init_min_tri_angle = 8
    maps = pycolmap.incremental_mapping(database, images, sparse, options=options)
    if not maps:
        raise ValueError('Não foi possível conectar as fotos em 3D. Fotografe com mais sobreposição, detalhes e deslocamento entre posições.')
    reconstruction = max(maps.values(), key=lambda model: model.num_reg_images())
    if reconstruction.num_reg_images() < 3 or reconstruction.num_points3D() < 30:
        raise ValueError('Foram encontrados poucos pontos 3D confiáveis. Refaça a sequência com mais detalhes e diferentes ângulos.')
    best = folder / 'best'
    best.mkdir(exist_ok=True)
    reconstruction.write(best)
    reconstruction.export_PLY(folder / 'sparse-preview.ply')
    emit('metrics', registeredImages=reconstruction.num_reg_images(),
         inputImages=len(originals), sparsePoints=reconstruction.num_points3D())

    try:
        stage('dense', 'Reconstruindo a superfície. Esta costuma ser a etapa mais demorada.')
        dense = folder / 'dense'
        undistort = pycolmap.UndistortCameraOptions()
        undistort.max_image_size = max_dimension
        pycolmap.undistort_images(dense, best, images, output_type='COLMAP',
                                  undistort_options=undistort, num_threads=4)
        suffix = '.exe' if os.name == 'nt' else ''
        binary = lambda name: binaries / (name + suffix)
        run_tool(binary('InterfaceCOLMAP'), ['-i', dense, '-o', folder / 'scene.mvs',
                 '--image-folder', dense / 'images'], folder)
        run_tool(binary('DensifyPointCloud'), ['-i', folder / 'scene.mvs',
                 '-o', folder / 'scene_dense.mvs', '--resolution-level', '1',
                 '--max-resolution', str(max_dimension), '--min-resolution', '320',
                 '--number-views', '4', '--number-views-fuse', '2'], folder)
        if args.mode == 'structure':
            stage('structure', 'Buscando os planos das paredes para criar um contorno simplificado.')
            from structure_plan import from_reconstruction
            structure = from_reconstruction(folder, reconstruction)
            emit('result', format='plan', file='structure.json', stage='review',
                 message=structure['message'], seconds=round(time.monotonic()-started, 1))
            return
        stage('mesh', 'Transformando os pontos reconstruídos em uma malha 3D.')
        run_tool(binary('ReconstructMesh'), ['-i', folder / 'scene_dense.mvs',
                 '-o', folder / 'scene_mesh.mvs'], folder)
        stage('texture', 'Aplicando às superfícies os detalhes das fotografias.')
        run_tool(binary('TextureMesh'), ['-i', folder / 'scene_dense.mvs',
                 '--mesh-file', folder / 'scene_mesh.ply',
                 '-o', folder / 'model.glb', '--export-type', 'glb',
                 '--global-seam-leveling', '0', '--local-seam-leveling', '0'], folder)
        stage('export', 'Preparando o arquivo GLB para abrir no navegador.')
        result = next((p for p in folder.glob('model*.glb') if p.stat().st_size > 100), None)
        if not result:
            raise RuntimeError('O exportador não produziu um GLB válido.')
        if result != folder / 'model.glb':
            (folder / 'model.glb').write_bytes(result.read_bytes())
        camera_up = [[-float(v) for v in image.cam_from_world().rotation.matrix()[1]] for image in reconstruction.images.values()]
        up = [sum(vector[i] for vector in camera_up)/len(camera_up) for i in range(3)]
        pack_glb(folder / 'model.glb', up if sum(v*v for v in up) > .25 else None)
        emit('result', format='glb', file='model.glb', stage='completed',
             message='Modelo 3D reconstruído e texturizado. A escala das fotografias é relativa.',
             seconds=round(time.monotonic()-started, 1))
    except Exception as error:
        if args.mode == 'structure':
            raise
        # A reconstrução esparsa é resultado real, mas não substitui uma malha completa.
        emit('result', format='ply', file='sparse-preview.ply', stage='partial',
             message='Foi reconstruída uma nuvem de pontos inicial. A malha completa não ficou pronta: ' + str(error),
             seconds=round(time.monotonic()-started, 1))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit('error', message=str(error))
        sys.exit(1)
