import {rooms} from '../store.js';
import {loadPlan,hasSavedPlan} from './plan-store.js';
import {createPlanSVG,fittedView} from './svg-plan.js';
import {download,reportError,engineHealth} from './local-api.js';

export function mountSpatial(root,context){
 if(root.dataset.spatial==='editor'){let cleanup,dead=false;import('./manual-editor.js').then(module=>{if(!dead)cleanup=module.mountEditor(root,context)}).catch(error=>reportError(root,error.message));return()=>{dead=true;cleanup?.();};}
 if(root.dataset.spatial==='video'){let cleanup,dead=false;import('./video-editor.js').then(module=>{if(!dead)cleanup=module.mountVideoEditor(root,context)}).catch(error=>reportError(root,error.message));return()=>{dead=true;cleanup?.();};}
 if(root.dataset.spatial==='studio-status'){
  const abort=new AbortController(),label=document.querySelector('[data-engine-status]');engineHealth(abort.signal).then(result=>{if(label)label.textContent=result.ready&&result.structureVideo?'Análise de vídeo pronta · processamento neste computador':'Desenho 2D/3D pronto · análise de vídeo precisa ser instalada';}).catch(()=>{if(label)label.textContent='Desenho 2D/3D pronto · inicie o motor local para analisar vídeos';});return()=>abort.abort();
 }
 return mountMap(root,context);
}
function mountMap(root,{state}){
 const plan=loadPlan(state.building,state.floor,rooms().filter(room=>room.building===state.building&&room.floor===state.floor));
 const threeHost=root.querySelector('[data-three-host]'),svgHost=root.querySelector('[data-svg-host]');
 let viewer,disposed=false,view='3d',ticket=0,svgView=fittedView(plan);
 const setCaption=(title,description)=>{root.querySelector('[data-selected-room]').textContent=title;root.querySelector('[data-model-description]').textContent=description;};
 const picked=data=>{const room=plan.rooms.find(item=>item.id===data.id);if(room)setCaption(room.name,'Ambiente editável · medidas informadas em metros');};
 async function show3D(){const own=++ticket;reportError(root,'');threeHost.hidden=false;svgHost.hidden=true;try{if(!viewer){const {SpatialViewer}=await import('./engine.js');if(disposed||ticket!==own)return;viewer=new SpatialViewer(threeHost,{onPick:picked,onError:message=>reportError(root,message)});}viewer.setPlan(plan);setCaption('Modelo do andar',hasSavedPlan(state.building,state.floor)?'Estrutura editável · medidas informadas em metros':'Exemplo geométrico editável · não representa medidas levantadas');}catch(error){if(!disposed)reportError(root,error.message);}}
 function show2D(){ticket++;threeHost.hidden=true;svgHost.hidden=false;svgHost.innerHTML=createPlanSVG(plan,{view:svgView,handles:false});}
 function changeView(next){view=next;root.querySelectorAll('[data-spatial-view]').forEach(button=>{const active=button.dataset.spatialView===view;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});root.querySelector('[data-view-help]').textContent=view==='2d'?'Planta do mesmo modelo · medidas informadas':'Arraste para girar · role para aproximar';if(view==='2d'){show2D();setCaption('Planta do andar','Estrutura editável · medidas informadas em metros');}else show3D();}
 const click=async event=>{const switcher=event.target.closest('[data-spatial-view]');if(switcher){changeView(switcher.dataset.spatialView);return;}const room=event.target.closest('[data-kind="room"]');if(room)picked({id:room.dataset.id});const action=event.target.closest('[data-spatial-action]')?.dataset.spatialAction;if(!action)return;
  if(action==='export-glb'){try{const {buildPlanGroup}=await import('./engine.js'),{GLTFExporter}=await import('../../vendor/three/addons/exporters/GLTFExporter.js'),content=buildPlanGroup(plan);const buffer=await new GLTFExporter().parseAsync(content,{binary:true});download(buffer,'localiza-ambiente.glb','model/gltf-binary');content.traverse(item=>item.geometry?.dispose());}catch(error){reportError(root,error.message);}return;}
  if(view==='2d'){if(action==='fit')svgView=fittedView(plan);else{const factor=action==='zoom-in'?.8:1.25,cx=svgView.x+svgView.width/2,cy=svgView.y+svgView.height/2;svgView.width*=factor;svgView.height*=factor;svgView.x=cx-svgView.width/2;svgView.y=cy-svgView.height/2;}show2D();}else if(viewer){if(action==='fit')viewer.fit();else viewer.zoom(action==='zoom-in'?.8:1.25);}
 };
 root.addEventListener('click',click);changeView('3d');return()=>{disposed=true;ticket++;viewer?.dispose();root.removeEventListener('click',click);};
}
