import {read,save,rooms,buildings,departments,members,recordActivity} from './store.js';
import {I,esc,go,routes} from './ui.js';
import {views,filteredRooms,dialogContent} from './views.js';

const page=document.body.dataset.page||'home';
const params=new URLSearchParams(globalThis.location?.search||'');
const initialRoom=rooms().find(room=>room.id===params.get('sala'))||rooms().find(room=>room.id==='NX-003')||rooms()[0];
const state={building:initialRoom.building,floor:initialRoom.floor,roomId:initialRoom.id,query:'',filter:'Todos',selectedDept:departments()[0].name,zoom:1};
let mediaStream=null;
let cameraRequest=0;
let dialogTrigger=null;
let toastTimer;
let hasRendered=false;
let disposeSpatial=null,spatialRender=0;
const requestedBuilding=buildings().find(item=>item.id===params.get('edificio'));
if(requestedBuilding){state.building=requestedBuilding.id;if(requestedBuilding.floors.includes(params.get('andar')))state.floor=params.get('andar');}

function syncSelection(){
 const building=buildings().find(item=>item.id===state.building)||buildings()[0];
 state.building=building.id;
 if(!building.floors.includes(state.floor))state.floor=building.floors[0];
 const found=filteredRooms(state);
 if(!found.some(room=>room.id===state.roomId))state.roomId=found[0]?.id||'';
}

function render(){
 disposeSpatial?.();disposeSpatial=null;const ticket=++spatialRender;
 syncSelection();
 document.getElementById('app').innerHTML=(views[page]||views.home)(state);
 if(hasRendered)document.getElementById('main-content')?.classList?.add('is-static');
 hasRendered=true;
 document.documentElement.dataset.theme=read().theme==='dark'?'dark':'light';
 const titles={home:'Novas possibilidades',painel:'Visão geral',administracao:'Ferramentas',ambientes:'Espaços',mapa:'Explorar espaços',departamentos:'Grupos e acessos',membros:'Pessoas',mapeamento:'Estúdio 3D',editor:'Editor de ambientes',relatorios:'Atividade',organizar:'Seu workspace',conta:'Sobre você',finalizar:'Tudo pronto',acessar:'Abrir demonstração'};
 document.title=`Localiza · ${titles[page]||'Workspace'}`;
 const spatialRoot=document.getElementById('spatial-root');
 if(spatialRoot?.dataset?.spatial)import('./spatial/controller.js').then(({mountSpatial})=>{if(ticket===spatialRender)disposeSpatial=mountSpatial(spatialRoot,{state});}).catch(error=>{if(ticket===spatialRender){const message=spatialRoot.querySelector('[data-spatial-error]');if(message){message.textContent='Não foi possível abrir o editor: '+error.message;message.hidden=false;}}});
}

function toast(message){
 const element=document.getElementById('toast');
 if(!element)return;
 clearTimeout(toastTimer);
 element.textContent=message;
 element.classList.add('is-visible');
 toastTimer=setTimeout(()=>element.classList.remove('is-visible'),4000);
}

function stopCamera(){
 cameraRequest++;
 mediaStream?.getTracks().forEach(track=>track.stop());
 mediaStream=null;
}
function closeDialog(){
 stopCamera();
 document.getElementById('app-dialog')?.close();
 dialogTrigger?.focus();
}
function openDialog(type,roomId){
 const dialog=document.getElementById('app-dialog');
 if(!dialog)return;
 stopCamera();
 dialogTrigger=document.activeElement;
 document.getElementById('dialog-content').innerHTML=dialogContent(type,state,roomId);
 dialog.showModal();
 dialog.querySelector('input:not([type=checkbox]),select,textarea')?.focus();
 dialog.addEventListener('close',stopCamera,{once:true});
 dialog.addEventListener('cancel',stopCamera,{once:true});
}
function error(form,message){
 const element=form.querySelector('[data-form-error]');
 if(element){element.textContent=message;element.hidden=false;}
}
const uniqueId=prefix=>`${prefix}-${(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,8).toUpperCase()}`;
function finishMutation(message){
 closeDialog();
 recordActivity(message);
 render();
 toast(message);
 const actionButton=document.querySelector('.heading-actions button');
 actionButton?.focus();
}

