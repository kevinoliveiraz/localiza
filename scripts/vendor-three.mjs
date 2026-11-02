import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'node_modules/three');
const target=path.join(root,'assets/vendor/three');
const files=['build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js','examples/jsm/exporters/GLTFExporter.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/loaders/PLYLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js','LICENSE'];
for(const file of files){const relative=file.replace('build/','').replace('examples/jsm/','addons/');const dest=path.join(target,relative);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(source,file),dest);}
const pkg=JSON.parse(await readFile(path.join(source,'package.json'),'utf8'));
await writeFile(path.join(target,'version.json'),JSON.stringify({name:'three',version:pkg.version,source:'https://github.com/mrdoob/three.js',license:'MIT'},null,2));
console.log(`Three.js ${pkg.version} preparado localmente; nenhuma CDN é usada em execução.`);
