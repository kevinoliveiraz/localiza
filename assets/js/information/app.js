import {request} from './api.js';
import * as view from './views.js';
import {read,save} from '../store.js';
const app=document.getElementById('app');
const state={session:{configured:true,user:null,profiles:[]},route:'informacoes',id:'',items:[],people:[],profiles:[],record:null,person:null,profile:null,activity:[],search:'',preview:'',archived:false,error:'',message:'',undoId:''};
let activeLoad=null,loadVersion=0,searchTimer=null,submitting=false,keepNotice=false;
const own=()=>state.session.user?.role==='owner';
const parseRoute=()=>{const source=location.hash.slice(1)||view.routes[document.body.dataset.page]||'informacoes',parts=source.split('?'),path=parts[0].split('/'),params=new URLSearchParams(parts[1]||'');return {route:path[0],id:path[1]||'',preview:params.get('perfil')||'',archived:params.get('arquivadas')==='1'};};
const navigate=hash=>{if(location.hash==='#'+hash)loadRoute();else{keepNotice=true;location.hash=hash;}};
function render(content){app.innerHTML=state.session.user?view.frame(state,content):view.authPage(state.session,{error:state.error,message:state.message});document.title='Localiza · '+({informacoes:'Informações',administracao:'Administração',pessoas:'Pessoas',perfis:'Perfis de acesso',nova:'Adicionar informação',editar:'Editar informação',informacao:'Informação',pessoa:'Acesso da pessoa',perfil:'Perfil de acesso'}[state.route]||'Informações');}
function clearPrivateState(){Object.assign(state,{items:[],people:[],profiles:[],record:null,person:null,profile:null,activity:[],search:'',preview:'',message:'',undoId:''});}
async function loadRoute(){
 activeLoad?.abort();activeLoad=new AbortController();const signal=activeLoad.signal,version=++loadVersion;state.error='';const parsed=parseRoute();Object.assign(state,parsed);app.innerHTML=view.loadingPage();
 try{
  const session=await request('/session',{signal});if(version!==loadVersion)return;state.session=session;
  if(!session.user){clearPrivateState();render();return;}
  if(!['informacoes','informacao'].includes(state.route)&&!own()){state.error='';render(view.deniedPage());return;}
  let content;
  if(state.route==='informacoes'){
   const data=await request('/information?'+new URLSearchParams({q:state.search,...(state.preview?{preview:state.preview}:{}),...(state.archived?{archived:'1'}:{})}),{signal});state.items=data.items;content=view.informationPage(state);
  }else if(['informacao','editar'].includes(state.route)){
   state.record=(await request('/information/'+encodeURIComponent(state.id),{signal})).item;content=state.route==='editar'?view.informationForm(state):view.informationDetail(state);
  }else if(state.route==='nova'){state.record=null;content=view.informationForm(state);
  }else if(state.route==='administracao'){state.activity=(await request('/activity',{signal})).activity;content=view.adminPage(state);
  }else if(['pessoas','pessoa'].includes(state.route)){
   state.people=(await request('/people',{signal})).people;if(state.route==='pessoas')content=view.peoplePage(state);else{state.person=state.id==='nova'?null:state.people.find(person=>person.id===state.id);if(state.id!=='nova'&&!state.person)throw new Error('Pessoa não encontrada.');content=view.personForm(state);}
  }else if(['perfis','perfil'].includes(state.route)){
   state.profiles=(await request('/profiles',{signal})).profiles;if(state.route==='perfis')content=view.profilesPage(state);else{state.profile=state.id==='novo'?null:state.profiles.find(profile=>profile.id===state.id);if(state.id!=='novo'&&!state.profile)throw new Error('Perfil não encontrado.');content=view.profileForm(state);}
  }else{navigate('informacoes');return;}
  if(version!==loadVersion)return;render(content);document.getElementById('info-main')?.focus({preventScroll:true});window.scrollTo(0,0);
 }catch(error){if(error.name==='AbortError'||version!==loadVersion)return;if(error.status===401){state.session.user=null;clearPrivateState();state.error='Sua sessão terminou. Entre novamente.';render();}else if(state.session.user){state.error='';render(view.deniedPage(error.message));}else{state.error=error.message;render();}}
}
function formError(form,message){const error=form.querySelector('[data-info-form-error]');if(error){error.textContent=message;error.hidden=false;error.focus?.();}else{state.error=message;}}
async function submit(event){
 const form=event.target.closest('[data-info-form]');if(!form)return;event.preventDefault();if(submitting)return;
 const kind=form.dataset.infoForm,fields=new FormData(form),values=Object.fromEntries(fields),buttons=[...form.querySelectorAll('button[type=submit]')];
 const error=form.querySelector('[data-info-form-error]');if(error)error.hidden=true;submitting=true;buttons.forEach(button=>button.disabled=true);
 try{
  if(['setup','login'].includes(kind)){await request('/'+kind,{method:'POST',body:values});clearPrivateState();state.error='';state.message=kind==='setup'?'Organização criada. Agora você pode adicionar sua primeira informação.':'';if(parseRoute().route==='informacao')await loadRoute();else navigate('informacoes');return;}
  if(kind==='information'){
   const data={title:values.title,body:values.body,link:values.link||'',audience:values.audience,profileIds:fields.getAll('profileIds'),status:event.submitter?.dataset.publishStatus||'draft',...(state.record?{revision:state.record.revision}:{})};if(data.audience==='profiles'&&!data.profileIds.length)throw new Error('Marque pelo menos um perfil em “Quem pode ver?” ou escolha todas as pessoas cadastradas.');
   const result=await request('/information'+(state.record?'/'+state.record.id:''),{method:state.record?'PUT':'POST',body:data});state.message=data.status==='draft'?'Rascunho salvo. Apenas a administração pode consultar.':'Informação publicada com o público escolhido.';state.undoId='';navigate('informacao/'+result.item.id);
  }else if(kind==='person'){
   const data={name:values.name,email:values.email,password:values.password||'',profileIds:fields.getAll('profileIds'),role:fields.has('admin')?'owner':'member',active:state.person?fields.has('active'):true};if(data.role==='member'&&!data.profileIds.length)throw new Error('Marque pelo menos um perfil de acesso para a pessoa.');await request('/people'+(state.person?'/'+state.person.id:''),{method:state.person?'PUT':'POST',body:data});state.message='Cadastro e acesso salvos.';state.undoId='';navigate(state.person?.id===state.session.user.id&&data.role!=='owner'?'informacoes':'pessoas');
  }else if(kind==='profile'){
   await request('/profiles'+(state.profile?'/'+state.profile.id:''),{method:state.profile?'PUT':'POST',body:values});state.message='Perfil salvo. O acesso às informações continua definido em cada publicação.';state.undoId='';navigate('perfis');
  }
 }catch(error){formError(form,error.message);}finally{submitting=false;buttons.forEach(button=>{if(button.isConnected)button.disabled=false;});}
}
async function search(){if(state.route!=='informacoes')return;activeLoad?.abort();activeLoad=new AbortController();const version=++loadVersion,signal=activeLoad.signal;try{const result=await request('/information?'+new URLSearchParams({q:state.search,...(state.preview?{preview:state.preview}:{}),...(state.archived?{archived:'1'}:{})}),{signal});if(version!==loadVersion||state.route!=='informacoes')return;state.items=result.items;const target=document.getElementById('information-results');if(target)target.innerHTML=view.informationRows(state);const count=document.querySelector('[data-info-count]');if(count)count.textContent=result.items.length+' '+(result.items.length===1?'informação':'informações');}catch(error){if(error.name!=='AbortError')loadRoute();}}
document.addEventListener('submit',submit);
document.addEventListener('input',event=>{if(event.target.matches('[data-info-search]')){state.search=event.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(search,230);}});
document.addEventListener('change',event=>{
 if(event.target.matches('[data-info-preview]')){state.search='';navigate('informacoes'+(event.target.value?'?perfil='+encodeURIComponent(event.target.value):''));}
 if(event.target.name==='audience'){const target=document.querySelector('[data-info-profile-options]');if(target)target.hidden=event.target.value==='everyone';}
});
document.addEventListener('click',async event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();document.getElementById('info-main')?.focus();return;}
 const target=event.target.closest('[data-info-action]');if(!target)return;const action=target.dataset.infoAction;
 if(action==='theme'){const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;save({theme});return;}
 if(action==='logout'){target.disabled=true;activeLoad?.abort();loadVersion++;try{await request('/logout',{method:'POST',body:{}});}catch{}clearPrivateState();state.session.user=null;state.error='';render();return;}
 if(['archive','restore'].includes(action)){target.disabled=true;try{await request(`/information/${encodeURIComponent(target.dataset.id)}/${action}`,{method:'POST',body:{}});state.message=action==='archive'?'Informação arquivada. Ela não aparece mais para os colaboradores.':'Informação restaurada.';state.undoId=action==='archive'?target.dataset.id:'';navigate('informacoes');}catch(error){const notice=document.createElement('p');notice.className='info-error';notice.setAttribute('role','alert');notice.textContent=error.message;document.getElementById('info-main')?.prepend(notice);}finally{target.disabled=false;}}
});
window.addEventListener('hashchange',()=>{clearTimeout(searchTimer);state.search='';if(!keepNotice){state.message='';state.undoId='';}keepNotice=false;loadRoute();});
document.documentElement.dataset.theme=read().theme==='dark'?'dark':'light';
loadRoute();
