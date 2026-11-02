import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,appendFile,mkdir,readdir,stat,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const clientHeader='localiza-editor-v1';
const maxPhoto=20*1024*1024,maxJob=600*1024*1024,maxPhotos=160;
export const stages=['preparing','features','matching','sparse','dense','mesh','texture','export','structure'];
const exists=async file=>{try{await access(file);return true}catch{return false}};
const safeId=id=>/^[a-f0-9-]{36}$/.test(id);
const localHost=hostname=>['localhost','127.0.0.1','[::1]','::1'].includes(hostname);
const isLocalOrigin=origin=>{try{return ['http:','https:'].includes(new URL(origin).protocol)&&localHost(new URL(origin).hostname)}catch{return false}};
export async function runtimeConfig(){
 let config={};try{config=JSON.parse(await readFile(path.join(root,'.tools/runtime.json'),'utf8'))}catch{}
 const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
 const python=process.env.LOCALIZA_PYTHON||config.python||(await exists(bundled)?bundled:'python');
 const openmvs=process.env.LOCALIZA_OPENMVS||path.resolve(root,'.tools',config.openmvs||'openmvs/vc17/x64/Release');
 return {python,openmvs,pythonPackages:path.join(root,'.tools/python'),ready:await exists(path.join(root,'.tools/python/pycolmap'))&&await exists(path.join(openmvs,process.platform==='win32'?'DensifyPointCloud.exe':'DensifyPointCloud'))};
}
async function body(request,limit){let length=0;const chunks=[];for await(const chunk of request){length+=chunk.length;if(length>limit)throw Object.assign(new Error('Arquivo maior que o limite permitido.'),{status:413});chunks.push(chunk)}return Buffer.concat(chunks)}
const jsonBody=async request=>{try{return JSON.parse((await body(request,64*1024)).toString('utf8')||'{}')}catch(error){if(error.status)throw error;throw Object.assign(new Error('Dados JSON inválidos.'),{status:400})}};
export async function startPhotoService({port=Number(process.env.LOCALIZA_API_PORT||5175),dataDir=process.env.LOCALIZA_DATA_DIR||path.join(root,'.localiza-data')}={}){
 const scansDir=path.resolve(dataDir,'scans');await mkdir(scansDir,{recursive:true});const config=await runtimeConfig();
 const jobs=new Map(),children=new Map();let running=false;
 const folder=id=>path.join(scansDir,id);
 const writes=new Map();
 const persist=job=>{const snapshot=JSON.stringify(job,null,2);const write=(writes.get(job.id)||Promise.resolve()).catch(()=>{}).then(()=>writeFile(path.join(folder(job.id),'job.json'),snapshot));writes.set(job.id,write);return write;};
 const publicJob=job=>({...job,files:undefined,file:undefined,modelUrl:job.file?`http://127.0.0.1:${port}/api/scans/${job.id}/model`:null,logUrl:`http://127.0.0.1:${port}/api/scans/${job.id}/log`});
 for(const id of await readdir(scansDir)){if(!safeId(id))continue;try{const job=JSON.parse(await readFile(path.join(folder(id),'job.json'),'utf8'));if(['queued','running'].includes(job.status)){job.status='interrupted';job.message='O motor local foi encerrado. Crie um novo trabalho para tentar novamente.';await persist(job)}jobs.set(id,job)}catch{}}
 const update=async(job,patch)=>{Object.assign(job,patch,{updatedAt:new Date().toISOString()});await persist(job)};
 async function next(){
  if(running)return;const job=[...jobs.values()].find(item=>item.status==='queued');if(!job)return;running=true;
  await update(job,{status:'running',startedAt:new Date().toISOString(),stage:'preparing',message:'Preparando a reconstrução local.'});
 const env={...process.env,PYTHONPATH:config.pythonPackages,PYTHONUNBUFFERED:'1',PYTHONIOENCODING:'utf-8',OMP_NUM_THREADS:'4',OPENBLAS_NUM_THREADS:'4'};
  const child=spawn(config.python,[path.join(root,'server/reconstruct.py'),'--job',folder(job.id),'--openmvs',config.openmvs,'--quality',job.quality,'--mode',job.mode||'mesh'],{cwd:folder(job.id),env,windowsHide:true});children.set(job.id,child);
  let output='',result=null,workerError=null,logQueue=Promise.resolve();
  let logBytes=0;const log=text=>{if(logBytes>10_000_000)return;logBytes+=Buffer.byteLength(text);logQueue=logQueue.then(()=>appendFile(path.join(folder(job.id),'process.log'),text)).catch(()=>{});};
  child.stdout.on('data',chunk=>{output+=chunk.toString('utf8');let newline;while((newline=output.indexOf('\n'))>=0){const line=output.slice(0,newline);output=output.slice(newline+1);try{const event=JSON.parse(line);if(event.type==='stage'&&stages.includes(event.stage)){update(job,{stage:event.stage,message:String(event.message).slice(0,1000)}).catch(()=>{});}else if(event.type==='metrics'){job.metrics={registeredImages:event.registeredImages,inputImages:event.inputImages,sparsePoints:event.sparsePoints};}else if(event.type==='result')result=event;else if(event.type==='error')workerError=String(event.message);log(line+'\n');}catch{log(line+'\n')}}});
  child.stderr.on('data',chunk=>log(chunk.toString('utf8')));
  const complete=async(code,error)=>{if(!children.has(job.id))return;children.delete(job.id);await logQueue;if(job.status==='cancelled'){running=false;next();return;}if(code===0&&result&&['model.glb','sparse-preview.ply','structure.json'].includes(result.file)&&await exists(path.join(folder(job.id),result.file))){await update(job,{status:'completed',stage:result.stage,file:result.file,format:result.format,message:result.message,seconds:result.seconds,finishedAt:new Date().toISOString()});}else await update(job,{status:'failed',message:workerError||error?.message||'A reconstrução não foi concluída. Confira as fotografias e o registro local.'});running=false;next();};
  child.once('error',error=>complete(null,error));child.once('exit',code=>complete(code));
 }
 const server=http.createServer(async(request,response)=>{
  const origin=request.headers.origin;
  const host=request.headers.host||'';
  try{
   const hostName=new URL('http://'+host).hostname;
   if(!localHost(hostName)||origin&&!isLocalOrigin(origin)){response.writeHead(403);response.end('Somente acesso local.');return;}
   const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   if(origin){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';}
   const send=(status,value)=>{response.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});response.end(JSON.stringify(value));};
   if(request.method==='OPTIONS'){response.writeHead(204,{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Localiza-Client'});response.end();return;}
   const url=new URL(request.url,'http://127.0.0.1');const parts=url.pathname.split('/').filter(Boolean);
   if(url.pathname==='/api/health'&&request.method==='GET'){send(200,{service:'localiza-photo-engine',version:2,structureVideo:true,ready:config.ready,localOnly:true,networkUploads:false,threads:4,maxPhotos,maxPhotoBytes:maxPhoto,stages});return;}
   if(parts[0]!=='api'||parts[1]!=='scans'){send(404,{error:'Rota não encontrada.'});return;}
   if(request.method==='POST'&&request.headers['x-localiza-client']!==clientHeader){send(403,{error:'Cliente local não identificado.'});return;}
   if(parts.length===2&&request.method==='GET'){const building=url.searchParams.get('building'),floor=url.searchParams.get('floor');send(200,[...jobs.values()].filter(job=>(!building||job.building===building)&&(!floor||job.floor===floor)).slice(-20).reverse().map(publicJob));return;}
   if(parts.length===2&&request.method==='POST'){
    if(!config.ready){send(503,{error:'O motor precisa ser instalado. Execute npm run setup:photos na pasta do projeto.'});return;}
    const data=await jsonBody(request),id=randomUUID();const job={id,building:String(data.building||'').slice(0,100),floor:String(data.floor||'').slice(0,100),quality:data.quality==='balanced'?'balanced':'fast',mode:data.mode==='structure'?'structure':'mesh',source:data.mode==='structure'?{type:'video',duration:Math.max(0,Math.min(180,Number(data.source?.duration)||0)),frames:Math.max(0,Math.min(80,Number(data.source?.frames)||0))}:null,status:'uploading',stage:'uploading',message:'Recebendo fotografias no computador.',createdAt:new Date().toISOString(),files:[],photoCount:0,bytes:0};
    await mkdir(path.join(folder(id),'images'),{recursive:true});await persist(job);jobs.set(id,job);send(201,publicJob(job));return;
   }
   const id=parts[2];if(!safeId(id)||!jobs.has(id)){send(404,{error:'Trabalho local não encontrado.'});return;}const job=jobs.get(id),action=parts[3];
   if(parts.length===3&&request.method==='GET'){send(200,publicJob(job));return;}
   if(action==='photos'&&request.method==='POST'){
    if(job.status!=='uploading'){send(409,{error:'Este trabalho já saiu da etapa de seleção de fotos.'});return;}
    if(job.photoCount>=maxPhotos){send(413,{error:'Limite de fotografias atingido.'});return;}
    const content=await body(request,maxPhoto);
    const jpeg=content[0]===255&&content[1]===216&&content[2]===255,png=content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),webp=content.toString('ascii',0,4)==='RIFF'&&content.toString('ascii',8,12)==='WEBP';
    if(!jpeg&&!png&&!webp){send(415,{error:'Use fotografias JPG, PNG ou WebP válidas.'});return;}
    if(job.bytes+content.length>maxJob){send(413,{error:'O conjunto ultrapassou 600 MB. Reduza o número ou o tamanho das fotos.'});return;}
    const hash=createHash('sha256').update(content).digest('hex');if(job.files.some(file=>file.hash===hash)){send(200,{...publicJob(job),duplicate:true});return;}
    const name=`photo_${String(job.photoCount).padStart(4,'0')}.${jpeg?'jpg':png?'png':'webp'}`;await writeFile(path.join(folder(id),'images',name),content,{flag:'wx'});job.files.push({name,hash,bytes:content.length});await update(job,{photoCount:job.photoCount+1,bytes:job.bytes+content.length});send(201,publicJob(job));return;
   }
   if(action==='process'&&request.method==='POST'){
    if(job.status!=='uploading'){send(409,{error:'Este trabalho já foi iniciado.'});return;}
    if(job.photoCount<8){send(400,{error:'Importe pelo menos 8 fotografias diferentes e sobrepostas.'});return;}
    await update(job,{status:'queued',stage:'queued',message:'Na fila do motor local.'});send(202,publicJob(job));next();return;
   }
   if(action==='cancel'&&request.method==='POST'){
    if(!['uploading','queued','running'].includes(job.status)){send(409,{error:'O trabalho já foi encerrado.'});return;}
    await update(job,{status:'cancelled',message:'Processamento interrompido pelo usuário.'});const child=children.get(id);if(child){if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true});else child.kill('SIGTERM');}send(200,publicJob(job));return;
   }
   if(action==='model'&&request.method==='GET'){
    if(job.status!=='completed'||!job.file){send(404,{error:'O modelo ainda não está pronto.'});return;}const file=path.join(folder(id),job.file);const info=await stat(file);if(info.size>180*1024*1024){send(413,{error:'O modelo ultrapassou o limite de visualização de 180 MB.'});return;}response.writeHead(200,{...headers,'Content-Type':job.format==='glb'?'model/gltf-binary':job.format==='plan'?'application/json; charset=utf-8':'application/octet-stream','Content-Length':info.size});response.end(await readFile(file));return;
   }
   if(action==='log'&&request.method==='GET'){let text=job.message;try{text=await readFile(path.join(folder(id),'process.log'),'utf8')}catch{}response.writeHead(200,{...headers,'Content-Type':'text/plain; charset=utf-8'});response.end(text);return;}
   send(404,{error:'Rota não encontrada.'});
  }catch(error){if(!response.headersSent)response.writeHead(error.status||500,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin&&isLocalOrigin(origin)?origin:'null','Cache-Control':'no-store'});response.end(JSON.stringify({error:error.status?error.message:'Não foi possível concluir a operação local.'}));}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve)});
 server.on('close',()=>{for(const child of children.values())child.kill();});
 console.log(`Motor de fotos local: http://127.0.0.1:${port} (${config.ready?'pronto':'instalação pendente'})`);
 return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))startPhotoService().catch(error=>{console.error(error.message);process.exitCode=1});
