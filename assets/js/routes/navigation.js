import {Journey,buildGuide,instruction} from './guidance.js?v=20261104-name';
import {AutoJourney,trackingMessage} from './auto-guidance.js?v=20261104-name';
import {StepTracker,projection} from './model.js?v=20261104-name';
import {startMotionCapture} from './capture.js?v=20261104-name';
import {instructionMarkup,navigationMap,actionsMarkup} from './navigation-views.js?v=20261104-name';
import {metres} from './views.js?v=20261104-name';
import {esc} from '../ui.js';

export function mountNavigation(root,{route,capture=startMotionCapture}={}){
 let journey;try{journey=new AutoJourney(buildGuide(route));}catch(cause){root.innerHTML=`<div class="info-empty"><h2>Revise o desenho deste percurso.</h2><p role="alert">${esc(cause.message)}</p><a class="btn btn-secondary" href="#percurso/${encodeURIComponent(route?.id||'')}">Voltar ao mapa</a></div>`;return ()=>{};}
 const find=selector=>root.querySelector(selector),svg=find('[data-nav-svg]');let method='motion',busy=false,release=null,tracker=null,disposed=false,generation=0,follow=true,lastDraw=0,screenLock=null;
 const create=plan=>method==='motion'?new AutoJourney(plan):new Journey(plan);
 const status=message=>{const target=find('[data-nav-status]');if(target.textContent!==message)target.textContent=message;};
 const error=message=>{find('[data-nav-error]').textContent=message||'';find('[data-nav-error]').hidden=!message;};
 function stop(){generation++;release?.();release=null;if(screenLock){Promise.resolve(screenLock.release()).catch(()=>{});screenLock=null;}}
 async function keepScreenAwake(){
  const token=generation;try{const lock=await window.navigator.wakeLock?.request('screen');if(!lock)return;if(disposed||token!==generation||journey.phase!=='active')await lock.release();else screenLock=lock;}catch{}
 }
 function draw(){
  lastDraw=Date.now();const following=journey.automatic&&follow&&journey.phase!=='ready',frame=following?{scale:40,offsetX:0,offsetY:0}:projection([...journey.plan.points,...(journey.automatic?[journey.position]:[])]),unit=800/Math.max(280,svg.getBoundingClientRect().width);
  find('[data-nav-map-drawing]').innerHTML=navigationMap(journey,frame,unit,{follow:following});
  const html=instructionMarkup(journey);if(find('[data-nav-instruction]').innerHTML!==html)find('[data-nav-instruction]').innerHTML=html;
  find('[data-nav-remaining]').textContent=journey.phase==='arrived'?(journey.automatic?'Chegada estimada':'Você chegou'):`${metres(journey.remaining)} restantes`;
  find('[data-nav-stage]').textContent=journey.phase==='arrived'?'Concluído':`${journey.index+1} de ${journey.plan.legs.length} trechos`;
  find('[data-nav-progress]').value=journey.plan.total?Math.min(100,journey.travelled/journey.plan.total*100):0;
  find('[data-nav-compass]').textContent=journey.automatic?(journey.sensorOrigin===null?'Aguardando direção…':`${journey.absolute?'Bússola':'Direção relativa'} · ${Math.round(journey.heading)}° no mapa`):'Guia por confirmação';
  root.dataset.quality=journey.automatic?journey.quality:'manual';root.dataset.following=String(following);
 }
 function render(){
  root.dataset.phase=journey.phase;root.dataset.method=method;
  find('[data-nav-actions]').innerHTML=actionsMarkup(journey,{busy,method});
  find('[data-nav-setup]').hidden=journey.phase!=='ready'||busy;find('[data-nav-step]').hidden=method!=='motion';
  root.querySelectorAll('[name="navigation-method"]').forEach(input=>input.checked=input.value===method);
  find('[data-nav-action="reverse"]').disabled=journey.phase!=='ready'||busy;
  find('[data-nav-title]').textContent=`${journey.plan.start} → ${journey.plan.end}`;
  find('[data-nav-position-label]').textContent=method==='motion'?'Estimativa por passos + direção':'Último ponto confirmado';
  find('[data-nav-note]').textContent=method==='motion'?(journey.phase==='paused'?'Para reorientar, volte à linha do trecho atual e aponte o topo físico para a direção desse trecho. A reorientação usa esse ponto como referência.':'Na saída, aponte o topo físico do celular para o primeiro trecho. Caminhe com ele à frente e a tela voltada para cima. As curvas avançam automaticamente pela direção e pelos passos.'):'O marcador mostra o último ponto que você confirmou. As distâncias seguem o desenho salvo.';
  find('[data-nav-map-tools]').hidden=!journey.automatic||journey.phase==='ready';find('[data-nav-action="view"]').textContent=follow?'Ver mapa inteiro':'Acompanhar direção';
  find('[data-nav-step-list]').innerHTML=journey.plan.legs.map(leg=>`<li ${leg.index===journey.index?'aria-current="step"':''}><strong>${esc(leg.cue==='arrival'?`Chegue a ${journey.plan.end}`:instruction(leg.cue))}</strong><span>${metres(leg.distance)} · trecho ${leg.index+1}</span></li>`).join('');draw();
 }
 async function sensors(onReady){
  stop();busy=true;error('');status('Aponte o topo do celular para a frente e aguarde os sensores…');render();const token=++generation;
  try{
   tracker??=new StepTracker(Number(find('[data-nav-step-length]').value));
   const end=await capture({tracker,onHeading:reading=>{
    if(disposed||token!==generation||!journey.automatic||journey.phase!=='active')return;
    const before=journey.phase;journey.updateHeading(reading);journey.absolute=Boolean(reading.absolute);
    if(journey.phase!==before){stop();busy=false;status(trackingMessage(journey));render();return;}
    status(trackingMessage(journey));if(Date.now()-lastDraw>=80)draw();
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
  if(action==='reorient'&&journey.automatic&&journey.phase==='paused'){journey.recalibrate();tracker=null;await sensors(()=>journey.resume());return;}
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
 function change(event){if(event.target.name==='navigation-method'&&journey.phase==='ready'&&!busy){method=event.target.value==='motion'?'motion':'manual';journey=create(journey.plan);tracker=null;error('');render();}}
 function hide(){if(document.hidden){stop();busy=false;if(journey.pause())status('Pausado porque a tela ficou oculta. Retome do mesmo ponto.');render();}}
 const resize=()=>draw(),pagehide=()=>{stop();busy=false;if(journey.pause())status('Pausado ao sair da página. Retome do mesmo ponto.');render();};
 root.addEventListener('click',click);root.addEventListener('change',change);document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',pagehide);window.addEventListener('resize',resize);render();
 return ()=>{if(disposed)return;disposed=true;stop();root.removeEventListener('click',click);root.removeEventListener('change',change);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',resize);};
}
