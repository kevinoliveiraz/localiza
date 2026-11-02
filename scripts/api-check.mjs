import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {startPhotoService} from '../server/photo-server.mjs';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'localiza-api-check-'));
const server=await startPhotoService({port:5176,dataDir}),api='http://127.0.0.1:5176';
const headers={'X-Localiza-Client':'localiza-editor-v1','Content-Type':'application/json'};
const request=(url,options={})=>fetch(api+url,{...options,signal:AbortSignal.timeout(5000)});
try{
 assert.equal((await request('/api/health',{headers:{Origin:'https://externo.example'}})).status,403);
 assert.equal((await request('/api/scans',{method:'POST'})).status,403);
 assert.equal((await request('/api/scansXYZ')).status,404);
 const health=await (await request('/api/health')).json();assert.equal(health.localOnly,true);assert.equal(health.networkUploads,false);assert.equal(health.ready,true);
 let response=await request('/api/scans',{method:'POST',headers,body:JSON.stringify({building:'teste',floor:'Teste',mode:'structure',source:{type:'video',duration:12,frames:16}})});assert.equal(response.status,201);const job=await response.json();assert.equal(job.mode,'structure');assert.equal(job.source.type,'video');assert.equal(job.source.frames,16);
 assert.equal((await request(`/api/scans/${job.id}/process`,{method:'POST',headers})).status,400);
 assert.equal((await request(`/api/scans/${job.id}/photos`,{method:'POST',headers,body:'not a photo'})).status,415);
 // JPEG mínimo: o serviço confere o formato; o decodificador valida o conteúdo na etapa de preparação.
 const photo=Buffer.from([255,216,255,224,0,0,0,0]);const upload=()=>request(`/api/scans/${job.id}/photos`,{method:'POST',headers:{'X-Localiza-Client':'localiza-editor-v1'},body:photo});assert.equal((await upload()).status,201);response=await upload();assert.equal((await response.json()).duplicate,true);
 response=await request(`/api/scans/${job.id}/cancel`,{method:'POST',headers});assert.equal((await response.json()).status,'cancelled');assert.equal((await request(`/api/scans/${job.id}/model`)).status,404);
 for(const route of ['/.tools/runtime.json','/.localiza-data/scans/','/server/reconstruct.py','/node_modules/three/package.json'])assert.equal((await fetch('http://127.0.0.1:5174'+route,{signal:AbortSignal.timeout(3000)})).status,403);
 console.log('OK — motor somente local, origem externa recusada, formatos, duplicatas, mínimo de fotos, cancelamento e arquivos privados protegidos.');
}finally{await new Promise(resolve=>server.close(resolve));}
