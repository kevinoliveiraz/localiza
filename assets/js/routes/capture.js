import {StepTracker} from './model.js?v=20261104-align';
// Permission requests stay inside the Start click. The adapter never synthesizes movement.
export function compassReading(event){
 const hasCompass=Number.isFinite(event.webkitCompassHeading),heading=hasCompass?event.webkitCompassHeading:Number.isFinite(event.alpha)?360-event.alpha:null;
 const accuracy=Number.isFinite(event.webkitCompassAccuracy)?event.webkitCompassAccuracy:null;
 return {heading:heading===null?null:(heading%360+360)%360,level:Number.isFinite(event.beta)&&Number.isFinite(event.gamma)&&Math.abs(event.beta)<=50&&Math.abs(event.gamma)<=50,reliable:heading!==null&&(accuracy===null||accuracy>=0&&accuracy<=45),accuracy,absolute:hasCompass||event.absolute===true,source:`${event.type||'deviceorientation'}:${hasCompass?'compass':event.absolute?'absolute':'relative'}`};
}
export async function startMotionCapture({tracker=new StepTracker(),onStep,onStatus,onFailure,onHeading,absoluteOrientation=false,target=window}){
 if(!target.isSecureContext)throw new Error('Para capturar no celular, abra o Localiza por HTTPS. Um endereço HTTP da rede local não libera os sensores.');
 if(!target.DeviceMotionEvent||!target.DeviceOrientationEvent)throw new Error('Este navegador não oferece os sensores necessários. Use um celular compatível ou desenhe o percurso.');
 const requests=[target.DeviceMotionEvent,target.DeviceOrientationEvent].map((type,index)=>typeof type.requestPermission==='function'?(index===1?type.requestPermission(absoluteOrientation):type.requestPermission()):Promise.resolve('granted'));
 const permissions=await Promise.all(requests);
 if(permissions.some(value=>value!=='granted'))throw new Error('Acesso ao movimento não autorizado. Você pode permitir os sensores no navegador ou desenhar o percurso.');
 let stopped=false,lastMotion=Date.now(),motionSeen=false,orientationSeen=false,orientationSource=null,level=true,reliable=true;
 const stop=()=>{if(stopped)return;stopped=true;clearInterval(health);target.removeEventListener('devicemotion',motion);target.removeEventListener('deviceorientation',orientation);target.removeEventListener('deviceorientationabsolute',orientation);};
 const fail=message=>{stop();onFailure(message);};
 const orientation=event=>{
  if(stopped)return;
  if(orientationSource&&orientationSource!==event.type)return;
  const reading=compassReading(event);level=reading.level;reliable=reading.reliable;
  const at=Date.now();if(reading.heading!==null){orientationSource=event.type;orientationSeen=true;if(level&&reliable)tracker.orient(reading.heading,at);}onHeading?.({...reading,heading:reading.heading!==null&&level&&reliable?tracker.heading:reading.heading,at});
 };
 const motion=event=>{
  if(stopped)return;lastMotion=Date.now();
  const acceleration=event.accelerationIncludingGravity;
  if(!acceleration||!['x','y','z'].every(k=>Number.isFinite(acceleration[k])))return;
  motionSeen=true;
  if(!level){tracker.resetMotion();onStatus('Mantenha a tela voltada para cima para continuar registrando.');return;}
  if(!reliable){tracker.resetMotion();onStatus('Bússola imprecisa. Aguarde uma leitura melhor.');return;}
  const step=tracker.sample(acceleration,lastMotion);
  onStatus(!orientationSeen?'Aguardando a direção do celular…':lastMotion-tracker.headingAt>1800?'Aguardando atualização da direção…':'Caminhe com o celular à frente.');
  if(step)onStep(step);
 };
 tracker.resetMotion();
 target.addEventListener('deviceorientation',orientation);target.addEventListener('deviceorientationabsolute',orientation);target.addEventListener('devicemotion',motion);
 const started=Date.now(),health=setInterval(()=>{if(Date.now()-started>9000&&(!motionSeen||!orientationSeen))fail('Não chegaram dados de movimento e direção. Confira as permissões e tente em outro celular compatível.');else if(motionSeen&&Date.now()-lastMotion>5000)fail('O celular parou de enviar movimento. O percurso foi pausado; retome com a tela aberta.');},1000);
 return stop;
}
