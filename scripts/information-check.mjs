// Integration checks against the real HTTP handler and a disposable, isolated database.
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createInformationAPI} from '../server/information-api.mjs';
const directory=await mkdtemp(path.join(os.tmpdir(),'localiza-information-'));
let server,base,checks=0;
const check=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
async function start(){const api=await createInformationAPI({directory});server=http.createServer(async(req,res)=>{if(!await api(req,res)){res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/api/localiza`;}
async function stop(){await new Promise(resolve=>server.close(resolve));}
function client(){let cookie='';return async(route,method='GET',body,extra={})=>{const headers={...(cookie?{cookie}:{}),...(method!=='GET'?{'Content-Type':'application/json','X-Localiza-Client':'localiza-information-v1'}:{}),...extra};const response=await fetch(base+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const json=await response.json();assert(!/"(?:password|digest|salt)"\s*:/.test(JSON.stringify(json)),'credentials must never be serialized');checks++;return {status:response.status,json,headers:response.headers};};}
const password='Localiza-test-only-482!';
try{
 await start();const anonymous=client(),owner=client();
 check((await anonymous('/session')).json.configured,false,'empty installation');
 check((await anonymous('/information')).status,401,'no anonymous information');
 const setup=await owner('/setup','POST',{organization:'Organização de teste',name:'Admin teste',email:'admin@example.test',password});
 check(setup.status,201,'first administrator');const ownerUser=setup.json.user;
 assert.match(setup.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);checks++;
 check((await anonymous('/setup','POST',{})).status,409,'setup cannot be repeated');
 const session=(await owner('/session')).json;check(session.profiles.map(p=>p.name),['Auxiliar','Supervisor','Aprendiz'],'independent profiles');
 const [aux,supervisor,apprentice]=session.profiles.map(p=>p.id),profiles=[aux,supervisor,apprentice];
 const people=[],readers=[];
 for(let index=0;index<3;index++){
  const user={name:['Aux teste','Supervisor teste','Aprendiz teste'][index],email:`person${index}@example.test`,password,role:'member',active:true,profileIds:[profiles[index]]};
  const result=await owner('/people','POST',user);check(result.status,201);people.push(result.json.person);
  const reader=client();check((await reader('/login','POST',{email:user.email,password})).status,200);readers.push(reader);
 }
 const save=async(data,expected=201)=>{const result=await owner('/information','POST',{title:'Título livre',body:'Conteúdo novo sem tipo obrigatório',link:'',audience:'profiles',profileIds:[aux],status:'published',...data});check(result.status,expected);return result.json.item;};
 const general=await save({title:'Para todas as pessoas',audience:'everyone'}),restricted=[];
 for(let index=0;index<3;index++)restricted.push(await save({title:`Conteúdo privado ${index}`,body:`Segredo exclusivo ${index}`,profileIds:[profiles[index]]}));
 const draft=await save({title:'Rascunho sem publicar',status:'draft',audience:'everyone'});
 const ids=items=>items.map(item=>item.id).sort();
 for(let index=0;index<3;index++){
  const reader=readers[index];check(ids((await reader('/information')).json.items),[general.id,restricted[index].id].sort(),'no implicit hierarchy');
  check((await reader(`/information/${restricted[(index+1)%3].id}`)).status,404,'direct ID denial');
  check((await reader(`/information/${draft.id}`)).status,404,'draft denial');
  check((await reader('/information?q='+encodeURIComponent(`Segredo exclusivo ${(index+1)%3}`))).json.items,[],'search must not reveal forbidden text');
  check((await reader(`/information?preview=${profiles[(index+1)%3]}`)).status,403,'cannot impersonate another profile');
  check((await reader('/information?archived=1')).status,403);
  check((await reader('/information','POST',{})).status,403);
  check((await reader('/people')).status,403);
  check((await reader('/profiles')).status,403);
  check((await reader('/activity')).status,403);
  check((await reader('/session')).json.profiles.map(p=>p.id),[profiles[index]],'only own profile metadata');
  const item=(await reader(`/information/${general.id}`)).json.item;check('profileIds' in item,false,'do not reveal audience metadata');
 }
 check(ids((await owner('/information?preview='+aux)).json.items),[general.id,restricted[0].id].sort(),'server-side admin preview');
 await save({audience:'profiles',profileIds:[]},400);await save({link:'javascript:alert(1)'},400);await save({profileIds:['invalid']},400);
 const plain=await save({title:'<img src=x onerror=alert(1)>',body:'<script>test</script>\nTexto & dados',audience:'everyone'});
 check((await readers[0]('/information/'+plain.id)).json.item.body,plain.body,'plaintext preserved');
 let result=await owner('/information/'+restricted[0].id,'PUT',{...restricted[0],profileIds:[supervisor]});check(result.status,200);const updated=result.json.item;
 check((await readers[0]('/information/'+updated.id)).status,404,'audience change revokes existing session');
 check((await readers[1]('/information/'+updated.id)).status,200);
 check((await owner('/information/'+updated.id,'PUT',restricted[0])).status,409,'reject stale revisions');
 check((await owner('/information/'+updated.id+'/archive','POST',{})).status,200);
 check((await readers[1]('/information/'+updated.id)).status,404,'archive revokes read');
 check(ids((await owner('/information?archived=1')).json.items),[updated.id]);
 check((await owner('/information/'+updated.id+'/restore','POST',{})).json.item.status,'published');
 check((await readers[1]('/information/'+updated.id)).status,200);
 await owner('/information/'+draft.id+'/archive','POST',{});check((await owner('/information/'+draft.id+'/restore','POST',{})).json.item.status,'draft','restore never publishes a draft');
 check((await owner('/people/'+people[2].id,'PUT',{...people[2],profileIds:[aux]})).status,200);
 check((await readers[2]('/information/'+restricted[2].id)).status,404,'profile removal effective without login');
 check((await owner('/people/'+people[2].id,'PUT',{...people[2],active:false})).status,200);
 check((await readers[2]('/information')).status,401,'suspension invalidates existing session');
 check((await owner('/people/'+ownerUser.id,'PUT',{...ownerUser,active:false})).status,409,'retain an active administrator');
 check((await owner('/people/'+ownerUser.id,'PUT',{...ownerUser,role:'member',profileIds:[aux]})).status,409);
 check((await owner('/profiles','POST',{name:'Outro perfil livre',description:'Sem herança automática'})).status,201);
 check((await owner('/profiles','POST',{name:'Auxiliar',description:''})).status,409,'duplicate profile');
 check((await owner('/people/'+people[0].id,'PUT',{...people[0],password:'New-test-password-738!'})).status,200);
 check((await readers[0]('/information')).status,401,'password change invalidates existing sessions');
 const wrong=client();for(let i=0;i<5;i++)check((await wrong('/login','POST',{email:people[1].email,password:'wrong'})).status,401);check((await wrong('/login','POST',{email:people[1].email,password})).status,429,'rate limit');
 check((await owner('/information','POST',{}, {Origin:'http://evil.example'})).status,403,'origin check');
 check((await owner('/information','POST',{}, {'X-Localiza-Client':''})).status,403,'write header check');
 check((await owner('/logout','POST',{})).status,200);check((await owner('/information')).status,401,'logout');
 const file=JSON.parse(await readFile(path.join(directory,'information.json'),'utf8'));assert(!JSON.stringify(file).includes(password));checks++;
 await stop();await start();const restarted=client();check((await restarted('/session')).json.configured,true);check((await restarted('/login','POST',{email:'admin@example.test',password})).status,200);check((await restarted('/information')).json.items.some(item=>item.id===general.id),true,'persistence after restart');
 console.log(`OK — ${checks} verificações HTTP de autenticação, autorização, busca, revisão, revogação e persistência.`);
}finally{if(server?.listening)await stop();await rm(directory,{recursive:true,force:true});}
