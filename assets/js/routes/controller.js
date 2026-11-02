import {StepTracker,addPoint,length} from './model.js';
import {startMotionCapture} from './capture.js';
import {saveRoute} from './store.js';
import {pathMarkup,metres} from './views.js';
import {I} from '../ui.js';

export function mountRecorder(root,{navigate,capture=startMotionCapture}={}){
 const find=selector=>root.querySelector(selector),form=find('[data-route-form]'),svg=find('.route-svg');
 let method='motion',phase='idle',points=[],stopCapture=null,tracker=null,disposed=false,generation=0,cursor={x:400,y:240};
 const error=message=>{const target=find('[data-route-error]');target.textContent=message||'';target.hidden=!message;};
 const status=message=>{const target=find('[data-route-status]');if(target.textContent!==message)target.textContent=message;};
 function stop(){generation++;stopCapture?.();stopCapture=null;}
 function actions(){
  const target=find('[data-route-actions]');
  target.innerHTML=phase==='idle'?`<button type="submit" class="btn btn-primary">Marcar A e começar ${I('arrow',17)}</button>`:phase==='arming'?'<button class="btn btn-primary" type="button" disabled>Aguardando permissão…</button><button type="button" data-route-action="reset" class="route-text-button">Cancelar</button>':phase==='finished'?`<button type="submit" class="btn btn-primary">${I('check',17)} Salvar percurso</button><button type="button" data-route-action="reset" class="route-text-button">Refazer percurso</button>`:`<button type="button" data-route-action="finish" class="btn btn-primary" ${points.length<2?'disabled':''}>${I('check',17)} Cheguei ao ponto B</button>${method==='motion'?`<button type="button" data-route-action="${phase==='recording'?'pause':'resume'}" class="btn btn-secondary">${phase==='recording'?'Pausar':'Continuar caminhada'}</button>`:''}<button type="button" data-route-action="reset" class="route-text-button">Recomeçar</button>`;
  find('[data-route-mobile-actions]').innerHTML=target.innerHTML.replaceAll('type="submit"','type="submit" form="route-create-form"');
  root.dataset.phase=phase;
  const summary=find('[data-route-mobile-summary]');summary.textContent=`A · ${form.elements.start.value} → B · ${form.elements.end.value}`;summary.hidden=phase==='idle';
  for(const button of root.querySelectorAll('[data-route-mode]'))button.disabled=phase!=='idle';
  form.elements.stepLength.disabled=phase!=='idle'||method==='manual';
  find('[data-route-manual-tools]').hidden=method!=='manual'||phase!=='recording';
  svg.setAttribute('aria-label',method==='manual'&&phase==='recording'?'Área de desenho. Clique para adicionar pontos. No teclado, use as setas e Enter.':'Percurso em duas dimensões, visto de cima');
  svg.setAttribute('tabindex',method==='manual'&&phase==='recording'?'0':'-1');
 }
 function draw(){
  find('[data-route-drawing]').innerHTML=pathMarkup(points,{finished:phase==='finished',manual:method==='manual'});
  find('[data-route-placeholder]').hidden=points.length>0;
  find('[data-route-distance]').textContent=metres(length(points));
  find('[data-route-count]').textContent=Math.max(0,points.length-1);
  root.dataset.recording=phase==='recording'?'true':'false';
 }
 function append(point){try{const wasReady=points.length>1;if(addPoint(points,point)){draw();if(wasReady!==(points.length>1))actions();}}catch(cause){stop();phase='paused';error(cause.message);status('Percurso pausado');actions();}}
 function pause(message='Percurso pausado. Fique no mesmo ponto para retomar.'){
  if(!['recording','arming'].includes(phase))return;stop();phase='paused';status(message);actions();draw();
 }
 async function record(){
  error('');phase='arming';actions();status('Preparando os sensores…');const token=++generation;
  try{
   const release=await capture({tracker,onStep:step=>{if(disposed||phase!=='recording')return;const previous=points.at(-1);append({x:previous.x+step.x,y:previous.y+step.y});},onStatus:message=>{if(!disposed&&phase==='recording')status(message);},onFailure:message=>{if(!disposed){pause('Captura interrompida');error(message);}}});
   if(disposed||token!==generation){release();return;}stopCapture=release;phase='recording';if(!points.length)points=[{x:0,y:0}];status('Espere a direção ficar pronta e comece a caminhar.');actions();draw();if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});
  }catch(cause){if(disposed||token!==generation)return;phase=points.length?'paused':'idle';status('Captura não iniciada');error(cause.message||'Não foi possível acessar os sensores.');actions();}
 }
 function reset(){stop();phase='idle';points=[];tracker=null;svg.querySelector('[data-route-cursor]')?.remove();error('');status('Pronto para começar');draw();actions();}
 function mode(value){
  if(phase!=='idle')return;method=value;
  root.querySelectorAll('[data-route-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.routeMode===method)));
  find('[data-route-help]').innerHTML=method==='manual'?'<strong>Desenhe o caminho com toques.</strong><p>Marque A no quadro e toque nos pontos em que o corredor vira. Ao terminar, o último ponto será B.</p><span class="route-tag">Desenho manual · sem sensores</span>':'<strong>Registre enquanto caminha.</strong><p>Segure o celular à frente, com a tela para cima. Espere a direção ficar pronta e mantenha a mesma posição ao virar.</p><span class="route-tag">Captura experimental · passos + direção</span>';
  find('[data-route-calibration]').hidden=method==='manual';
  find('[data-route-limitation]').textContent=method==='manual'?'Este modo permite criar e testar o percurso sem caminhar. A escala é ilustrativa: o desenho não mede o corredor real.':'Os sensores estimam o caminho e podem acumular desvios. Não é uma planta com medidas reais. Use o celular com a tela aberta; é necessário HTTPS e permissão de movimento.';
  find('[data-route-source]').textContent=method==='manual'?'Desenho manual':'Passos + direção';
  find('[data-route-count-label]').textContent=method==='manual'?'trechos desenhados':'passos registrados';error('');actions();
 }
 async function submit(event){
  event.preventDefault();if(!form.reportValidity())return;
  if(phase==='finished'){
   try{const route=saveRoute({points,method,start:form.elements.start.value,end:form.elements.end.value});navigate('percurso/'+route.id);}catch(cause){error(cause.message);}return;
  }
  if(phase!=='idle')return;
  if(method==='motion'){try{tracker=new StepTracker(Number(form.elements.stepLength.value));}catch(cause){error(cause.message);return;}await record();}
  else{phase='recording';error('');status('Toque no quadro para marcar A.');actions();svg.focus({preventScroll:true});if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});}
 }
 function manualPoint(point){
  if(method!=='manual'||phase!=='recording')return;
  const x=Math.max(35,Math.min(765,point.x)),y=Math.max(35,Math.min(445,point.y));cursor={x,y};append({x:(x-400)/24,y:(y-240)/24});status(points.length>1?'Adicione as curvas. O último ponto será B.':'Ponto A marcado. Toque no próximo ponto.');
 }
 function pointer(event){if(method!=='manual'||phase!=='recording')return;const matrix=svg.getScreenCTM();if(!matrix)return;const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());manualPoint(point);}
 function keyboard(event){
  if(method!=='manual'||phase!=='recording')return;
  if(event.key==='Enter'||event.key===' '){event.preventDefault();manualPoint(cursor);return;}
  const changes={ArrowUp:[0,-24],ArrowDown:[0,24],ArrowLeft:[-24,0],ArrowRight:[24,0]};if(!changes[event.key])return;event.preventDefault();const [dx,dy]=changes[event.key];cursor={x:Math.max(35,Math.min(765,cursor.x+dx)),y:Math.max(35,Math.min(445,cursor.y+dy))};let marker=svg.querySelector('[data-route-cursor]');if(!marker){marker=document.createElementNS('http://www.w3.org/2000/svg','circle');marker.dataset.routeCursor='';marker.setAttribute('r','7');marker.setAttribute('class','route-keyboard-cursor');svg.append(marker);}marker.setAttribute('cx',cursor.x);marker.setAttribute('cy',cursor.y);
 }
 function click(event){
  const modeButton=event.target.closest('[data-route-mode]');if(modeButton){mode(modeButton.dataset.routeMode);return;}
  const action=event.target.closest('[data-route-action]')?.dataset.routeAction;
  if(action==='reset')reset();
  if(action==='pause')pause();
  if(action==='resume'&&phase==='paused')record();
  if(action==='undo'&&method==='manual'&&phase==='recording'){points.pop();draw();actions();status(points.length?'Último ponto removido.':'Toque no quadro para marcar A.');}
  if(action==='finish'&&['recording','paused'].includes(phase)&&points.length>1){if(length(points)<.5){error('Adicione um trecho de pelo menos 0,5 m.');return;}stop();phase='finished';status('Você chegou. Confira o traçado e salve.');actions();draw();svg.querySelector('[data-route-cursor]')?.remove();}
 }
 const visibility=()=>{if(document.hidden)pause('Pausado porque a tela ficou oculta. Retome a partir do mesmo ponto.');};
 const unload=event=>{if(points.length&&phase!=='idle'){event.preventDefault();event.returnValue='';}};
 root.addEventListener('click',click);form.addEventListener('submit',submit);svg.addEventListener('click',pointer);svg.addEventListener('keydown',keyboard);document.addEventListener('visibilitychange',visibility);window.addEventListener('beforeunload',unload);
 actions();
 return ()=>{disposed=true;stop();root.removeEventListener('click',click);form.removeEventListener('submit',submit);svg.removeEventListener('click',pointer);svg.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeunload',unload);};
}
