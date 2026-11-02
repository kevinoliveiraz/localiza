import {validReference} from './video-model.js';
import {I,esc,go} from '../ui.js';
import {rooms,read,save as saveWorkspace,recordActivity} from '../store.js';
import {clone,emptyPlan,addRectRoom,addWall,addOpening,moveVertex,resizeWall,validatePlan,planBounds,polygonArea,distance,closestPoint,snap,uid,clamp,samePoint} from './plan-model.js';
import {loadPlan,savePlan,loadDraft,saveDraft,hasSavedPlan} from './plan-store.js';
import {createPlanSVG,svgContent,fittedView} from './svg-plan.js';
import {download,reportError} from './local-api.js';

const help={select:'Clique para selecionar. Arraste um elemento ou seus pontos para ajustar.',room:'Arraste na planta para desenhar um ambiente. Ou use “Ambiente por medidas”.',wall:'Clique no início e no fim da parede. Continue clicando para conectar trechos. Esc encerra.',door:'Clique perto de uma parede para abrir uma porta de 90 cm.',window:'Clique perto de uma parede para inserir uma janela de 1,20 m.',object:'Escolha o móvel abaixo e clique onde você quer posicioná-lo.',pan:'Arraste a planta para mover a vista. Use a roda ou os botões para aproximar.'};
const objectDefaults={desk:[1.6,.8,.75],chair:[.5,.5,.9],sofa:[2,.85,.85],plant:[.5,.5,1.1],cabinet:[1.4,.5,1.8]};
const input=(label,property,value,{min,max,step=.1,type='number'}={})=>`<label class="editor-property-field">${label}<input data-property="${property}" type="${type}" value="${esc(value)}" ${min!==undefined?`min="${min}"`:''} ${max!==undefined?`max="${max}"`:''} ${type==='number'?`step="${step}"`:''}/></label>`;
const colorInput=(property,value)=>input('Cor do piso',property,/^#[a-f0-9]{6}$/i.test(value)?value:'#e6e0f6',{type:'color'});
const dialogHeader=title=>`<div class="dialog-heading"><h2 id="spatial-dialog-title">${title}</h2><button class="icon-button" data-editor-action="close-dialog" aria-label="Fechar janela">${I('plus',18)}</button></div>`;

export function mountEditor(root,{state}){
 const building=state.building,floor=state.floor;
 let plan=loadPlan(building,floor,rooms().filter(room=>room.building===building&&room.floor===floor));
 const draft=loadDraft(building,floor);let dirty=false;
 if(draft&&(!hasSavedPlan(building,floor)||draft.updatedAt>plan.updatedAt)){plan=draft;dirty=true;}
 let selected=null,tool='select',view=fittedView(plan),mode=matchMedia('(min-width:1100px)').matches?'split':'2d',pendingWall=null,preview=null,drag=null,viewer=null,disposed=false,loading3d=false,cutaway=false,refreshTimer;
 const undo=[],redo=[],host=root.querySelector('[data-editor-svg]'),threeHost=root.querySelector('[data-editor-three]'),layout=root.querySelector('.floor-editor'),properties=root.querySelector('[data-properties]'),dialog=root.querySelector('[data-editor-dialog]');
 host.innerHTML=createPlanSVG(plan,{view});const svg=host.querySelector('svg');
 const status=(message,linked=false)=>{root.querySelector('[data-save-status]').innerHTML=esc(message)+(linked?' · <a class="text-link" href="'+esc(go('mapa','?edificio='+encodeURIComponent(building)+'&andar='+encodeURIComponent(floor)))+'">Abrir no mapa →</a>':'');};
 status(dirty?'Rascunho recuperado · alterações por salvar':plan.example?'Exemplo editável · medidas de demonstração':'Desenho salvo neste navegador',!dirty&&!plan.example);
 if(plan.videoSource){const note=document.createElement('details');note.className='video-editor-reference';note.open=true;note.innerHTML='<summary>Referência do vídeo</summary><p>Medidas conferidas por você. Ajuste aqui portas, janelas e móveis.</p>'+(validReference(plan.videoSource.reference)?'<img src="'+plan.videoSource.reference+'" alt="Quadro de referência do vídeo do ambiente"/>':'');root.querySelector('.editor-properties').append(note);}

 function current(){if(!selected)return null;if(selected.kind==='room')return plan.rooms.find(item=>item.id===selected.id);if(selected.kind==='wall')return plan.walls.find(item=>item.id===selected.id);if(selected.kind==='object')return plan.objects.find(item=>item.id===selected.id);return plan.walls.find(wall=>wall.id===selected.wallId)?.openings.find(item=>item.id===selected.id);}
 function render2D(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);svg.innerHTML=svgContent(plan,{selected,preview});svg.dataset.tool=tool;}
 async function ensure3D(){
  if(viewer||loading3d||mode==='2d'||disposed)return;loading3d=true;
  try{const {SpatialViewer}=await import('./engine.js');if(disposed)return;viewer=new SpatialViewer(threeHost,{onPick:data=>{selected=data;renderProperties();render2D();},onError:message=>reportError(root,message)});viewer.setPlan(plan,{cutaway});}
  catch(error){if(!disposed)reportError(root,error.message||'O 3D não iniciou. O desenho 2D continua disponível.');}
  finally{loading3d=false;}
 }
 function refresh3D(fit=false){if(viewer){viewer.setPlan(plan,{cutaway,preserveView:!fit});}else ensure3D();}
 function refresh({fit=false,props=true}={}){
  if(fit)view=fittedView(plan);render2D();if(props)renderProperties();refresh3D(fit);
  root.querySelector('[data-plan-summary]').textContent=`${plan.rooms.length} ambientes · ${plan.walls.length} paredes · ${plan.rooms.reduce((sum,room)=>sum+polygonArea(room.points),0).toFixed(1).replace('.',',')} m² de piso`;
  root.querySelector('[data-editor-action="undo"]').disabled=!undo.length;root.querySelector('[data-editor-action="redo"]').disabled=!redo.length;
 }
 function commit(before,{fit=false}={}){
  try{validatePlan(plan);}catch(error){plan=before;refresh();reportError(root,error.message);return false;}
  undo.push(before);if(undo.length>60)undo.shift();redo.length=0;plan.example=false;plan.source='manual';plan.updatedAt=new Date().toISOString();dirty=true;
  const saved=saveDraft(plan);status(saved?'Alterações por salvar no mapa':'Rascunho sem espaço no navegador · exporte o JSON');reportError(root,'');refresh({fit});return true;
 }
 function mutate(action,options){const before=clone(plan);try{action();commit(before,options);}catch(error){plan=before;reportError(root,error.message);refresh();}}
 function history(back){const from=back?undo:redo,to=back?redo:undo;if(!from.length)return;to.push(clone(plan));plan=from.pop();plan.updatedAt=new Date().toISOString();selected=null;dirty=true;saveDraft(plan);status('Alterações por salvar no mapa');refresh();}
 function chooseTool(next){tool=next;pendingWall=null;preview=null;root.querySelectorAll('[data-editor-tool]').forEach(button=>{const active=button.dataset.editorTool===tool;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});root.querySelector('[data-tool-help]').textContent=help[tool];render2D();}
 function setMode(next){mode=next==='split'&&!matchMedia('(min-width:1100px)').matches?'2d':next;layout.dataset.editorMode=mode;root.querySelectorAll('[data-editor-view]').forEach(button=>{const active=button.dataset.editorView===mode;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});if(mode!=='2d'){ensure3D();requestAnimationFrame(()=>viewer?.resize());}}
 function renderProperties(){
  const element=current();root.querySelector('[data-editor-action="delete"]').disabled=!element;
  if(!element){properties.innerHTML=`<div class="properties-intro">${I('layers',25)}<h3>Seu desenho.</h3><p>Selecione um elemento para ajustar suas medidas ou configure o padrão das novas paredes.</p></div>${input('Altura das novas paredes (m)','plan-height',plan.height,{min:1,max:8})}${input('Espessura das novas paredes (m)','plan-thickness',plan.thickness,{min:.05,max:1,step:.01})}<div class="properties-tip">Grade de 25 cm. Você pode informar medidas precisas nas propriedades.</div>`;return;}
  if(selected.kind==='room'){
   const b={minX:Math.min(...element.points.map(p=>p.x)),maxX:Math.max(...element.points.map(p=>p.x)),minY:Math.min(...element.points.map(p=>p.y)),maxY:Math.max(...element.points.map(p=>p.y))};
   properties.innerHTML=`<span class="property-kind">AMBIENTE</span>${input('Nome','room-name',element.name,{type:'text'})}${input('Largura (m)','room-width',(b.maxX-b.minX).toFixed(2),{min:1,max:50})}${input('Comprimento (m)','room-depth',(b.maxY-b.minY).toFixed(2),{min:1,max:50})}${colorInput('room-color',element.color)}<div class="property-metric"><span>Área do piso</span><strong>${polygonArea(element.points).toFixed(2).replace('.',',')} m²</strong></div><p class="properties-tip">Arraste os pontos para ajustar o contorno. Paredes conectadas acompanham a alteração.</p>`;
  }else if(selected.kind==='wall')properties.innerHTML=`<span class="property-kind">PAREDE</span>${input('Comprimento (m)','wall-length',distance(element.a,element.b).toFixed(2),{min:.3,max:100})}${input('Altura (m)','wall-height',element.height,{min:.5,max:8})}${input('Espessura (m)','wall-thickness',element.thickness,{min:.05,max:1,step:.01})}<p class="properties-tip">Arraste os pontos nas extremidades para reposicionar a parede.</p>`;
  else if(selected.kind==='opening')properties.innerHTML=`<span class="property-kind">${element.kind==='door'?'PORTA':'JANELA'}</span>${input('Largura (m)','opening-width',element.width,{min:.3,max:5})}${input('Altura (m)','opening-height',element.height,{min:.3,max:5})}${element.kind==='window'?input('Altura do peitoril (m)','opening-sill',element.sill,{min:0,max:4}):''}<p class="properties-tip">As aberturas recortam a parede também no modelo 3D.</p>`;
  else properties.innerHTML=`<span class="property-kind">MÓVEL</span>${input('Largura (m)','object-width',element.width,{min:.1,max:10})}${input('Profundidade (m)','object-depth',element.depth,{min:.1,max:10})}${input('Altura (m)','object-height',element.height,{min:.1,max:8})}${input('Rotação (graus)','object-rotation',element.rotation,{min:-360,max:360,step:15})}<p class="properties-tip">Arraste o móvel na planta para reposicioná-lo.</p>`;
 }
 function normalizeOpenings(){for(const wall of plan.walls){const length=distance(wall.a,wall.b);wall.openings=wall.openings.filter(opening=>length>=.5&&wall.height>=.5).map(opening=>({...opening,width:Math.min(opening.width,length-.15),height:Math.min(opening.height,wall.height-opening.sill),offset:clamp(opening.offset,Math.min(opening.width,length-.15)/2+.02,length-Math.min(opening.width,length-.15)/2-.02)})).filter(opening=>opening.height>=.2);}}
 function resizeRoom(room,axis,value){
  if(value<1||value>50)throw new Error('Use medidas entre 1 e 50 metros.');
  const minX=Math.min(...room.points.map(p=>p.x)),minY=Math.min(...room.points.map(p=>p.y)),width=Math.max(...room.points.map(p=>p.x))-minX,depth=Math.max(...room.points.map(p=>p.y))-minY;
  const pairs=room.points.map(point=>({from:{...point},to:{x:axis==='x'?minX+(point.x-minX)*value/width:point.x,y:axis==='y'?minY+(point.y-minY)*value/depth:point.y}}));
  const mapped=point=>{const pair=pairs.find(item=>samePoint(item.from,point));return pair?{...pair.to}:point;};
  for(const wall of plan.walls){wall.a=mapped(wall.a);wall.b=mapped(wall.b);}for(const item of plan.rooms)item.points=item.points.map(mapped);normalizeOpenings();
 }
 const propertyChange=event=>{
  const property=event.target.dataset.property;if(!property)return;const element=current(),value=event.target.type==='number'?Number(event.target.value):event.target.value;
  mutate(()=>{
   if(event.target.type==='number'&&!Number.isFinite(value))throw new Error('Informe uma medida válida.');
   if(property==='plan-height'){if(value<1||value>8)throw new Error('Use altura de 1 a 8 metros.');plan.height=value;}
   if(property==='plan-thickness'){if(value<.05||value>1)throw new Error('Use espessura entre 5 cm e 1 metro.');plan.thickness=value;}
   if(property==='room-name'){if(!value.trim())throw new Error('Dê um nome ao ambiente.');element.name=value.trim().slice(0,100);}
   if(property==='room-color')element.color=value;
   if(property==='room-width')resizeRoom(element,'x',value);
   if(property==='room-depth')resizeRoom(element,'y',value);
   if(property==='wall-length')resizeWall(plan,element.id,value);
   if(property==='wall-height'){element.height=value;normalizeOpenings();}
   if(property==='wall-thickness')element.thickness=value;
   if(property.startsWith('object-'))element[property.slice(7)]=value;
   if(property.startsWith('opening-'))element[property.slice(8)]=value;
  });
 };
 function pointAt(event){const matrix=svg.getScreenCTM();if(!matrix)return {x:0,y:0};const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {x:point.x,y:point.y};}
 function snapped(point){const result={x:snap(point.x),y:snap(point.y)};const nearby=plan.walls.flatMap(wall=>[wall.a,wall.b]).find(vertex=>distance(vertex,point)<.18);return nearby?{...nearby}:result;}
 function pick(event){const node=event.target.closest('[data-kind]');return node?{kind:node.dataset.kind,id:node.dataset.id,wallId:node.dataset.wall}:null;}
 function onPointerDown(event){
  if(event.button!==0&&event.button!==1)return;event.preventDefault();svg.focus({preventScroll:true});const raw=pointAt(event),point=snapped(raw);svg.setPointerCapture(event.pointerId);
  if(tool==='pan'||event.button===1){drag={kind:'pan',clientX:event.clientX,clientY:event.clientY,view:{...view}};return;}
  if(tool==='room'){drag={kind:'new-room',start:point,before:clone(plan)};preview={kind:'room',a:point,b:point};render2D();return;}
  if(tool==='wall'){
   if(!pendingWall){pendingWall=point;preview={kind:'wall',a:point,b:point};render2D();return;}
   let end=point;if(event.shiftKey)end=Math.abs(point.x-pendingWall.x)>Math.abs(point.y-pendingWall.y)?{x:point.x,y:pendingWall.y}:{x:pendingWall.x,y:point.y};
   mutate(()=>{const wall=addWall(plan,pendingWall,end);selected={kind:'wall',id:wall.id};});pendingWall=end;preview=null;render2D();return;
  }
  if(tool==='door'||tool==='window'){
   const nearest=plan.walls.map(wall=>({wall,...closestPoint(wall,raw)})).sort((a,b)=>a.distance-b.distance)[0];
   if(!nearest||nearest.distance>.6){reportError(root,'Clique perto da parede onde você quer criar a abertura.');return;}
   mutate(()=>{const opening=addOpening(plan,nearest.wall.id,tool,nearest.offset);selected={kind:'opening',id:opening.id,wallId:nearest.wall.id};});return;
  }
  if(tool==='object'){
   mutate(()=>{const type=root.querySelector('[data-object-type]').value,[width,depth,height]=objectDefaults[type];const object={id:uid('object'),type,x:point.x,y:point.y,rotation:0,width,depth,height};plan.objects.push(object);selected={kind:'object',id:object.id};});return;
  }
  const target=pick(event);selected=target;renderProperties();
  if(!target){render2D();return;}
  const vertex=event.target.closest('[data-vertex]');
  if(vertex){const item=current(),point=target.kind==='wall'?[item.a,item.b][Number(vertex.dataset.vertex)]:item.points[Number(vertex.dataset.vertex)];drag={kind:'vertex',last:{...point},before:clone(plan),start:raw};}
  else drag={kind:'move',start:raw,before:clone(plan),selected:{...selected}};
  render2D();
 }
 function moveSelection(before,delta){
  plan=clone(before);const kind=selected.kind;
  if(kind==='object'){const object=plan.objects.find(item=>item.id===selected.id);object.x=snap(object.x+delta.x);object.y=snap(object.y+delta.y);return;}
  if(kind==='opening'){const wall=plan.walls.find(item=>item.id===selected.wallId),opening=wall.openings.find(item=>item.id===selected.id),dx=(wall.b.x-wall.a.x)/distance(wall.a,wall.b),dy=(wall.b.y-wall.a.y)/distance(wall.a,wall.b);opening.offset=clamp(opening.offset+delta.x*dx+delta.y*dy,opening.width/2+.03,distance(wall.a,wall.b)-opening.width/2-.03);return;}
  const element=kind==='wall'?plan.walls.find(item=>item.id===selected.id):plan.rooms.find(item=>item.id===selected.id),points=kind==='wall'?[element.a,element.b]:element.points;
  const pairs=points.map(point=>({from:{...point},to:{x:snap(point.x+delta.x),y:snap(point.y+delta.y)}}));const mapped=point=>{const pair=pairs.find(item=>samePoint(item.from,point));return pair?{...pair.to}:point;};for(const wall of plan.walls){wall.a=mapped(wall.a);wall.b=mapped(wall.b);}for(const room of plan.rooms)room.points=room.points.map(mapped);normalizeOpenings();
 }
 function onPointerMove(event){
  const raw=pointAt(event),point=snapped(raw);root.querySelector('[data-coordinates]').textContent=`${point.x.toFixed(2)} m · ${point.y.toFixed(2)} m`;
  if(!drag){if(tool==='wall'&&pendingWall){preview={kind:'wall',a:pendingWall,b:point};render2D();}return;}
  if(drag.kind==='pan'){const rect=svg.getBoundingClientRect();view={...drag.view,x:drag.view.x-(event.clientX-drag.clientX)/rect.width*drag.view.width,y:drag.view.y-(event.clientY-drag.clientY)/rect.height*drag.view.height};render2D();return;}
  if(drag.kind==='new-room'){preview={kind:'room',a:drag.start,b:point};render2D();return;}
  if(drag.kind==='vertex'){moveVertex(plan,drag.last,point);drag.last={...point};normalizeOpenings();}
  else moveSelection(drag.before,{x:raw.x-drag.start.x,y:raw.y-drag.start.y});
  drag.changed=true;render2D();clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh3D(),80);
 }
 function onPointerUp(event){
  if(!drag)return;const currentDrag=drag;drag=null;
  if(currentDrag.kind==='new-room'){
   const end=snapped(pointAt(event)),x=Math.min(end.x,currentDrag.start.x),y=Math.min(end.y,currentDrag.start.y),width=Math.abs(end.x-currentDrag.start.x),depth=Math.abs(end.y-currentDrag.start.y);preview=null;
   if(width<1||depth<1){render2D();reportError(root,'Arraste para criar um ambiente com pelo menos 1 × 1 metro, ou use “Ambiente por medidas”.');return;}
   mutate(()=>{const room=addRectRoom(plan,{x,y,width,depth,name:`Ambiente ${plan.rooms.length+1}`});selected={kind:'room',id:room.id};});
  }else if(currentDrag.changed)commit(currentDrag.before);else refresh();
  try{svg.releasePointerCapture(event.pointerId);}catch{}
 }
 const wheel=event=>{event.preventDefault();zoom(event.deltaY>0?1.12:.9,pointAt(event));};
 function zoom(factor,center={x:view.x+view.width/2,y:view.y+view.height/2}){const next=clamp(view.width*factor,2,200),ratio=next/view.width;view={x:center.x-(center.x-view.x)*ratio,y:center.y-(center.y-view.y)*ratio,width:next,height:view.height*ratio};render2D();}
 function openDialog(content){root.querySelector('[data-editor-dialog-content]').innerHTML=content;dialog.showModal();dialog.querySelector('input')?.focus();}
 function roomForm(){openDialog(`${dialogHeader('Crie pelas medidas.')}<form data-editor-form="room"><label>Nome do ambiente<input name="name" required maxlength="100" value="Novo ambiente"/></label><div class="form-grid"><label>Largura (m)<input name="width" type="number" min="1" max="50" step=".1" value="5" required/></label><label>Comprimento (m)<input name="depth" type="number" min="1" max="50" step=".1" value="4" required/></label></div><p class="field-help">O ambiente será adicionado ao lado do desenho. Você pode arrastá-lo depois.</p><p class="form-error" data-editor-form-error role="alert" hidden></p><div class="dialog-actions"><button type="button" class="btn btn-secondary" data-editor-action="close-dialog">Cancelar</button><button class="btn btn-primary" type="submit">Criar ambiente</button></div></form>`);}
 function deleteSelected(){if(!selected)return;mutate(()=>{if(selected.kind==='wall'){plan.walls=plan.walls.filter(wall=>wall.id!==selected.id);for(const room of plan.rooms)room.wallIds=room.wallIds.filter(id=>id!==selected.id);}if(selected.kind==='room'){const room=current(),used=new Set(plan.rooms.filter(item=>item.id!==room.id).flatMap(item=>item.wallIds));plan.walls=plan.walls.filter(wall=>!room.wallIds.includes(wall.id)||used.has(wall.id));plan.rooms=plan.rooms.filter(item=>item.id!==room.id);}if(selected.kind==='object')plan.objects=plan.objects.filter(item=>item.id!==selected.id);if(selected.kind==='opening'){const wall=plan.walls.find(item=>item.id===selected.wallId);wall.openings=wall.openings.filter(item=>item.id!==selected.id);}selected=null;});}
 function save(){
  try{
   const extras=read().extraRooms||[],edits=read().roomEdits||{};
   for(const room of plan.rooms){const existing=rooms().find(item=>item.id===room.roomId&&item.building===building&&item.floor===floor);if(!existing){room.roomId='NX-'+uid('room').split('-').slice(-1)[0].slice(0,8).toUpperCase();extras.push({id:room.roomId,name:room.name,building,floor,dept:'Operações',groups:[],visibility:'interno',status:'Publicado',size:Number(polygonArea(room.points).toFixed(2)),icon:'door',description:'Ambiente criado no editor geométrico local.'});}else edits[room.roomId]={name:room.name,size:Number(polygonArea(room.points).toFixed(2))};}
   plan=savePlan(plan);saveWorkspace({extraRooms:extras,roomEdits:edits});saveDraft(plan);dirty=false;recordActivity('Planta e modelo 3D salvos para '+floor+'.');status('Salvo no mapa · '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),true);reportError(root,'');refresh();
  }catch(error){reportError(root,'Não foi possível salvar: '+error.message+'. Exporte o JSON para preservar o desenho.');}
 }
 async function exportGLB(){const {buildPlanGroup}=await import('./engine.js'),{GLTFExporter}=await import('../../vendor/three/addons/exporters/GLTFExporter.js'),model=buildPlanGroup(plan);try{const buffer=await new GLTFExporter().parseAsync(model,{binary:true});download(buffer,'localiza-'+floor.replace(/\W/g,'-')+'.glb','model/gltf-binary');}finally{model.traverse(object=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach(item=>item.dispose());else object.material?.dispose();});}}
 const click=async event=>{
  const toolButton=event.target.closest('[data-editor-tool]');if(toolButton){chooseTool(toolButton.dataset.editorTool);return;}
  const viewButton=event.target.closest('[data-editor-view]');if(viewButton){setMode(viewButton.dataset.editorView);return;}
  const action=event.target.closest('[data-editor-action]')?.dataset.editorAction;if(!action)return;
  if(action==='undo')history(true);if(action==='redo')history(false);if(action==='save')save();if(action==='room-form')roomForm();if(action==='delete')deleteSelected();if(action==='fit'){view=fittedView(plan);render2D();viewer?.fit();}if(action==='fit-3d')viewer?.fit();if(action==='zoom-in')zoom(.8);if(action==='zoom-out')zoom(1.25);if(action==='close-dialog')dialog.close();
  if(action==='new')openDialog(`${dialogHeader('Começar uma nova planta?')}<p class="muted">O modelo salvo será mantido até você salvar o novo desenho. Você pode desfazer esta alteração com Ctrl+Z.</p><div class="dialog-actions"><button class="btn btn-secondary" data-editor-action="close-dialog">Continuar editando</button><button class="btn btn-primary" data-editor-action="confirm-new">Novo desenho</button></div>`);
  if(action==='confirm-new'){mutate(()=>{plan=emptyPlan(building,floor);selected=null;},{fit:true});dialog.close();}
  if(action==='export')openDialog(`${dialogHeader('Seu modelo, com você.')}<p class="muted">O JSON mantém o desenho editável. O GLB leva o modelo 3D para outros visualizadores.</p><div class="export-options"><button class="btn btn-secondary" data-editor-action="export-json">${I('list',19)} Baixar planta JSON</button><button class="btn btn-secondary" data-editor-action="export-glb">${I('cube',19)} Baixar modelo GLB</button><button class="btn btn-secondary" data-editor-action="import-json">${I('upload',19)} Abrir planta JSON</button></div>`);
  if(action==='export-json'){download(JSON.stringify(plan,null,2),'localiza-planta.json','application/json');dialog.close();}
  if(action==='export-glb'){try{await exportGLB();dialog.close();}catch(error){reportError(root,error.message);}}
  if(action==='import-json'){dialog.close();root.querySelector('[data-import-plan]').click();}
 };
 const submit=event=>{const form=event.target.closest('[data-editor-form="room"]');if(!form)return;event.preventDefault();const fields=Object.fromEntries(new FormData(form));if(!String(fields.name).trim()){const error=form.querySelector('[data-editor-form-error]');error.textContent='Dê um nome ao ambiente.';error.hidden=false;return;}const b=planBounds(plan);mutate(()=>{const room=addRectRoom(plan,{x:plan.rooms.length||plan.walls.length?snap(b.maxX+1):0,y:0,width:Number(fields.width),depth:Number(fields.depth),name:String(fields.name).slice(0,100)});selected={kind:'room',id:room.id};},{fit:true});dialog.close();};
 const change=async event=>{
  if(event.target.dataset.property){propertyChange(event);return;}
  if(event.target.matches('[data-cutaway]')){cutaway=event.target.checked;refresh3D();}
  if(event.target.matches('[data-import-plan]')){const file=event.target.files?.[0];if(!file)return;try{if(file.size>2*1024*1024)throw new Error('Use um JSON de até 2 MB.');const imported=validatePlan(JSON.parse(await file.text()));imported.building=building;imported.floor=floor;mutate(()=>{plan=imported;selected=null;},{fit:true});}catch(error){reportError(root,error.message);}event.target.value='';}
 };
 const key=event=>{if(!root.contains(document.activeElement)&&document.activeElement!==document.body)return;const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();document.activeElement?.blur();save();return;}if(typing||dialog.open)return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();history(!event.shiftKey);return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();history(false);return;}if(event.key==='Escape'){if(drag){plan=drag.before||plan;drag=null;}pendingWall=null;preview=null;chooseTool('select');return;}if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();deleteSelected();return;}const tools={v:'select',r:'room',w:'wall',d:'door',j:'window',o:'object',h:'pan'};if(!event.ctrlKey&&!event.metaKey&&tools[event.key.toLowerCase()])chooseTool(tools[event.key.toLowerCase()]);};
 const cancel=()=>{if(drag?.before){plan=drag.before;drag=null;refresh();}};
 root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('submit',submit);document.addEventListener('keydown',key);svg.addEventListener('pointerdown',onPointerDown);svg.addEventListener('pointermove',onPointerMove);svg.addEventListener('pointerup',onPointerUp);svg.addEventListener('pointercancel',cancel);svg.addEventListener('wheel',wheel,{passive:false});
 setMode(mode);refresh();chooseTool('select');
 return()=>{disposed=true;clearTimeout(refreshTimer);viewer?.dispose();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('submit',submit);document.removeEventListener('keydown',key);svg.removeEventListener('pointerdown',onPointerDown);svg.removeEventListener('pointermove',onPointerMove);svg.removeEventListener('pointerup',onPointerUp);svg.removeEventListener('pointercancel',cancel);svg.removeEventListener('wheel',wheel);if(dialog.open)dialog.close();};
}
