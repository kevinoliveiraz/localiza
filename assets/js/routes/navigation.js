import {Journey,buildGuide,instruction} from './guidance.js?v=20261103-navigation';
import {StepTracker,projection} from './model.js?v=20261103-navigation';
import {startMotionCapture} from './capture.js?v=20261103-navigation';
import {instructionMarkup,navigationMap,actionsMarkup} from './navigation-views.js?v=20261103-navigation';
import {metres} from './views.js?v=20261103-navigation';
import {esc} from '../ui.js';

export function mountNavigation(root,{route,capture=startMotionCapture}={}){
 let journey;try{journey=new Journey(buildGuide(route));}catch(cause){root.innerHTML=`<div class="info-empty"><h2>Revise o desenho deste percurso.</h2><p role="alert">${esc(cause.message)}</p><a class="btn btn-secondary" href="#percurso/${encodeURIComponent(route?.id||'')}">Voltar ao mapa</a></div>`;return ()=>{};}
 const find=selector=>root.querySelector(selector),svg=find('[data-nav-svg]');let method='manual',busy=false,release=null,tracker=null,disposed=false,generation=0;
 const status=message=>{const target=find('[data-nav-status]');if(target.textContent!==message)target.textContent=message;};
 const error=message=>{find('[data-nav-error]').textContent=message||'';find('[data-nav-error]').hidden=!message;};
 function stop(){generation++;release?.();release=null;}
 function draw(){
  const frame=projection(journey.plan.points),unit=800/Math.max(280,svg.getBoundingClientRect().width);
  find('[data-nav-map-drawing]').innerHTML=navigationMap(journey,frame,unit);
  const html=instructionMarkup(journey);if(find('[data-nav-instruction]').innerHTML!==html)find('[data-nav-instruction]').innerHTML=html;
  find('[data-nav-remaining]').textContent=journey.phase==='arrived'?'Você chegou':`${metres(journey.remaining)} restantes`;
  find('[data-nav-stage]').textContent=journey.phase==='arrived'?'Concluído':`${journey.index+1} de ${journey.plan.legs.length} trechos`;
  find('[data-nav-progress]').value=journey.plan.total?Math.min(100,journey.travelled/journey.plan.total*100):0;
 }
 function render(){
  root.dataset.phase=journey.phase;root.dataset.method=method;
  find('[data-nav-actions]').innerHTML=actionsMarkup(journey,{busy,method});
  find('[data-nav-setup]').hidden=journey.phase!=='ready'||busy;find('[data-nav-step]').hidden=method!=='motion';
  root.querySelectorAll('[name="navigation-method"]').forEach(input=>input.checked=input.value===method);
  find('[data-nav-action="reverse"]').disabled=journey.phase!=='ready'||busy;
  find('[data-nav-title]').textContent=`${journey.plan.start} → ${journey.plan.end}`;
  find('[data-nav-position-label]').textContent=method==='motion'?'Posição estimada pelos passos':'Último ponto confirmado';
  find('[data-nav-note]').textContent=method==='motion'?'O marcador avança pelos passos sobre a linha cadastrada e para em cada curva ou escada. Confirme no local antes de continuar.':'O marcador mostra o último ponto que você confirmou. As distâncias seguem o desenho salvo.';
  find('[data-nav-step-list]').innerHTML=journey.plan.legs.map(leg=>`<li ${leg.index===journey.index?'aria-current="step"':''}><strong>${esc(leg.cue==='arrival'?`Chegue a ${journey.plan.end}`:instruction(leg.cue))}</strong><span>${metres(leg.distance)} · trecho ${leg.index+1}</span></li>`).join('');draw();
 }
 async function sensors(onReady){
  stop();busy=true;error('');status('Preparando movimento e direção do celular…');render();const token=++generation;
  try{
   tracker??=new StepTracker(Number(find('[data-nav-step-length]').value));
   const end=await capture({tracker,onStep:step=>{
    if(disposed||token!==generation||journey.phase!=='active')return;const previous=journey.phase;
    journey.advance(Math.hypot(step.x,step.y));
    if(journey.phase!==previous){stop();status('Ponto estimado alcançado. Confira a curva ou escada no local.');render();}else draw();
   },onStatus:message=>{if(!disposed&&token===generation&&journey.phase==='active')status(message);},onFailure:message=>{if(disposed||token!==generation)return;stop();journey.pause();busy=false;status('Acompanhamento pausado');error(message);render();}});
   if(disposed||token!==generation){end();return;}release=end;busy=false;onReady();status('Acompanhamento experimental. Mantenha a tela aberta e a posição do celular.');render();if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});
  }catch(cause){if(disposed||token!==generation)return;busy=false;status('Não foi possível iniciar os sensores');error(cause.message||'Tente continuar por confirmação.');render();}
 }
 function reset(reverse=false){stop();busy=false;tracker=null;journey=new Journey(buildGuide(route,reverse));error('');status('Vá até a saída A antes de iniciar.');render();}
 async function click(event){
  const action=event.target.closest('[data-nav-action]')?.dataset.navAction;if(!action)return;
  if(action==='cancel'){stop();busy=false;status('Solicitação cancelada.');render();return;}
  if(busy)return;
  if(action==='reverse'&&journey.phase==='ready'){reset(!journey.plan.reverse);return;}
  if(action==='restart'){reset(journey.plan.reverse);return;}
  if(action==='start'&&journey.phase==='ready'){
   if(method==='motion'&&!journey.plan.points[0].cue)await sensors(()=>journey.start());else{journey.start();status('Siga a orientação e confirme ao chegar ao próximo ponto.');render();if(window.matchMedia('(max-width: 700px)').matches)root.scrollIntoView({block:'start'});}return;
  }
  if(action==='pause'&&journey.phase==='active'){stop();journey.pause();status('Percurso pausado. Retome do mesmo ponto.');render();return;}
  if(action==='resume'&&journey.phase==='paused'){if(method==='motion')await sensors(()=>journey.resume());else{journey.resume();status('Continue até o próximo ponto.');render();}return;}
  if(action==='manual'&&['paused','checkpoint','departure'].includes(journey.phase)){stop();method='manual';if(journey.phase==='paused')journey.resetEstimate();status('Continue confirmando os pontos no local.');error('');render();return;}
  if(action==='reach'&&journey.phase==='active'){stop();journey.reach();status('Confira esta orientação e confirme para continuar.');render();return;}
  if(action==='confirm'&&['checkpoint','departure'].includes(journey.phase)){
   if(journey.phase==='checkpoint'&&journey.index===journey.plan.legs.length-1){stop();journey.confirm();status('Chegada confirmada.');render();return;}
   if(method==='motion')await sensors(()=>journey.confirm());else{journey.confirm();status('Ponto confirmado. Siga para a próxima orientação.');render();}return;
  }
  if(action==='back'&&journey.phase==='departure'){reset(journey.plan.reverse);return;}
  if(action==='back'&&journey.phase==='checkpoint'){stop();journey.along=0;journey.phase='active';if(method==='motion'){method='manual';status('Voltou ao trecho por confirmação.');}else status('Siga novamente até este ponto.');render();}
 }
 function change(event){if(event.target.name==='navigation-method'&&journey.phase==='ready'&&!busy){method=event.target.value==='motion'?'motion':'manual';tracker=null;error('');render();}}
 function hide(){if(document.hidden){stop();busy=false;if(journey.pause())status('Pausado porque a tela ficou oculta. Retome do mesmo ponto.');render();}}
 const resize=()=>draw(),pagehide=()=>{stop();busy=false;if(journey.pause())status('Pausado ao sair da página. Retome do mesmo ponto.');render();};
 root.addEventListener('click',click);root.addEventListener('change',change);document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',pagehide);window.addEventListener('resize',resize);render();
 return ()=>{if(disposed)return;disposed=true;stop();root.removeEventListener('click',click);root.removeEventListener('change',change);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',pagehide);window.removeEventListener('resize',resize);};
}
