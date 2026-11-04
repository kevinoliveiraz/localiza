import {StepTracker,addPoint,length,projection,toCanvas,fromCanvas,movePoint,nextSegment,simplifyPoints,EditHistory,CUES,pointName,distance} from './model.js?v=20261103-compass';
import {startMotionCapture} from './capture.js?v=20261103-compass';
import {saveRoute,updateRoute} from './store.js?v=20261103-compass';
import {readDraft,writeDraft,clearDraft} from './drafts.js?v=20261103-compass';
import {pathMarkup,metres} from './views.js?v=20261103-compass';
import {I} from '../ui.js';

export function mountRecorder(root,{navigate,capture=startMotionCapture,record=null}={}){
 const find=selector=>root.querySelector(selector),form=find('[data-route-form]'),svg=find('.route-svg');
 const draftId=record?.id||'new',baseStamp=record?.updatedAt||record?.createdAt||'',draft=readDraft(draftId,baseStamp),history=new EditHistory();
 let method=draft?.method||record?.method||'motion',phase=draft?.phase||(record?'editing':'idle'),points=structuredClone(draft?.points||record?.points||[]),selected=points.length-1;
 let stopCapture=null,tracker=null,disposed=false,generation=0,saved=false,draftTimer=null,gesture=null,frame=projection(points),cursor={x:400,y:320},adjusted=draft?.adjusted||record?.adjusted||false;
 const editable=()=>phase==='editing',snapshot=()=>({points:structuredClone(points),adjusted});
 form.elements.start.value=draft?.start??record?.start??'';form.elements.end.value=draft?.end??record?.end??'';form.elements.stepLength.value=draft?.stepLength||.7;
 const error=message=>{const target=find('[data-route-error]');target.textContent=message||'';target.hidden=!message;};
 const status=message=>{const target=find('[data-route-status]');if(target.textContent!==message)target.textContent=message;};
 function stop(){generation++;stopCapture?.();stopCapture=null;}
 function persist(){
  clearTimeout(draftTimer);if(saved)return;
  if(!points.length&&!form.elements.start.value&&!form.elements.end.value){clearDraft(draftId);return;}
  const persisted=writeDraft(draftId,{method,phase,start:form.elements.start.value,end:form.elements.end.value,stepLength:Number(form.elements.stepLength.value),points,adjusted,baseStamp});
  const target=find('[data-route-draft-status]'),message=persisted?'Rascunho preservado nesta aba.':'Rascunho apenas nesta página. O navegador não permitiu guardar a edição após recarregar.';if(target.textContent!==message)target.textContent=message;
 }
 function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(persist,200);}
 function fit(){frame=projection(points);cursor=points.length?toCanvas(points.at(-1),frame):{x:400,y:320};}
 function keepVisible(){if(points.some(p=>{const c=toCanvas(p,frame);return c.x<50||c.x>750||c.y<50||c.y>590;}))fit();}
 function updateSelection(){
  find('[data-route-point-editor]').hidden=!editable()||!points[selected];
  if(!points[selected])return;
  find('[data-route-selected-name]').textContent=pointName(selected,points.length);
  find('[data-route-cue]').value=points[selected].cue||'';
  find('[data-route-action="previous-point"]').disabled=selected<=0;find('[data-route-action="next-point"]').disabled=selected>=points.length-1;
 }
 function actions(){
  let html;
  if(phase==='idle')html=`<button type="submit" class="btn btn-primary">Marcar A e começar ${I('arrow',17)}</button>`;
  else if(phase==='arming')html='<button class="btn btn-primary" type="button" disabled>Aguardando permissão…</button><button type="button" data-route-action="cancel-capture" class="route-text-button">Cancelar</button>';
  else if(phase==='review')html=`<button type="submit" class="btn btn-primary">${I('check',17)} ${record?'Salvar alterações':'Salvar percurso'}</button><button type="button" data-route-action="edit" class="btn btn-secondary">${I('edit',17)} Voltar à edição</button>`;
  else if(phase==='editing')html=`<button type="button" data-route-action="finish" class="btn btn-primary" ${points.length<2?'disabled':''}>${I('check',17)} Revisar percurso</button><details class="route-restart"><summary>Recomeçar</summary><button type="button" data-route-action="reset" class="route-text-button">Limpar desenho e recomeçar</button></details>`;
  else html=`<button type="button" data-route-action="finish" class="btn btn-primary" ${points.length<2?'disabled':''}>${I('check',17)} Cheguei ao ponto B</button><button type="button" data-route-action="${phase==='recording'?'pause':'resume'}" class="btn btn-secondary">${phase==='recording'?'Pausar':'Continuar caminhada'}</button><button type="button" data-route-action="edit" class="route-text-button">${I('edit',15)} Ajustar pontos</button>`;
  find('[data-route-actions]').innerHTML=html;
  find('[data-route-mobile-actions]').innerHTML=html.replaceAll('type="submit"','type="submit" form="route-create-form"');
  root.dataset.phase=phase;root.dataset.editable=String(editable());root.dataset.recording=String(phase==='recording');
  find('[data-route-active-summary]').hidden=phase==='idle';find('[data-route-mobile-summary]').textContent=`A · ${form.elements.start.value||'Saída'} → B · ${form.elements.end.value||'Destino'}`;
  root.querySelectorAll('[data-route-mode]').forEach(button=>{button.disabled=phase!=='idle';button.setAttribute('aria-pressed',String(button.dataset.routeMode===method));});
  form.elements.stepLength.disabled=method==='manual'||phase!=='idle';
  find('[data-route-calibration]').hidden=method==='manual';
  find('[data-route-editor-toolbar]').hidden=!editable();find('[data-route-continue-tools]').hidden=!editable()||!points.length;
  find('[data-route-action="undo"]').disabled=!history.past.length;find('[data-route-action="redo"]').disabled=!history.future.length;
  svg.setAttribute('viewBox',`0 0 800 ${editable()?640:480}`);svg.setAttribute('role',editable()?'group':'img');svg.setAttribute('tabindex',editable()?'0':'-1');
  svg.setAttribute('aria-label',editable()?'Editor do percurso. Arraste os pontos para ajustar.':'Percurso em duas dimensões, visto de cima');
  find('[data-route-help]').innerHTML=method==='manual'?'<strong>Crie e ajuste com o dedo.</strong><p>Toque no quadro para marcar A e as curvas. Arraste qualquer círculo para mudar a posição. Use os botões para continuar em linha reta, à esquerda ou à direita.</p><span class="route-tag">Desenho manual · sem sensores</span>':'<strong>Registre enquanto caminha.</strong><p>Segure a tela voltada para cima e mantenha a posição do aparelho ao virar. Depois, ajuste os pontos e marque as escadas no editor.</p><span class="route-tag">Captura experimental · passos + direção</span>';
  find('[data-route-limitation]').textContent=method==='manual'?'A escala do desenho é ilustrativa: o editor não mede o corredor real.':'Os sensores estimam o caminho e podem acumular desvios. Use um celular compatível, com HTTPS e permissão de movimento.';
  updateSelection();
 }
 function draw(){
  const unit=editable()?800/Math.max(280,svg.getBoundingClientRect().width):1;
  find('[data-route-drawing]').innerHTML=pathMarkup(points,{finished:phase==='review',editable:editable(),selected,frame:editable()?frame:null,unit});
  find('[data-route-placeholder]').hidden=points.length>0;find('[data-route-distance]').textContent=metres(length(points));find('[data-route-count]').textContent=points.length;
 }
 function refresh(){actions();draw();}
 function change(work){
  const previous=snapshot();try{if(work()===false)return;history.push(previous);if(method==='motion')adjusted=true;selected=Math.min(Math.max(selected,0),points.length-1);error('');keepVisible();refresh();persist();}catch(cause){points=previous.points;adjusted=previous.adjusted;error(cause.message);}
 }
 function enterEdit(){
  stop();if(gesture)cancelGesture();
  if(method==='motion'&&phase!=='editing'&&points.length>2){const simplified=simplifyPoints(points);if(simplified.length!==points.length){history.push(snapshot());points=simplified;adjusted=true;}}
  phase='editing';selected=Math.min(Math.max(selected,0),points.length-1);fit();error('');status(points.length?'Arraste A, B ou uma curva. Toque na linha para inserir um ponto.':'Toque no quadro para marcar o ponto A.');refresh();persist();
 }
 function pause(message='Percurso pausado. Fique no mesmo ponto para retomar.'){
  if(!['recording','arming'].includes(phase))return;stop();phase='paused';status(message);refresh();persist();
 }
 async function startRecording(){
  error('');phase='arming';refresh();status('Preparando os sensores…');const token=++generation;
  try{
   const release=await capture({tracker,onStep:step=>{if(disposed||phase!=='recording')return;try{const previous=points.at(-1),ready=points.length>1;if(addPoint(points,{x:previous.x+step.x,y:previous.y+step.y})){selected=points.length-1;if(!ready)actions();draw();scheduleDraft();}}catch(cause){pause('Percurso pausado');error(cause.message);}},onStatus:message=>{if(!disposed&&phase==='recording')status(message);},onFailure:message=>{if(!disposed){pause('Captura interrompida');error(message);}}});
   if(disposed||token!==generation){release();return;}stopCapture=release;phase='recording';if(!points.length)points=[{x:0,y:0}];status('Espere a direção ficar pronta e comece a caminhar.');refresh();persist();showCanvas();
  }catch(cause){if(disposed||token!==generation)return;phase=points.length?'paused':'idle';status('Captura não iniciada');error(cause.message||'Não foi possível acessar os sensores.');refresh();persist();}
 }
 function showCanvas(){if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});}
 function revealNames(){root.dataset.detailsOpen='true';root.querySelectorAll('[data-route-action="details"]').forEach(button=>button.setAttribute('aria-expanded','true'));form.elements.start.scrollIntoView({block:'center'});form.elements.start.focus({preventScroll:true});}
 async function submit(event){
  event.preventDefault();if(!form.checkValidity()||!form.elements.start.value.trim()||!form.elements.end.value.trim()){revealNames();form.reportValidity();error('Informe os nomes da saída e do destino.');return;}
  if(phase==='review'){
   try{const input={points,method,start:form.elements.start.value,end:form.elements.end.value,adjusted},route=record?updateRoute(record.id,input,baseStamp):saveRoute(input);saved=true;clearTimeout(draftTimer);clearDraft(draftId);navigate('percurso/'+route.id);}catch(cause){error(cause.message);}return;
  }
  if(phase!=='idle')return;
  if(method==='manual'){enterEdit();showCanvas();}
  else{try{tracker=new StepTracker(Number(form.elements.stepLength.value));await startRecording();}catch(cause){error(cause.message);}}
 }
 function coordinate(event){const matrix=svg.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {x:Math.max(35,Math.min(765,p.x)),y:Math.max(35,Math.min(605,p.y))};}
 function selectPoint(index){selected=index;updateSelection();draw();status(`${pointName(index,points.length)} selecionado. Arraste para mover ou escolha uma marcação.`);}
 function addAt(canvasPoint,insert=false){
  const point=fromCanvas(canvasPoint,frame);cursor=canvasPoint;
  change(()=>{
   if(insert&&points.length>1){
    let nearest=-1,best=Infinity;
    points.slice(1).forEach((b,i)=>{const a=toCanvas(points[i],frame),c=toCanvas(b,frame),dx=c.x-a.x,dy=c.y-a.y,squared=dx*dx+dy*dy,t=squared?Math.max(0,Math.min(1,((canvasPoint.x-a.x)*dx+(canvasPoint.y-a.y)*dy)/squared)):0,d=distance(canvasPoint,{x:a.x+t*dx,y:a.y+t*dy});if(d<best){best=d;nearest=i;}});
    if(nearest>=0){if(distance(points[nearest],point)<.08||distance(points[nearest+1],point)<.08)return false;if(points.length>=6000)throw new Error('O percurso atingiu o limite de pontos.');points.splice(nearest+1,0,point);selected=nearest+1;return;}
   }
   if(!addPoint(points,point))return false;selected=points.length-1;
  });status(points.length>1?'Ponto adicionado. Arraste para ajustar ou marque uma curva/escada.':'Ponto A marcado. Você pode arrastá-lo para reposicionar.');
 }
 function pointerDown(event){
  if(!editable()||event.button!==0||event.isPrimary===false||gesture)return;
  const point=coordinate(event);if(!point)return;let index=-1,nearest=24*800/Math.max(280,svg.getBoundingClientRect().width);
  points.forEach((p,i)=>{const d=distance(point,toCanvas(p,frame));if(d<nearest){nearest=d;index=i;}});
  event.preventDefault();svg.focus({preventScroll:true});if(index>=0)selectPoint(index);
  gesture={id:event.pointerId,index,start:{x:event.clientX,y:event.clientY},before:snapshot(),moved:false,insert:!!event.target.closest('.route-line,.route-corridor')};
  svg.setPointerCapture(event.pointerId);
 }
 function pointerMove(event){
  if(!gesture||gesture.id!==event.pointerId||!editable())return;event.preventDefault();
  if(Math.hypot(event.clientX-gesture.start.x,event.clientY-gesture.start.y)<4)return;gesture.moved=true;
  if(gesture.index<0)return;const point=coordinate(event);if(!point)return;
  if(movePoint(points,gesture.index,fromCanvas(point,frame))){if(method==='motion')adjusted=true;draw();updateSelection();}
 }
 function pointerUp(event){
  if(!gesture||gesture.id!==event.pointerId)return;event.preventDefault();const completed=gesture;gesture=null;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  if(completed.index>=0&&completed.moved){history.push(completed.before);error('');refresh();persist();status('Ponto reposicionado. Use Desfazer para voltar.');}
  else if(completed.index<0&&!completed.moved){const point=coordinate(event);if(point)addAt(point,completed.insert);}
 }
 function cancelGesture(){if(!gesture)return;const previous=gesture;gesture=null;points=previous.before.points;adjusted=previous.before.adjusted;if(svg.hasPointerCapture(previous.id))svg.releasePointerCapture(previous.id);refresh();}
 function keyboard(event){
  if(!editable())return;
  const handle=event.target.closest('[data-route-point]'),index=handle?Number(handle.dataset.routePoint):null;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();restore(event.shiftKey?'redo':'undo');return;}
  if(handle&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectPoint(index);return;}
  if(handle&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();selected=index;removeSelected();return;}
  const moves={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
  if(moves[event.key]){event.preventDefault();const [dx,dy]=moves[event.key];
   if(index!==null){selected=index;const step=event.shiftKey?1:.25;change(()=>movePoint(points,index,{x:points[index].x+dx*step,y:points[index].y+dy*step}));svg.querySelector(`[data-route-point="${index}"]`)?.focus({preventScroll:true});}
   else{cursor={x:Math.max(35,Math.min(765,cursor.x+dx*24)),y:Math.max(35,Math.min(605,cursor.y+dy*24))};let marker=svg.querySelector('[data-route-cursor]');if(!marker){marker=document.createElementNS('http://www.w3.org/2000/svg','circle');marker.dataset.routeCursor='';marker.setAttribute('r','10');marker.setAttribute('class','route-keyboard-cursor');svg.append(marker);}marker.setAttribute('cx',cursor.x);marker.setAttribute('cy',cursor.y);}
  }else if(index===null&&(event.key==='Enter'||event.key===' ')){event.preventDefault();addAt(cursor);}
 }
 function restore(kind){const previous=history[kind](snapshot());if(!previous)return;points=previous.points;adjusted=previous.adjusted;selected=Math.min(selected,points.length-1);fit();refresh();persist();status(kind==='undo'?'Alteração desfeita.':'Alteração refeita.');}
 function removeSelected(){if(!points[selected])return;change(()=>{points.splice(selected,1);selected=Math.min(selected,points.length-1);});status('Ponto removido. Você pode desfazer.');}
 function click(event){
  const modeButton=event.target.closest('[data-route-mode]');if(modeButton&&phase==='idle'){method=modeButton.dataset.routeMode;refresh();persist();return;}
  const segment=event.target.closest('[data-route-segment]');if(segment&&editable()){
   const direction=segment.dataset.routeSegment;change(()=>{const point=nextSegment(points,direction,Number(find('[data-route-segment-length]').value));if(direction!=='straight')points.at(-1).cue=direction;addPoint(points,point);selected=points.length-1;fit();});status('Trecho adicionado a partir do último ponto.');return;
  }
  const action=event.target.closest('[data-route-action]')?.dataset.routeAction;
  if(action==='fit'){if(editable())fit();draw();status('Percurso enquadrado.');}
  if(action==='details'){const open=root.dataset.detailsOpen!=='true';root.dataset.detailsOpen=String(open);root.querySelectorAll('[data-route-action="details"]').forEach(button=>button.setAttribute('aria-expanded',String(open)));if(open)form.elements.start.focus({preventScroll:true});}
  if(action==='reset'){stop();history.push(snapshot());points=[];selected=-1;tracker=null;phase='editing';fit();error('');refresh();persist();status('Toque no quadro para marcar o novo A. Desfazer recupera o desenho anterior.');}
  if(action==='cancel-capture'){stop();phase=points.length?'paused':'idle';refresh();persist();}
  if(action==='pause')pause();
  if(action==='resume'&&phase==='paused'){if(tracker)startRecording();else enterEdit();}
  if(action==='edit')enterEdit();
  if((action==='undo'||action==='redo')&&editable())restore(action);
  if(action==='previous-point'&&selected>0)selectPoint(selected-1);
  if(action==='next-point'&&selected<points.length-1)selectPoint(selected+1);
  if(action==='remove-point'&&editable())removeSelected();
  if(action==='finish'&&['editing','recording','paused'].includes(phase)){
   if(points.length<2||length(points)<.5){error('Adicione um trecho de pelo menos 0,5 m.');return;}
   stop();if(method==='motion'&&phase!=='editing'){points=simplifyPoints(points);selected=points.length-1;}phase='review';svg.querySelector('[data-route-cursor]')?.remove();status('Confira o percurso. Você pode voltar à edição a qualquer momento.');refresh();persist();showCanvas();
  }
 }
 function input(event){if(event.target.matches('[data-route-cue]')&&editable()&&points[selected]){if(event.type!=='change')return;change(()=>{const cue=event.target.value;if(Object.hasOwn(CUES,cue))points[selected].cue=cue;else delete points[selected].cue;});status('Marcação atualizada neste ponto.');}else if(form.contains(event.target)){find('[data-route-mobile-summary]').textContent=`A · ${form.elements.start.value||'Saída'} → B · ${form.elements.end.value||'Destino'}`;scheduleDraft();}}
 const visibility=()=>{if(document.hidden){cancelGesture();pause('Pausado com a tela oculta. Retome a partir do mesmo ponto.');persist();}};
 const pagehide=()=>{cancelGesture();pause();persist();};
 const resized=()=>{if(gesture)cancelGesture();draw();};
 const pointerCancel=event=>{if(gesture?.id===event.pointerId)cancelGesture();};
 root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',input);form.addEventListener('submit',submit);
 svg.addEventListener('pointerdown',pointerDown);svg.addEventListener('pointermove',pointerMove);svg.addEventListener('pointerup',pointerUp);svg.addEventListener('pointercancel',pointerCancel);svg.addEventListener('lostpointercapture',pointerCancel);svg.addEventListener('keydown',keyboard);
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pagehide);window.addEventListener('resize',resized);
 if(draft)status('Rascunho recuperado. Continue a edição de onde parou.');else if(record)status('Arraste A, B ou as curvas. Suas alterações só entram ao salvar.');
 if(phase==='editing'&&method==='motion'){points=simplifyPoints(points);selected=points.length-1;fit();}
 refresh();
 return ()=>{if(disposed)return;cancelGesture();stop();persist();disposed=true;clearTimeout(draftTimer);root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',input);form.removeEventListener('submit',submit);svg.removeEventListener('pointerdown',pointerDown);svg.removeEventListener('pointermove',pointerMove);svg.removeEventListener('pointerup',pointerUp);svg.removeEventListener('pointercancel',pointerCancel);svg.removeEventListener('lostpointercapture',pointerCancel);svg.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',resized);};
}
