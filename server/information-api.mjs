import {randomBytes,createHash} from 'node:crypto';
import {openInformationStore,problem,verifyPassword,publicUser,mayRead,publicInformation} from './information-store.mjs';
const PREFIX='/api/localiza',COOKIE='localiza_session',TTL=12*60*60*1000;
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function createInformationAPI({directory}){
 const store=await openInformationStore(directory),sessions=new Map(),attempts=new Map();
 const issue=(user,response)=>{const token=randomBytes(32).toString('hex'),account=store.snapshot().users.find(item=>item.id===user.id);for(const [key,session]of sessions)if(session.expires<Date.now())sessions.delete(key);sessions.set(hash(token),{userId:user.id,credential:account.password.digest,expires:Date.now()+TTL});response.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL/1000}`);};
 const current=request=>{const token=(request.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const key=hash(token),session=sessions.get(key);if(!session||session.expires<Date.now()){sessions.delete(key);return null;}return store.snapshot().users.find(user=>user.id===session.userId&&user.active&&user.password.digest===session.credential)||null;};
 const readBody=async request=>{let size=0;const chunks=[];for await(const chunk of request){size+=chunk.length;if(size>96*1024)throw problem(413,'O texto enviado excedeu o limite.');chunks.push(chunk);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw problem(400,'Dados inválidos.');}if(!input||typeof input!=='object'||Array.isArray(input))throw problem(400,'Dados inválidos.');return input;};
 return async(request,response)=>{
  const url=new URL(request.url,'http://localhost');if(!url.pathname.startsWith(PREFIX+'/')&&url.pathname!==PREFIX)return false;
  const send=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(value));return true;};
  try{
   const host=new URL('http://'+request.headers.host),local=['localhost','127.0.0.1','[::1]'].includes(host.hostname);if(!local)throw problem(403,'Acesso disponível somente neste computador.');
   if(request.headers.origin&&request.headers.origin!==host.origin)throw problem(403,'Origem não permitida.');
   if(!['GET','POST','PUT'].includes(request.method))throw problem(405,'Método não permitido.');
   if(request.method!=='GET'&&request.headers['x-localiza-client']!=='localiza-information-v1')throw problem(403,'Solicitação não identificada.');
   const route=url.pathname.slice(PREFIX.length),actor=current(request),db=store.snapshot();
   if(route==='/session'&&request.method==='GET')return send(200,{configured:db.users.length>0,organization:actor?db.organization:'',user:actor?publicUser(actor):null,profiles:actor?db.profiles.filter(profile=>actor.role==='owner'||actor.profileIds.includes(profile.id)):[]});
   if(route==='/setup'&&request.method==='POST'){const user=await store.setup(await readBody(request));issue(user,response);return send(201,{user});}
   if(route==='/login'&&request.method==='POST'){
    const input=await readBody(request),mail=typeof input.email==='string'?input.email.trim().toLowerCase().slice(0,180):'',key=request.socket.remoteAddress+'|'+mail,ipKey='ip:'+request.socket.remoteAddress,time=Date.now();
    for(const [id,item]of attempts)if(item.until<time)attempts.delete(id);const previous=attempts.get(key)||{count:0,until:time+15*60*1000},ip=attempts.get(ipKey)||{count:0,until:time+15*60*1000};if(previous.count>=5||ip.count>=30)throw problem(429,'Muitas tentativas. Aguarde 15 minutos e tente novamente.');
    attempts.set(key,{...previous,count:previous.count+1});attempts.set(ipKey,{...ip,count:ip.count+1});
    const user=db.users.find(item=>item.email===mail),valid=await verifyPassword(input.password,user?.password),latest=store.snapshot().users.find(item=>item.id===user?.id&&item.active);
    if(!valid||!latest||latest.password.digest!==user.password.digest){throw problem(401,'E-mail ou senha incorretos.');}attempts.delete(key);const currentIP=attempts.get(ipKey);if(currentIP)currentIP.count=Math.max(0,currentIP.count-1);issue(latest,response);return send(200,{user:publicUser(latest)});
   }
   if(!actor)throw problem(401,'Entre com sua conta para consultar as informações.');
   if(route==='/logout'&&request.method==='POST'){for(const token of (request.headers.cookie||'').split(';'))if(token.trim().startsWith(COOKIE+'='))sessions.delete(hash(token.trim().slice(COOKIE.length+1)));response.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);return send(200,{ok:true});}
   const owner=actor.role==='owner',parts=route.split('/').filter(Boolean),id=parts[1];
   if(parts[0]==='information'){
    if(request.method==='GET'&&parts.length===1){const preview=url.searchParams.get('preview'),archived=url.searchParams.get('archived')==='1';if(preview&&(!owner||!db.profiles.some(p=>p.id===preview)))throw problem(403,'Prévia indisponível para esta conta.');if(archived&&!owner)throw problem(403,'Acesso exclusivo da administração.');const reader=preview?{active:true,role:'member',profileIds:[preview]}:actor;let items=db.information.filter(item=>mayRead(reader,item));if(owner&&!preview)items=items.filter(item=>archived?item.status==='archived':item.status!=='archived');const query=(url.searchParams.get('q')||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');if(query)items=items.filter(item=>(item.title+' '+item.body).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(query));return send(200,{items:items.map(item=>publicInformation(item,owner&&!preview))});}
    if(request.method==='GET'&&parts.length===2){const item=db.information.find(item=>item.id===id);if(!item||!mayRead(actor,item))throw problem(404,'Informação não encontrada ou não liberada para seu perfil.');return send(200,{item:publicInformation(item,owner)});}
    if(!owner)throw problem(403,'Esta ação é exclusiva da administração.');
    if(request.method==='POST'&&parts.length===1)return send(201,{item:await store.saveInformation(actor.id,await readBody(request))});
    if(request.method==='PUT'&&parts.length===2)return send(200,{item:await store.saveInformation(actor.id,await readBody(request),id)});
    if(request.method==='POST'&&parts.length===3&&['archive','restore'].includes(parts[2]))return send(200,{item:await store.archiveInformation(actor.id,id,parts[2]==='restore')});
   }
   if(!owner)throw problem(403,'Esta ação é exclusiva da administração.');
   if(parts[0]==='profiles'){
    if(request.method==='GET'&&parts.length===1)return send(200,{profiles:db.profiles.map(p=>({...p,peopleCount:db.users.filter(user=>user.active&&user.profileIds.includes(p.id)).length,informationCount:db.information.filter(item=>item.status==='published'&&(item.audience==='everyone'||item.profileIds.includes(p.id))).length}))});
    if(request.method==='POST'&&parts.length===1)return send(201,{profile:await store.saveProfile(actor.id,await readBody(request))});
    if(request.method==='PUT'&&parts.length===2)return send(200,{profile:await store.saveProfile(actor.id,await readBody(request),id)});
   }
   if(parts[0]==='people'){
    if(request.method==='GET'&&parts.length===1)return send(200,{people:db.users.map(publicUser)});
    if(request.method==='POST'&&parts.length===1)return send(201,{person:await store.saveUser(actor.id,await readBody(request))});
    if(request.method==='PUT'&&parts.length===2)return send(200,{person:await store.saveUser(actor.id,await readBody(request),id)});
   }
   if(route==='/activity'&&request.method==='GET')return send(200,{activity:db.activity.slice(0,30)});
   return send(404,{error:'Rota não encontrada.'});
  }catch(error){return send(error.status||500,{error:error.status?error.message:'Não foi possível concluir a operação. Seus dados não foram publicados.'});}
 };
}
