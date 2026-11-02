import {mkdir,access,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tools=path.join(root,'.tools');await mkdir(tools,{recursive:true});
const exists=async file=>{try{await access(file);return true}catch{return false}};
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const python=process.env.LOCALIZA_PYTHON||(await exists(bundled)?bundled:'python');
const run=(command,args)=>new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd:root,stdio:'inherit',windowsHide:true});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(`${command} encerrou com código ${code}.`)))});
if(!await exists(path.join(tools,'python/pycolmap'))||!await exists(path.join(tools,'python/PIL'))){console.log('Instalando o motor de reconstrução em uma pasta isolada do projeto…');await run(python,['-m','pip','install','pycolmap==4.2.1','Pillow>=11.3,<14','--target',path.join(tools,'python'),'--disable-pip-version-check']);}
let openmvs=process.env.LOCALIZA_OPENMVS||path.join(tools,'openmvs/vc17/x64/Release');
if(!await exists(path.join(openmvs,process.platform==='win32'?'DensifyPointCloud.exe':'DensifyPointCloud'))){
 if(process.platform!=='win32')throw new Error('Instale OpenMVS no sistema e defina LOCALIZA_OPENMVS para a pasta dos executáveis.');
 console.log('Baixando o OpenMVS oficial para processamento por CPU…');
 const url='https://github.com/cdcseacave/openMVS/releases/download/v2.4.0/OpenMVS_Windows_x64.zip';
 const response=await fetch(url);if(!response.ok)throw new Error('Não foi possível baixar o OpenMVS: '+response.status);
 const content=Buffer.from(await response.arrayBuffer()),zip=path.join(tools,'OpenMVS_Windows_x64.zip');await writeFile(zip,content);await mkdir(path.join(tools,'openmvs'),{recursive:true});
 await run('tar',['-xf',zip,'-C',path.join(tools,'openmvs')]);
 await writeFile(path.join(tools,'openmvs-source.json'),JSON.stringify({source:url,version:'2.4.0',sha256:createHash('sha256').update(content).digest('hex'),license:'AGPL-3.0; motor externo, consulte https://github.com/cdcseacave/openMVS'},null,2));
}
await writeFile(path.join(tools,'runtime.json'),JSON.stringify({python,openmvs:path.relative(tools,openmvs).replaceAll('\\','/'),pycolmap:'4.2.1',openmvsVersion:'2.4.0'},null,2));
console.log('Motor instalado. As reconstruções usam apenas este computador. Inicie com npm run dev.');
