import {angleDelta,distance} from './model.js?v=20261106-polish3d';
const normal=angle=>(angle%360+360)%360;
export const legHeading=leg=>normal(Math.atan2(leg.end.x-leg.start.x,-(leg.end.y-leg.start.y))*180/Math.PI);
function foot(point,leg){const dx=leg.end.x-leg.start.x,dy=leg.end.y-leg.start.y,t=Math.max(0,Math.min(1,((point.x-leg.start.x)*dx+(point.y-leg.start.y)*dy)/(dx*dx+dy*dy)));return {x:leg.start.x+t*dx,y:leg.start.y+t*dy,t};}

// Pedestrian dead reckoning in the map's local frame, not an indoor GPS fix.
// A real heading is required; turning alone cannot advance distance.
export class AutoJourney{
 constructor(plan,{alignment='auto'}={}){
  this.plan=plan;this.automatic=true;this.phase='ready';this.index=0;this.along=0;this.progress=0;this.raw={...plan.points[0]};this.mapHeading=legHeading(plan.legs[0]);this.anchorMapHeading=this.mapHeading;this.sensorOrigin=null;this.sensorSource=null;this.headingAt=-Infinity;this.lastSampleAt=-Infinity;this.quality='waiting-heading';this.routeError=0;this.steps=0;this.cumulative=[0];for(const leg of plan.legs)this.cumulative.push(this.cumulative.at(-1)+leg.distance);
  this.alignmentMode=alignment==='manual'?'manual':'auto';this.sensorHeading=null;this.alignmentPending=false;this.alignmentRequestedAt=-Infinity;this.alignmentEvidence=null;this.autoCorrectionUsed=0;
 }
 get leg(){return this.plan.legs[this.index];}
 get cue(){return this.leg.cue;}
 get travelled(){return this.progress;}
 get remaining(){return Math.max(0,this.plan.total-this.progress);}
 get position(){return {x:this.raw.x,y:this.raw.y};}
 get heading(){return this.mapHeading;}
 get matchedPoint(){const leg=this.leg,t=Math.min(1,this.along/leg.distance);return {x:leg.start.x+(leg.end.x-leg.start.x)*t,y:leg.start.y+(leg.end.y-leg.start.y)*t};}
 get trace(){return [...this.plan.points.slice(0,this.index+1),this.matchedPoint];}
 start(){if(this.phase!=='ready')return false;this.phase='active';return true;}
 pause(){if(this.phase!=='active')return false;this.phase='paused';this.alignmentEvidence=null;return true;}
 resume(){if(this.phase!=='paused')return false;this.phase='active';this.alignmentEvidence=null;return true;}
 setAlignmentMode(mode){if(!['auto','manual'].includes(mode))return false;this.alignmentMode=mode;this.alignmentEvidence=null;this.autoCorrectionUsed=0;return true;}
 requestAlignment(at=Date.now()){if(!['active','paused'].includes(this.phase)||!Number.isFinite(at))return false;this.alignmentPending=true;this.alignmentRequestedAt=at;this.alignmentEvidence=null;this.quality='waiting-heading';return true;}
 alignHeading(at=Date.now()){
  if(this.phase!=='active'||!Number.isFinite(at)||this.sensorHeading===null||at<this.headingAt||at-this.headingAt>1800||!['tracking','off-route','heading-mismatch'].includes(this.quality))return false;
  this.anchorMapHeading=legHeading(this.leg);this.sensorOrigin=this.sensorHeading;this.mapHeading=this.anchorMapHeading;this.alignmentPending=false;this.alignmentEvidence=null;this.autoCorrectionUsed=0;this.quality=this.routeError>1.4?'off-route':'tracking';return true;
 }
 recalibrate(){this.anchorMapHeading=legHeading(this.leg);this.sensorOrigin=null;this.sensorHeading=null;this.sensorSource=null;this.headingAt=-Infinity;this.quality='waiting-heading';this.raw=this.matchedPoint;this.routeError=0;this.alignmentPending=false;this.alignmentEvidence=null;this.autoCorrectionUsed=0;}
 updateHeading(reading){
  if(this.phase!=='active')return false;
  if(!reading||!Number.isFinite(reading.at)||reading.at<this.headingAt)return false;
  if(this.alignmentPending&&reading.at<this.alignmentRequestedAt)return false;
  if(!Number.isFinite(reading.heading)){this.quality='waiting-heading';this.alignmentEvidence=null;return false;}
  if(reading.level===false){this.quality='tilted';this.alignmentEvidence=null;return false;}
  if(reading.reliable===false){this.quality='weak-compass';this.alignmentEvidence=null;return false;}
  if(this.sensorSource&&reading.source&&this.sensorSource!==reading.source&&!this.alignmentPending){this.quality='source-changed';this.phase='paused';this.alignmentEvidence=null;return false;}
  this.sensorHeading=normal(reading.heading);
  if(this.alignmentPending){this.sensorSource=reading.source||null;this.sensorOrigin=this.sensorHeading;this.anchorMapHeading=legHeading(this.leg);this.autoCorrectionUsed=0;this.alignmentPending=false;}
  this.sensorSource??=reading.source||null;this.sensorOrigin??=normal(reading.heading);
  this.mapHeading=normal(this.anchorMapHeading+angleDelta(this.sensorOrigin,reading.heading));this.headingAt=reading.at;
  this.quality=this.routeError>1.4?'off-route':Math.abs(angleDelta(this.mapHeading,legHeading(this.leg)))>70?'heading-mismatch':'tracking';return true;
 }
 correctDirection(best,oldIndex){
  const error=angleDelta(this.mapHeading,legHeading(this.leg));
  if(this.alignmentMode!=='auto'||!best||best.index!==oldIndex||this.index!==oldIndex||this.routeError>.8||this.along<1||this.leg.distance-this.along<1.5||Math.abs(error)>15||Math.abs(error)<2){this.alignmentEvidence=null;return false;}
  const previous=this.alignmentEvidence,stable=previous?.index===this.index&&Math.abs(angleDelta(previous.heading,this.sensorHeading))<=8;
  this.alignmentEvidence={index:this.index,heading:this.sensorHeading,steps:stable?previous.steps+1:1};
  if(this.alignmentEvidence.steps<3||this.autoCorrectionUsed>=12)return false;
  const correction=Math.sign(error)*Math.min(Math.abs(error)*.3,1.5,12-this.autoCorrectionUsed);
  this.anchorMapHeading=normal(this.anchorMapHeading+correction);this.mapHeading=normal(this.mapHeading+correction);this.autoCorrectionUsed+=Math.abs(correction);return true;
 }
 advance(metres,at=Date.now()){
  if(this.phase!=='active'||!Number.isFinite(metres)||metres<=0||metres>1.3||!Number.isFinite(at)||at<=this.lastSampleAt)return false;
  if(this.alignmentPending||this.sensorOrigin===null||at-this.headingAt>1800||at<this.headingAt){this.quality='waiting-heading';this.alignmentEvidence=null;return false;}
  if(!['tracking','off-route','heading-mismatch'].includes(this.quality))return false;
  this.lastSampleAt=at;this.steps++;
  const radians=this.mapHeading*Math.PI/180;this.raw.x+=Math.sin(radians)*metres;this.raw.y-=Math.cos(radians)*metres;
  const oldIndex=this.index,maxAdvance=metres*1.8+.2,minimum=Math.max(0,this.progress-.3),maximum=Math.min(this.plan.total,this.progress+maxAdvance);
  let best=null,nearest=Infinity;
  for(let i=Math.max(0,this.index-1);i<this.plan.legs.length&&this.cumulative[i]<=maximum+.01;i++){
   const leg=this.plan.legs[i],projected=foot(this.raw,leg),offset=distance(this.raw,projected),progress=this.cumulative[i]+projected.t*leg.distance;
   nearest=Math.min(nearest,offset);
   const directionError=Math.abs(angleDelta(this.mapHeading,legHeading(leg)));
   if(progress<minimum||progress>maximum+.01||directionError>65||offset>1.4)continue;
   const score=offset+directionError*.005+(progress<this.progress ? .15 : 0);
   if(!best||score<best.score)best={point:projected,distance:offset,progress,index:i,score};
  }
  this.routeError=Number.isFinite(nearest)?nearest:distance(this.raw,this.matchedPoint);
  if(best){
   this.progress=Math.max(this.progress,best.progress);
   while(this.index<this.plan.legs.length-1&&this.progress>=this.cumulative[this.index+1]-.02)this.index++;
   this.along=Math.max(0,Math.min(this.leg.distance,this.progress-this.cumulative[this.index]));
   if(this.index!==oldIndex){this.alignmentEvidence=null;this.autoCorrectionUsed=0;}
   // Correct only a small, heading-compatible drift; never teleport to a distant segment.
   if(best.distance<.55&&best.index>=oldIndex){this.raw.x+=(best.point.x-this.raw.x)*.12;this.raw.y+=(best.point.y-this.raw.y)*.12;}
   this.correctDirection(best,oldIndex);
   this.quality=Math.abs(angleDelta(this.mapHeading,legHeading(this.leg)))>70?'heading-mismatch':'tracking';
  }else{this.alignmentEvidence=null;this.quality=this.routeError>1.4?'off-route':'heading-mismatch';}
  const arrivalRadius=Math.max(.45,Math.min(.85,metres));
  if(best&&this.index===this.plan.legs.length-1&&this.remaining<=arrivalRadius&&distance(this.raw,this.plan.points.at(-1))<=arrivalRadius){this.progress=this.plan.total;this.along=this.leg.distance;this.phase='arrived';this.quality='estimated-arrival';}
  return true;
 }
}
export function trackingMessage(journey){
 if(journey.alignmentPending)return 'Aguardando uma leitura estável para alinhar a direção…';
 return {'waiting-heading':'Aguardando a direção do topo do celular…',tilted:'Mantenha a tela para cima e o topo apontado para a frente.','weak-compass':'Bússola imprecisa. Aguarde uma leitura melhor.','source-changed':'A referência da bússola mudou. Aponte o topo para o corredor e toque em Alinhar.','off-route':'A estimativa se afastou do traçado. Confira sua posição. Se a direção estiver errada, use Alinhar.','heading-mismatch':'A direção do topo não acompanha o próximo trecho. Confira a curva no mapa.',tracking:'Acompanhando seus passos e a direção do topo do celular.','estimated-arrival':'Chegada estimada pelos sensores. Confira se está no destino.'}[journey.quality]||'Acompanhamento experimental';
}
