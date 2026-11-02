import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startPhotoService} from '../server/photo-server.mjs';
import {createInformationAPI} from '../server/information-api.mjs';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||5173);
const informationAPI=await createInformationAPI({directory:process.env.LOCALIZA_INFO_DIR||path.join(projectRoot,'.localiza-data/information')});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  if(await informationAPI(req,res))return;
  const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
  const parts=relative.split(/[\\/]/);
  if(parts.some(part=>part.startsWith('.'))||!['index.html','paginas','assets'].includes(parts[0])){res.writeHead(403);res.end('Forbidden');return;}
  const target=path.resolve(projectRoot,relative);
  if(!target.startsWith(projectRoot+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  const info=await stat(target),file=info.isDirectory()?path.join(target,'index.html'):target;
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Localiza: http://localhost:${port}`));
let photoService;
try{let existing=false;try{const health=await fetch('http://127.0.0.1:5175/api/health',{signal:AbortSignal.timeout(1200)});existing=(await health.json()).service==='localiza-photo-engine';}catch{}if(existing)console.log('Motor local já está na porta 5175.');else photoService=await startPhotoService();}catch(error){if(error.code==='EADDRINUSE')console.log('Motor local já está na porta 5175.');else console.error('Motor de fotos: '+error.message);}
const stop=()=>{photoService?.close();server.close();process.exit(0);};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
