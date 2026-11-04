import {StepTracker} from './model.js?v=20261103-navigation';
// Permission requests stay inside the Start click. The adapter never synthesizes movement.
export async function startMotionCapture({tracker=new StepTracker(),onStep,onStatus,onFailure,target=window}){
 if(!target.isSecureContext)throw new Error('Para capturar no celular, abra o Localiza por HTTPS. Um endereço HTTP da rede local não libera os sensores.');
 if(!target.DeviceMotionEvent||!target.DeviceOrientationEvent)throw new Error('Este navegador não oferece os sensores necessários. Use um celular compatível ou desenhe o percurso.');
 const requests=[target.DeviceMotionEvent,target.DeviceOrientationEvent].map(type=>typeof type.requestPermission==='function'?type.requestPermission():Promise.resolve('granted'));
 const permissions=await Promise.all(requests);
 if(permissions.some(value=>value!=='granted'))throw new Error('Acesso ao movimento não autorizado. Você pode permitir os sensores no navegador ou desenhar o percurso.');
 let stopped=false,lastMotion=Date.now(),motionSeen=false,orientationSeen=false,orientationSource=null,level=true;
 const stop=()=>{if(stopped)return;stopped=true;clearInterval(health);target.removeEventListener('devicemotion',motion);target.removeEventListener('deviceorientation',orientation);target.removeEventListener('deviceorientationabsolute',orientation);};
 const fail=message=>{stop();onFailure(message);};
 const orientation=event=>{
  if(stopped)return;
  if(orientationSource&&orientationSource!==event.type)return;
  level=Number.isFinite(event.beta)&&Number.isFinite(event.gamma)&&Math.abs(event.beta)<45&&Math.abs(event.gamma)<45;
  const heading=Number.isFinite(event.webkitCompassHeading)?event.webkitCompassHeading:Number.isFinite(event.alpha)?360-event.alpha:null;
  if(heading!==null){orientationSource=event.type;orientationSeen=true;tracker.orient(heading,Date.now());}
 };
 const motion=event=>{
  if(stopped)return;lastMotion=Date.now();
  const acceleration=event.accelerationIncludingGravity;
  if(!acceleration||!['x','y','z'].every(k=>Number.isFinite(acceleration[k])))return;
  motionSeen=true;
  if(!level){tracker.resetMotion();onStatus('Mantenha a tela voltada para cima para continuar registrando.');return;}
  const step=tracker.sample(acceleration,lastMotion);
  onStatus(!orientationSeen?'Aguardando a direção do celular…':lastMotion-tracker.headingAt>1800?'Aguardando atualização da direção…':'Caminhe com o celular à frente.');
  if(step)onStep(step);
 };
 tracker.resetMotion();
 target.addEventListener('deviceorientation',orientation);target.addEventListener('deviceorientationabsolute',orientation);target.addEventListener('devicemotion',motion);
 const started=Date.now(),health=setInterval(()=>{if(Date.now()-started>9000&&(!motionSeen||!orientationSeen))fail('Não chegaram dados de movimento e direção. Confira as permissões e tente em outro celular compatível.');else if(motionSeen&&Date.now()-lastMotion>5000)fail('O celular parou de enviar movimento. O percurso foi pausado; retome com a tela aberta.');},1000);
 return stop;
}
