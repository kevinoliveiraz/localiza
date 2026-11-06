import {Journey,buildGuide,instruction} from './guidance.js?v=20261106-polish3d';
import {AutoJourney,trackingMessage} from './auto-guidance.js?v=20261106-polish3d';
import {StepTracker,projection} from './model.js?v=20261106-polish3d';
import {startMotionCapture} from './capture.js?v=20261106-polish3d';
import {instructionMarkup,navigationMap,actionsMarkup} from './navigation-views.js?v=20261106-polish3d';
import {metres} from './views.js?v=20261106-polish3d';
import {esc} from '../ui.js';
import {mountRouteViewer} from './route-viewer.js?v=20261106-polish3d';

export function mountNavigation(root,{route,capture=startMotionCapture,load3D}={}){
 let journey;try{journey=new AutoJourney(buildGuide(route));}catch(cause){root.innerHTML=`<div class="info-empty"><h2>Revise o desenho deste percurso.</h2><p role="alert">${esc(cause.message)}</p><a class="btn btn-secondary" href="#percurso/${encodeURIComponent(route?.id||'')}">Voltar ao mapa</a></div>`;return ()=>{};}
 const find=selector=>root.querySelector(selector),svg=find('[data-nav-svg]');let method='motion',alignment='auto',busy=false,release=null,tracker=null,disposed=false,generation=0,follow=true,lastDraw=0,screenLock=null,alignedUntil=0,alignmentFeedbackTimer=null;
 const routeViewer=mountRouteViewer(find('[data-route-viewer]'),{journey,load3D,onChange:()=>draw()});
 const create=plan=>method==='motion'?new AutoJourney(plan,{alignment}):new Journey(plan);
 const status=message=>{const target=find('[data-nav-status]');if(target.textContent!==message)target.textContent=message;};
 const error=message=>{find('[data-nav-error]').textContent=message||'';find('[data-nav-error]').hidden=!message;};
 const alignmentOptions=find('[data-nav-align-options]');
 function placeAlignment(){
  if(!alignmentOptions.open)return;
  const panel=find('.route-nav-align-panel'),anchor=find('[data-nav-align-control]').getBoundingClientRect(),box=panel.getBoundingClientRect(),actions=find('[data-nav-actions]'),actionsBox=actions.getBoundingClientRect();
  const limit=window.getComputedStyle(actions).position==='fixed'?Math.min(window.innerHeight-12,actionsBox.top-12):window.innerHeight-12;
  const below=anchor.bottom+10,above=anchor.top-box.height-10,top=below+box.height<=limit?below:above>=12?above:Math.max(12,limit-box.height);
  panel.style.top=`${top}px`;panel.style.left=`${Math.max(12,Math.min(anchor.left,window.innerWidth-box.width-12))}px`;
 }
 function stop(){generation++;release?.();release=null;clearTimeout(alignmentFeedbackTimer);alignmentFeedbackTimer=null;alignedUntil=0;if(screenLock){Promise.resolve(screenLock.release()).catch(()=>{});screenLock=null;}}
 function aligned(){alignedUntil=Date.now()+2200;clearTimeout(alignmentFeedbackTimer);status('Direção alinhada ao trecho atual.');draw();alignmentFeedbackTimer=setTimeout(()=>{if(!disposed){alignedUntil=0;draw();}},2200);}
 async function keepScreenAwake(){
  const token=generation;try{const lock=await window.navigator.wakeLock?.request('screen');if(!lock)return;if(disposed||token!==generation||journey.phase!=='active')await lock.release();else screenLock=lock;}catch{}
 }
 function draw(){
  lastDraw=Date.now();const following=journey.automatic&&follow&&journey.phase!=='ready',frame=following?{scale:40,offsetX:0,offsetY:0}:projection([...journey.plan.points,...(journey.automatic?[journey.position]:[])]),unit=800/Math.max(280,svg.getBoundingClientRect().width);
  find('[data-nav-map-drawing]').innerHTML=navigationMap(journey,frame,unit,{follow:following});
  routeViewer.update(journey,{follow:following});
  const html=instructionMarkup(journey);if(find('[data-nav-instruction]').innerHTML!==html)find('[data-nav-instruction]').innerHTML=html;
  find('[data-nav-remaining]').textContent=journey.phase==='arrived'?(journey.automatic?'Chegada estimada':'Você chegou'):`${metres(journey.remaining)} restantes`;
  find('[data-nav-stage]').textContent=journey.phase==='arrived'?'Concluído':`${journey.index+1} de ${journey.plan.legs.length} trechos`;
  find('[data-nav-progress]').value=journey.plan.total?Math.min(100,journey.travelled/journey.plan.total*100):0;
  find('[data-nav-compass]').textContent=journey.automatic?(journey.sensorOrigin===null?'Aguardando direção…':`${journey.absolute?'Bússola':'Direção relativa'} · ${Math.round(journey.heading)}° no mapa`):'Guia por confirmação';
  root.dataset.quality=journey.automatic?journey.quality:'manual';root.dataset.following=String(following);
  root.dataset.alignment=journey.automatic?journey.alignmentMode:'manual';find('[data-nav-align-label]').textContent=journey.alignmentPending?'Aguarde':Date.now()<alignedUntil?'Alinhado':'Alinhar';
  find('[data-nav-action="align"]').disabled=busy||Boolean(journey.alignmentPending&&journey.phase==='active');
 }
 function render(){
  root.dataset.phase=journey.phase;root.dataset.method=method;
  find('[data-nav-actions]').innerHTML=actionsMarkup(journey,{busy,method});
  find('[data-nav-setup]').hidden=journey.phase!=='ready'||busy;find('[data-nav-step]').hidden=method!=='motion';
  root.querySelectorAll('[name="navigation-method"]').forEach(input=>input.checked=input.value===method);
  find('[data-nav-action="reverse"]').disabled=journey.phase!=='ready'||busy;
  find('[data-nav-auto-align]').checked=alignment==='auto';find('[data-nav-auto-align]').disabled=busy;find('[data-nav-align-control]').hidden=journey.phase==='arrived';
  find('[data-nav-title]').textContent=`${journey.plan.start} → ${journey.plan.end}`;
  find('[data-nav-position-label]').textContent=method==='motion'?'Estimativa por passos + direção':'Último ponto confirmado';
  find('[data-nav-note]').textContent=method==='motion'?'Para corrigir a direção, aponte o celular ao longo do corredor e toque em Alinhar. A seta muda de direção sem alterar seu ponto no mapa. O ajuste automático faz apenas pequenas correções em trechos retos.':'O marcador mostra o último ponto que você confirmou. As distâncias seguem o desenho salvo.';
  find('[data-nav-map-tools]').hidden=!journey.automatic||journey.phase==='ready';find('[data-nav-action="view"]').textContent=follow?'Ver mapa inteiro':'Acompanhar direção';
  find('[data-nav-step-list]').innerHTML=journey.plan.legs.map(leg=>`<li ${leg.index===journey.index?'aria-current="step"':''}><strong>${esc(leg.cue==='arrival'?`Chegue a ${journey.plan.end}`:instruction(leg.cue))}</strong><span>${metres(leg.distance)} · trecho ${leg.index+1}</span></li>`).join('');draw();
 }
 async function sensors(onReady){
  stop();busy=true;error('');status('Aponte o topo do celular para a frente e aguarde os sensores…');render();const token=++generation;
  try{
   tracker??=new StepTracker(Number(find('[data-nav-step-length]').value));
   const end=await capture({tracker,onHeading:reading=>{
    if(disposed||token!==generation||!journey.automatic||journey.phase!=='active')return;
    const before=journey.phase,wasPending=journey.alignmentPending;const accepted=journey.updateHeading(reading);journey.absolute=Boolean(reading.absolute);
    if(journey.phase!==before){stop();busy=false;status(trackingMessage(journey));render();return;}
    if(wasPending&&accepted&&!journey.alignmentPending){aligned();return;}status(trackingMessage(journey));if(Date.now()-lastDraw>=80)draw();
   },onStep:step=>{
    if(disposed||token!==generation||journey.phase!=='active')return;const previous=journey.phase,index=journey.index;
    journey.advance(Math.hypot(step.x,step.y),Date.now());
    if(journey.phase==='arrived'){stop();status(trackingMessage(journey));render();return;}
    if(journey.automatic){status(trackingMessage(journey));if(journey.index!==index)render();else draw();}
    else if(journey.phase!==previous){stop();status('Ponto estimado alcançado. Confira no local.');render();}else draw();
   },onStatus:message=>{if(!disposed&&token===generation&&journey.phase==='active'){if(journey.automatic&&message.startsWith('Aguardando')){journey.quality='waiting-heading';if(Date.now()-lastDraw>=80)draw();}status(journey.automatic?trackingMessage(journey):message);}},onFailure:message=>{if(disposed||token!==generation)return;stop();journey.pause();busy=false;status('Acompanhamento pausado');error(message);render();}});
   if(disposed||token!==generation){end();return;}release=end;busy=false;onReady();status(journey.automatic?trackingMessage(journey):'Siga até o próximo ponto.');render();if(journey.automatic)void keepScreenAwake();if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});
  }catch(cause){if(disposed||token!==generation)return;busy=false;status('Não foi possível iniciar os sensores');error(cause.message||'Tente continuar por confirmação.');render();}
 }
 function reset(reverse=false){stop();busy=false;tracker=null;follow=true;journey=create(buildGuide(route,reverse));error('');status('Na saída, aponte o topo do celular para o primeiro trecho antes de iniciar.');render();}
 async function click(event){
  if(!event.target.closest('[data-nav-align-control]'))find('[data-nav-align-options]').open=false;
  const action=event.target.closest('[data-nav-action]')?.dataset.navAction;if(!action)return;
  if(action==='cancel'){stop();busy=false;status('Solicitação cancelada.');render();return;}
  if(busy)return;
  if(action==='view'){follow=!follow;render();return;}
  if(action==='reverse'&&journey.phase==='ready'){reset(!journey.plan.reverse);return;}
  if(action==='restart'){reset(journey.plan.reverse);return;}
  if(action==='start'&&journey.phase==='ready'){
   if(method==='motion')await sensors(()=>journey.start());else{journey.start();status('Siga a orientação e confirme ao chegar ao próximo ponto.');render();if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});}return;
  }
  if(action==='pause'&&journey.phase==='active'){stop();journey.pause();status('Percurso pausado. Retome do mesmo ponto.');render();return;}
  if(action==='resume'&&journey.phase==='paused'){if(method==='motion')await sensors(()=>journey.resume());else{journey.resume();status('Continue até o próximo ponto.');render();}return;}
  if(['align','reorient'].includes(action)&&journey.automatic&&['active','paused'].includes(journey.phase)){
   find('[data-nav-align-options]').open=false;
   if(journey.phase==='active'&&journey.alignHeading(Date.now())){tracker?.resetMotion();aligned();return;}
   journey.requestAlignment(Date.now());error('');
   if(journey.phase==='paused'){tracker=null;await sensors(()=>journey.resume());}else{status(trackingMessage(journey));draw();}return;
  }
  if(action==='manual'&&['paused','checkpoint','departure'].includes(journey.phase)){
   stop();method='manual';if(journey.automatic){const previous=journey;journey=new Journey(previous.plan);journey.index=previous.index;journey.phase='active';}else if(journey.phase==='paused')journey.resetEstimate();status('Guia manual: avance ao confirmar os pontos no local.');error('');render();return;
  }
  if(action==='reach'&&!journey.automatic&&journey.phase==='active'){stop();journey.reach();status('Confira esta orientação e confirme para continuar.');render();return;}
  if(action==='confirm'&&!journey.automatic&&['checkpoint','departure'].includes(journey.phase)){
   journey.confirm();status(journey.phase==='arrived'?'Chegada confirmada.':'Ponto confirmado. Siga para a próxima orientação.');render();return;
  }
  if(action==='back'&&journey.phase==='departure'){reset(journey.plan.reverse);return;}
  if(action==='back'&&journey.phase==='checkpoint'){journey.along=0;journey.phase='active';status('Siga novamente até este ponto.');render();}
 }
 function change(event){if(event.target.matches('[data-nav-auto-align]')&&journey.automatic&&!busy){alignment=event.target.checked?'auto':'manual';journey.setAlignmentMode(alignment);find('[data-nav-align-options]').open=false;status(alignment==='auto'?'Ajuste automático ativado para pequenas variações em trechos retos.':'Ajuste automático desativado. Use Alinhar quando precisar.');draw();return;}if(event.target.name==='navigation-method'&&journey.phase==='ready'&&!busy){method=event.target.value==='motion'?'motion':'manual';journey=create(journey.plan);tracker=null;error('');render();}}
 function keyboard(event){if(event.key==='Escape'&&find('[data-nav-align-options]').open){find('[data-nav-align-options]').open=false;find('[data-nav-align-options] summary').focus();}}
 function hide(){if(document.hidden){stop();busy=false;if(journey.pause())status('Pausado porque a tela ficou oculta. Retome do mesmo ponto.');render();}}
 const resize=()=>{draw();placeAlignment();},pagehide=()=>{stop();busy=false;if(journey.pause())status('Pausado ao sair da página. Retome do mesmo ponto.');render();};
 root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('keydown',keyboard);alignmentOptions.addEventListener('toggle',placeAlignment);document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',pagehide);window.addEventListener('resize',resize);window.addEventListener('scroll',placeAlignment,{passive:true});render();
 return ()=>{if(disposed)return;disposed=true;stop();routeViewer.dispose();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('keydown',keyboard);alignmentOptions.removeEventListener('toggle',placeAlignment);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',resize);window.removeEventListener('scroll',placeAlignment);};
}
