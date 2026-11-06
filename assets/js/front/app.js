import {mountRouteViewer} from '../routes/route-viewer.js?v=20261106-route3d';
import {Journey,buildGuide} from '../routes/guidance.js?v=20261106-route3d';
import * as store from './store.js';
import * as view from './views.js?v=20261106-route3d';
import {read,save} from '../store.js';
import * as routeViews from '../routes/views.js?v=20261106-route3d';
import {readRoutes,removeRoute} from '../routes/store.js?v=20261106-route3d';
import {mountRecorder} from '../routes/controller.js?v=20261106-route3d';
import {readDraft} from '../routes/drafts.js?v=20261106-route3d';
import {navigationPage} from '../routes/navigation-views.js?v=20261106-route3d';
import {mountNavigation} from '../routes/navigation.js?v=20261106-route3d';
const app=document.getElementById('app');
let disposeRecorder=null;
const defaults={administracao:'administracao',membros:'pessoas',departamentos:'perfis',mapeamento:'mapas'};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={data:store.readPreview(),routes:[],theme:read().theme==='dark'?'dark':'light',motionPaused:reducedMotion.matches||Boolean(read().homeMotionPaused),route:'buscar',query:'',searched:false,filterIds:null,record:null,draft:null,person:null,profile:null,message:'',warning:'',archived:false};
const admin=()=>store.isAdmin(state.data);
const navigate=path=>{if(location.hash==='#'+path)load();else location.hash=path;};
function commit(work){const next=structuredClone(state.data),result=work(next);store.persistPreview(next);state.data=next;return result;}
function syncMotionButton(){const button=document.querySelector('[data-front-action="motion"]');if(button)button.outerHTML=view.motionButton(state.motionPaused);}
function setupHomeVideo(){const video=document.querySelector('[data-home-video]');if(!video||state.motionPaused)return;video.muted=true;video.src=video.dataset.videoSrc;video.play().catch(()=>{if(video.isConnected){state.motionPaused=true;syncMotionButton();}});video.addEventListener('error',()=>{if(video.isConnected){state.motionPaused=true;syncMotionButton();}},{once:true});}
function render(content){disposeRecorder?.();disposeRecorder=null;app.innerHTML=view.frame(state,content);setupHomeVideo();document.title='Localiza · '+({mapas:'Criar e testar rotas','criar-mapa':'Criar percurso',percurso:'Percurso',buscar:'Buscar',administracao:'Ferramentas',paginas:'Páginas de informação',nova:'Criar página',editar:'Editar página',pagina:state.record?.title,pessoas:'Pessoas',pessoa:'Pessoa',perfis:'Perfis',perfil:'Perfil'}[state.route]||'Buscar');}
function load(){disposeRecorder?.();disposeRecorder=null;const [path,queryString='']=(location.hash.slice(1)||defaults[document.body.dataset.page]||'buscar').split('?'),[route,id]=path.split('/'),params=new URLSearchParams(queryString);Object.assign(state,{route,navigationFromAdmin:route==='navegar'&&params.get('voltar')==='mapas'&&admin(),routes:readRoutes(),query:params.get('q')||'',searched:params.has('q')||params.has('todos'),filterIds:null,archived:params.get('arquivadas')==='1',warning:''});let content,routeRecord=null;
 if(!admin()&&route==='mapas'){navigate('buscar?todos=1');return;}
 if(!admin()&&!['buscar','pagina','percurso','navegar'].includes(route)){render(view.denied());return;}
 if(route==='buscar')content=state.searched?view.results(state):view.home(state);
 else if(route==='mapas')content=routeViews.list(state.routes,admin(),Boolean(readDraft()));
 else if(route==='criar-mapa')content=routeViews.workspace();
 else if(route==='editar-percurso'){routeRecord=readRoutes().find(item=>item.id===id);content=routeRecord?routeViews.workspace(routeRecord):view.denied();}
 else if(route==='navegar'){routeRecord=readRoutes().find(item=>item.id===id);content=routeRecord?navigationPage(routeRecord,{testing:state.navigationFromAdmin,backTo:params.get('voltar')==='mapas'?(admin()?'mapas':'buscar?todos=1'):params.get('voltar')}):view.denied();}
 else if(route==='percurso'){routeRecord=readRoutes().find(item=>item.id===id);content=routeRecord?routeViews.detail(routeRecord,admin()):view.denied();}
 else if(route==='administracao')content=view.admin(state);
 else if(route==='paginas')content=view.manage(state);
 else if(route==='pagina'){state.record=state.data.pages.find(page=>page.id===id&&(admin()||store.visiblePages(state.data).some(p=>p.id===id)));content=state.record?view.detail(state):view.denied();}
 else if(['nova','editar'].includes(route)){const page=route==='editar'?state.data.pages.find(p=>p.id===id&&p.status!=='archived'):null;if(route==='editar'&&!page){render(view.denied());return;}state.draft=structuredClone(page||{title:'',body:'',link:'',table:null,audience:'profiles',profileIds:[],status:'draft'});content=view.editor(state);}
 else if(route==='pessoas')content=view.people(state);
 else if(route==='pessoa'){state.person=state.data.people.find(p=>p.id===id)||null;if(id!=='nova'&&!state.person){render(view.denied());return;}content=view.personForm(state);}
 else if(route==='perfis')content=view.profiles(state);
 else if(route==='perfil'){state.profile=state.data.profiles.find(p=>p.id===id)||null;if(id!=='novo'&&!state.profile){render(view.denied());return;}content=view.profileForm(state);}
 else{navigate('buscar');return;}
 render(content);if(route==='criar-mapa'||route==='editar-percurso'&&routeRecord)disposeRecorder=mountRecorder(document.querySelector('[data-route-workspace]'),{navigate,record:routeRecord});if(route==='editar-percurso')document.title='Localiza · Editar percurso';if(route==='navegar'&&routeRecord){disposeRecorder=mountNavigation(document.querySelector('[data-route-navigation]'),{route:routeRecord});document.title='Localiza · Navegar até '+routeRecord.end;}if(route==='percurso'&&routeRecord){try{const preview=mountRouteViewer(document.querySelector('[data-route-preview] [data-route-viewer]'),{journey:new Journey(buildGuide(routeRecord))});disposeRecorder=()=>preview.dispose();}catch{}}document.getElementById('conteudo')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});state.message='';
}
function collectPage(form){const fields=new FormData(form),table=state.draft.table?{columns:[...form.querySelectorAll('[data-column]')].map(input=>input.value),rows:state.draft.table.rows.map((_,row)=>state.draft.table.columns.map((_,col)=>form.querySelector(`[data-cell-row="${row}"][data-cell-column="${col}"]`)?.value||''))}:null;return {...state.draft,title:fields.get('title'),body:fields.get('body'),link:fields.get('link'),audience:fields.get('audience'),profileIds:fields.getAll('profileIds'),table};}
function showError(form,error){const target=form.querySelector('[data-front-error]');target.textContent=error.message;target.hidden=false;target.focus();}
document.addEventListener('submit',event=>{const form=event.target.closest('[data-front-form]');if(!form)return;event.preventDefault();const kind=form.dataset.frontForm,fields=new FormData(form);try{
 if(kind==='search'){const query=String(fields.get('q')||'').trim();navigate('buscar?'+(query&&store.normalize(query)!=='todos'?'q='+encodeURIComponent(query):'todos=1'));return;}
 if(!admin())throw new Error('Volte à simulação de Administrador para editar a prévia.');
 if(kind==='page'){const input={...collectPage(form),status:event.submitter?.value||'draft'},page=commit(data=>store.savePage(data,input,state.draft.id));state.message=page.status==='draft'?'Rascunho salvo na prévia.':'Página publicada na prévia.';navigate('pagina/'+page.id);}
 if(kind==='profile'){commit(data=>store.saveProfile(data,Object.fromEntries(fields),state.profile?.id));state.message='Perfil salvo na prévia.';navigate('perfis');}
 if(kind==='person'){commit(data=>store.savePerson(data,{...Object.fromEntries(fields),profileIds:fields.getAll('profileIds'),admin:fields.has('admin')},state.person?.id));state.message='Pessoa salva na prévia.';navigate('pessoas');}
 }catch(error){showError(form,error);}});
