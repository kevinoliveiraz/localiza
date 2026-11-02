// Teste pesado e explícito. Usa somente o conjunto público openMVG baixado em .tools.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const api=process.env.LOCALIZA_TEST_API||'http://127.0.0.1:5175';
const source=path.join(root,'.tools/samples/ImageDataset_SceauxCastle-master/images');
const headers={'X-Localiza-Client':'localiza-editor-v1'};
async function json(url,options){const response=await fetch(api+url,options);const value=await response.json();if(!response.ok)throw new Error(value.error||response.status);return value;}
const job=await json('/api/scans',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({building:'__validacao__',floor:'Exemplo público openMVG',quality:'fast'})});
console.log('Trabalho de validação: '+job.id);
for(const name of (await readdir(source)).filter(name=>/\.jpe?g$/i.test(name)).sort())await json(`/api/scans/${job.id}/photos`,{method:'POST',headers:{...headers,'Content-Type':'image/jpeg'},body:await readFile(path.join(source,name))});
await json(`/api/scans/${job.id}/process`,{method:'POST',headers});
let previous='';
for(let iteration=0;iteration<720;iteration++){
 const current=await json(`/api/scans/${job.id}`);
 if(current.status+current.stage!==previous){console.log(JSON.stringify({status:current.status,stage:current.stage,message:current.message}));previous=current.status+current.stage;}
 if(['completed','failed','cancelled','interrupted'].includes(current.status)){
  await mkdir(path.join(root,'validation'),{recursive:true});
  await writeFile(path.join(root,'validation/photo-pipeline.json'),JSON.stringify({...current,source:'https://github.com/openMVG/ImageDataset_SceauxCastle',attribution:'Copyright 2012 Pierre MOULON; conjunto público de exemplo do openMVG, não são fotos do usuário.'},null,2));
  if(current.status!=='completed'||current.format!=='glb')process.exitCode=1;
  break;
 }
 await new Promise(resolve=>setTimeout(resolve,5000));
}