document.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');
 if(!target)return;
 const action=target.dataset.action,value=target.dataset.value;
 if(action==='menu'){
  const menu=document.getElementById('mobile-nav');
  menu.hidden=!menu.hidden;
  target.setAttribute('aria-expanded',String(!menu.hidden));
  target.setAttribute('aria-label',menu.hidden?'Abrir menu':'Fechar menu');
  return;
 }
 if(action==='theme'){
  save({theme:read().theme==='dark'?'light':'dark'});
  document.documentElement.dataset.theme=read().theme;
  target.innerHTML=I(read().theme==='dark'?'sun':'moon',19);
  return;
 }
 if(action==='finish'){location.href=go('painel');return;}
 if(action==='close-dialog'){closeDialog();return;}
 if(['add-room','add-building','add-dept','invite','camera-intro','room-details'].includes(action)){
  openDialog(action,value);return;
 }
 if(action==='camera-start'){
  const message=document.getElementById('camera-message');
  const dialog=document.getElementById('app-dialog');
  if(!navigator.mediaDevices?.getUserMedia){message.textContent='A prévia precisa de um navegador compatível em localhost ou HTTPS.';return;}
  target.disabled=true;message.textContent='Aguardando permissão da câmera…';
  const request=++cameraRequest;
  try{
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
   if(request!==cameraRequest||!dialog.open){stream.getTracks().forEach(track=>track.stop());return;}
   mediaStream=stream;
   const video=document.getElementById('camera-video');video.srcObject=stream;video.hidden=false;
   document.querySelector('.camera-placeholder')?.setAttribute('hidden','');
   message.textContent='Prévia ativa. Nenhuma imagem está sendo gravada ou enviada.';
   target.hidden=true;
  }catch{if(request===cameraRequest){message.textContent='A câmera não foi ativada. Você pode fechar a janela ou tentar novamente.';target.disabled=false;}}
  return;
 }
 if(action==='building'){
  state.building=value;
  const building=buildings().find(item=>item.id===value);
  state.floor=building.floors.find(floor=>rooms().some(room=>room.building===value&&room.floor===floor))||building.floors[0];
  state.query='';state.filter='Todos';state.zoom=1;
 }
 if(action==='floor'){state.floor=value;state.zoom=1;}
 if(action==='filter')state.filter=value;
 if(action==='dept')state.selectedDept=value;
 if(action==='map-select')state.roomId=value;
 if(action==='zoom-in')state.zoom=Math.min(1.5,Math.round((state.zoom+.15)*100)/100);
 if(action==='zoom-out')state.zoom=Math.max(.7,Math.round((state.zoom-.15)*100)/100);
 if(action==='zoom-reset')state.zoom=1;
 if(['building','floor','filter','dept','map-select','zoom-in','zoom-out','zoom-reset'].includes(action)){
  render();
  const buttons=[...document.querySelectorAll('[data-action]')];
  buttons.find(button=>button.dataset.action===action&&button.dataset.value===value)?.focus({preventScroll:true});
 }
});

document.addEventListener('input',event=>{
 if(event.target.dataset.input!=='room-query')return;
 state.query=event.target.value;
 const cursor=event.target.selectionStart;
 render();
 const input=document.querySelector('[data-input="room-query"]');
 input?.focus({preventScroll:true});
 // input type=search supports text selection in the target browsers.
 try{input?.setSelectionRange(cursor,cursor);}catch{}
});

document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 const menu=document.getElementById('mobile-nav');
 if(!menu||menu.hidden)return;
 menu.hidden=true;
 const toggle=document.querySelector('[data-action="menu"]');
 toggle?.setAttribute('aria-expanded','false');
 toggle?.setAttribute('aria-label','Abrir menu');
 toggle?.focus();
});

document.addEventListener('change',event=>{
 const element=event.target;
 if(element.dataset.select==='studio-room'){
  const room=rooms().find(item=>item.id===element.value);
  state.roomId=room.id;state.building=room.building;state.floor=room.floor;
  render();document.getElementById('studio-room')?.focus();
 }
 if(element.dataset.select==='form-building'){
  const building=buildings().find(item=>item.id===element.value);
  document.getElementById('room-floor').innerHTML=building.floors.map(floor=>`<option>${esc(floor)}</option>`).join('');
 }
 if(element.dataset.permission){
  const room=rooms().find(item=>item.id===element.dataset.permission);
  if(!room||room.visibility==='interno')return;
  const permissions=read().demoPermissions||{};
  const groups=permissions[room.id]??room.groups??[];
  permissions[room.id]=element.checked?[...new Set([...groups,state.selectedDept])]:groups.filter(group=>group!==state.selectedDept);
  save({demoPermissions:permissions});
  toast('Associação de demonstração salva.');
 }
});