document.addEventListener('change',event=>{
 if(event.target.matches('[data-front-viewer]')){try{commit(data=>{data.viewer=event.target.value;});state.message='';navigate('buscar');}catch(error){state.warning=error.message;load();}}
 if(event.target.matches('[data-front-filter]')){state.filterIds=[...document.querySelectorAll('[data-front-filter]:checked')].map(input=>input.value);const selected=[...state.filterIds];render(view.results(state));state.filterIds=selected;}
 if(event.target.name==='audience'){const target=document.querySelector('[data-front-profile-options]');if(target)target.hidden=event.target.value==='everyone';}
});
document.addEventListener('click',event=>{const deletion=event.target.closest('[data-route-delete]');if(deletion&&admin()){try{removeRoute(deletion.dataset.routeDelete);state.message='Percurso excluído deste navegador.';navigate('mapas');}catch(error){const target=document.querySelector('[data-route-delete-error]');target.hidden=false;target.textContent=error.message;}return;}const skip=event.target.closest('.skip-link');if(skip){event.preventDefault();if(route==='percurso'&&routeRecord){try{const preview=mountRouteViewer(document.querySelector('[data-route-preview] [data-route-viewer]'),{journey:new Journey(buildGuide(routeRecord))});disposeRecorder=()=>preview.dispose();}catch{}}document.getElementById('conteudo')?.focus();return;}const button=event.target.closest('[data-front-action]');if(!button)return;const action=button.dataset.frontAction;
 if(action==='theme'){state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;try{save({theme:state.theme});}catch{}button.outerHTML=view.themeButton(state.theme);document.querySelector('[data-front-action="theme"]')?.focus({preventScroll:true});return;}
 if(action==='motion'){const video=document.querySelector('[data-home-video]');if(!video)return;state.motionPaused=!state.motionPaused;if(state.motionPaused)video.pause();else{if(!video.getAttribute('src'))video.src=video.dataset.videoSrc;video.play().catch(()=>{if(video.isConnected){state.motionPaused=true;syncMotionButton();}});}try{save({homeMotionPaused:state.motionPaused});}catch{}syncMotionButton();document.querySelector('[data-front-action="motion"]')?.focus({preventScroll:true});return;}
 if(action==='clear-filters'){state.filterIds=null;render(view.results(state));return;}
 if(action==='preview-profile'){try{commit(data=>{data.viewer=button.dataset.id;});navigate('buscar');}catch(error){state.warning=error.message;render(view.profiles(state));}return;}
 if(!admin())return;
 if(['archive','restore'].includes(action)){try{commit(data=>{const page=data.pages.find(p=>p.id===button.dataset.id);if(!page)throw new Error('Página não encontrada.');if(action==='archive'){page.previousStatus=page.status;page.status='archived';}else{page.status=page.previousStatus||'draft';delete page.previousStatus;}page.updatedAt=new Date().toISOString();});state.message=action==='archive'?'Página arquivada na prévia. Você pode restaurá-la em Páginas arquivadas.':'Página restaurada na prévia.';navigate('paginas');}catch(error){state.warning=error.message;render(view.manage(state));}return;}
 const form=button.closest('[data-front-form="page"]');if(!form)return;state.draft=collectPage(form);const table=state.draft.table;
 if(action==='add-table')state.draft.table={columns:['',''],rows:[['','']]};
 if(action==='add-row'&&table){if(table.rows.length>=200){showError(form,new Error('A prévia permite até 200 linhas.'));return;}table.rows.push(table.columns.map(()=>''));}
 if(action==='add-column'&&table){if(table.columns.length>=10){showError(form,new Error('A prévia permite até 10 colunas.'));return;}table.columns.push('');table.rows.forEach(row=>row.push(''));}
 if(action==='remove-row'&&table){table.rows.splice(Number(button.dataset.index),1);if(!table.rows.length)table.rows.push(table.columns.map(()=>''));}
 if(action==='remove-column'&&table){const index=Number(button.dataset.index);table.columns.splice(index,1);table.rows.forEach(row=>row.splice(index,1));if(!table.columns.length)state.draft.table=null;}
 if(action==='remove-table')state.draft.table=null;
 form.querySelector('[data-front-table-editor]').innerHTML=view.tableEditor(state.draft.table);
});
window.addEventListener('hashchange',load);
reducedMotion.addEventListener('change',event=>{if(event.matches){state.motionPaused=true;document.querySelector('[data-home-video]')?.pause();syncMotionButton();}});
document.documentElement.dataset.theme=state.theme;
load();
