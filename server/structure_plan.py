"""Extrai um rascunho retangular de planos verticais observados; nunca inventa paredes ausentes."""
from pathlib import Path
import json
import math
import struct
import numpy as np

TYPES = {'float': ('f', 4), 'float32': ('f', 4), 'double': ('d', 8), 'float64': ('d', 8),
         'uchar': ('B', 1), 'uint8': ('B', 1), 'char': ('b', 1), 'int8': ('b', 1),
         'int': ('i', 4), 'int32': ('i', 4), 'uint': ('I', 4), 'uint32': ('I', 4),
         'short': ('h', 2), 'int16': ('h', 2), 'ushort': ('H', 2), 'uint16': ('H', 2)}


def read_dense_ply(filename):
    with Path(filename).open('rb') as stream:
        if stream.readline().strip() != b'ply':
            raise ValueError('A estrutura intermediária não é um PLY válido.')
        properties, count, current, little = [], 0, None, True
        while True:
            line = stream.readline().decode('ascii').strip().split()
            if not line:
                raise ValueError('Cabeçalho PLY incompleto.')
            if line[0] == 'end_header':
                break
            if line[0] == 'format':
                if not line[1].startswith('binary_'):
                    raise ValueError('Use o formato binário do motor local.')
                little = line[1] == 'binary_little_endian'
            if line[0] == 'element':
                current = line[1]
                if current == 'vertex': count = int(line[2])
            if line[0] == 'property' and current == 'vertex':
                properties.append(line[1:])
        if count < 200 or count > 10_000_000:
            raise ValueError('Quantidade de pontos insuficiente ou excessiva para extrair a estrutura.')
        prefix = '<' if little else '>'
        points, normals = [], []
        stride = max(1, (count+59999) // 60000)
        for index in range(count):
            values = {}
            for prop in properties:
                if prop[0] == 'list':
                    code, size = TYPES[prop[1]]
                    length = struct.unpack(prefix+code, stream.read(size))[0]
                    if length > 2000: raise ValueError('Lista PLY inválida.')
                    stream.seek(length*TYPES[prop[2]][1], 1)
                else:
                    code, size = TYPES[prop[0]]
                    values[prop[1]] = struct.unpack(prefix+code, stream.read(size))[0]
            if index % stride == 0:
                points.append([values['x'], values['y'], values['z']])
                normals.append([values.get('nx', 0), values.get('ny', 0), values.get('nz', 0)])
        return np.asarray(points), np.asarray(normals)


def align_up(up):
    a = np.asarray(up, dtype=float)
    norm = np.linalg.norm(a)
    if norm < .5: raise ValueError('Mantenha o celular na vertical durante a captura para orientar as paredes.')
    a /= norm
    b = np.array([0., 1., 0.])
    v, cosine = np.cross(a, b), float(a @ b)
    if cosine < -.999999: return np.diag([1., -1., -1.])
    cross = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + cross + cross @ cross/(1+cosine)


def plane_pair(values, support_min, min_separation):
    low, high = np.quantile(values, [.005, .995])
    span = high-low
    if span < 1e-5: raise ValueError('Só foi observada uma parede em uma das direções. Filme também os lados opostos.')
    histogram, edges = np.histogram(values, bins=120, range=(low, high))
    smooth = np.convolve(histogram, [1, 2, 3, 2, 1], mode='same')
    ordered = np.argsort(smooth)[::-1]
    peaks = []
    for candidate in ordered:
        if all(abs(int(candidate)-other) > 10 for other in peaks): peaks.append(int(candidate))
        if len(peaks) >= 6: break
    modes = []
    for peak in peaks:
        center = (edges[peak]+edges[peak+1])/2
        nearby = values[np.abs(values-center) < span*.035]
        if len(nearby) >= support_min:
            modes.append((float(np.median(nearby)), len(nearby)))
    pairs = [(a, b) for i, a in enumerate(modes) for b in modes[i+1:] if abs(a[0]-b[0]) > max(span*.3,min_separation)]
    if not pairs:
        raise ValueError('Não há evidência suficiente de duas paredes opostas. Complete a volta pelo ambiente ou informe as medidas.')
    a, b = max(pairs, key=lambda pair: min(pair[0][1], pair[1][1]) * abs(pair[0][0]-pair[1][0])**.35)
    return sorted([a[0], b[0]]), [a[1], b[1]]


def extract_structure(points, normals, up, camera_count=0):
    p, n = np.asarray(points, dtype=float), np.asarray(normals, dtype=float)
    valid = np.isfinite(p).all(axis=1) & np.isfinite(n).all(axis=1) & (np.linalg.norm(n, axis=1) > .5)
    p, n = p[valid], n[valid]
    if len(n): n /= np.linalg.norm(n, axis=1)[:, None]
    if len(p) < 500: raise ValueError('Faltam superfícies observadas para sugerir a planta. Você ainda pode criar o modelo pelas medidas.')
    rotation = align_up(up)
    p, n = p @ rotation.T, n @ rotation.T
    vertical = np.abs(n[:, 1]) < .25
    walls = n[vertical]
    if len(walls) < 300: raise ValueError('Não foi possível distinguir paredes verticais. Use um vídeo mais estável ou informe as medidas.')
    angles = np.arctan2(walls[:, 2], walls[:, 0])
    consensus = np.mean(np.exp(4j*angles))
    if abs(consensus) < .35:
        raise ValueError('O contorno não parece retangular. Use o vídeo como referência e desenhe o contorno no editor.')
    angle = np.angle(consensus)/4
    c, s = math.cos(angle), math.sin(angle)
    axes = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    p, n = p @ axes.T, n @ axes.T
    xmask = (np.abs(n[:, 0]) > .93) & vertical
    zmask = (np.abs(n[:, 2]) > .93) & vertical
    if xmask.sum() < 150 or zmask.sum() < 150:
        raise ValueError('Faltam paredes em duas direções. Filme os quatro lados do cômodo, caminhando entre as posições.')
    footprint_span = max(float(np.quantile(p[:, axis],.98)-np.quantile(p[:, axis],.02)) for axis in [0,2])
    min_separation = footprint_span*.06
    x, xsupport = plane_pair(p[xmask, 0], max(70, int(xmask.sum()*.05)), min_separation)
    z, zsupport = plane_pair(p[zmask, 2], max(70, int(zmask.sum()*.05)), min_separation)
    width, depth = x[1]-x[0], z[1]-z[0]
    if not .1 < width/depth < 10:
        raise ValueError('As proporções não são confiáveis. Ajuste as medidas manualmente antes de criar o modelo.')
    return {'version': 1, 'kind': 'rectangular-room', 'units': 'relative',
            'width': round(width, 6), 'depth': round(depth, 6),
            'outline': [[0, 0], [width, 0], [width, depth], [0, depth]],
            'evidence': {'points': len(p), 'registeredFrames': camera_count, 'verticalPlanes': 4,
                         'planeSupport': xsupport+zsupport},
            'requiresReview': True, 'openingsDetected': False,
            'message': 'Contorno sugerido a partir de quatro planos verticais. Confirme uma medida e revise o desenho. Portas e janelas não foram identificadas automaticamente.'}


def from_reconstruction(folder, reconstruction):
    points, normals = read_dense_ply(Path(folder)/'scene_dense.ply')
    cameras = [[-float(v) for v in image.cam_from_world().rotation.matrix()[1]] for image in reconstruction.images.values()]
    up = np.mean(cameras, axis=0)
    result = extract_structure(points, normals, up, len(cameras))
    (Path(folder)/'structure.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    return result