document.addEventListener('submit',event=>{
 const form=event.target.closest('form[data-form]');
 if(!form)return;
 event.preventDefault();
 const data=Object.fromEntries(new FormData(form));
 const type=form.dataset.form;
 if(type==='organization'){
  const name=String(data.organization||'').trim(),slug=String(data.slug||'').trim();
  if(!name)return error(form,'Dê um nome ao seu workspace.');
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))return error(form,'Use letras minúsculas, números e hífens no identificador.');
  save({organization:name.slice(0,80),slug,orgType:data.orgType});location.href=go('conta');
 }
 if(type==='account'){
  const name=String(data.name||'').trim();if(!name)return error(form,'Informe seu nome.');
  save({adminName:name.slice(0,90),adminEmail:String(data.email).trim()});location.href=go('finalizar');
 }
 if(type==='room'){
  const name=String(data.name||'').trim();
  if(!name)return error(form,'Dê um nome ao ambiente.');
  const building=buildings().find(item=>item.id===data.building);
  if(!building?.floors.includes(data.floor))return error(form,'Selecione um edifício e um andar válidos.');
  if(rooms().some(room=>room.building===data.building&&room.floor===data.floor&&room.name.toLowerCase()===name.toLowerCase()))return error(form,'Já existe um ambiente com esse nome neste andar.');
  const room={id:uniqueId('NX'),name:name.slice(0,80),building:data.building,floor:data.floor,dept:data.dept,groups:[],visibility:'interno',status:'Em revisão',size:0,icon:'door',description:String(data.description||'').trim()||'Um novo espaço para as possibilidades da sua organização.'};
  save({extraRooms:[...(read().extraRooms||[]),room]});
  Object.assign(state,{building:room.building,floor:room.floor,roomId:room.id,filter:'Todos',query:''});
  finishMutation(`Ambiente “${room.name}” criado na demonstração.`);
 }
 if(type==='building'){
  const name=String(data.name||'').trim(),count=Number(data.floors);
  if(!name)return error(form,'Dê um nome ao edifício.');
  if(!Number.isInteger(count)||count<1||count>20)return error(form,'Use uma quantidade de 1 a 20 andares.');
  if(buildings().some(building=>building.name.toLowerCase()===name.toLowerCase()))return error(form,'Este edifício já está na sua estrutura.');
  const building={id:uniqueId('edificio'),name:name.slice(0,60),short:name.slice(0,24),floors:Array.from({length:count},(_,index)=>index===0?'Térreo':`${index}º Andar`)};
  save({extraBuildings:[...(read().extraBuildings||[]),building]});state.building=building.id;state.floor='Térreo';state.query='';state.filter='Todos';
  finishMutation(`Edifício “${building.name}” adicionado.`);
 }
 if(type==='department'){
  const name=String(data.name||'').trim();if(!name)return error(form,'Dê um nome ao grupo.');
  if(departments().some(group=>group.name.toLowerCase()===name.toLowerCase()))return error(form,'Este grupo já existe.');
  save({extraDepts:[...(read().extraDepts||[]),{name:name.slice(0,50),color:'violet',icon:'users'}]});state.selectedDept=name.slice(0,50);
  finishMutation(`Grupo “${name}” criado na demonstração.`);
 }
 if(type==='invite'){
  const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
  if(!name)return error(form,'Informe o nome da pessoa.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return error(form,'Informe um e-mail válido.');
  if(members().some(member=>member.email.toLowerCase()===email))return error(form,'Este e-mail já está na lista de pessoas.');
  save({extraMembers:[...(read().extraMembers||[]),{name:name.slice(0,80),email,groups:[data.group],role:'Colaborador',status:'Convite local'}]});
  finishMutation(`Convite local de ${name} adicionado.`);
 }
});

globalThis.addEventListener?.('pagehide',stopCamera);
// O esquema de rotas é exportado pelo módulo de UI e verificado no smoke test.
if(!routes[page])console.warn('Página não reconhecida, exibindo início.');
render();
