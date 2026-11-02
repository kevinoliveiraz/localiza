// A route is a local 2D polyline in metres. No geographic coordinates or sensor logs are stored.
export const MAX_POINTS=6000;
export const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export const length=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
export const angleDelta=(from,to)=>((to-from+540)%360)-180;
export function addPoint(points,point){
 if(points.length>=MAX_POINTS)throw new Error('O percurso atingiu o limite. Conclua e salve este trecho.');
 if(!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new Error('Ponto inválido.');
 if(points.length&&distance(points.at(-1),point)<.08)return false;
 points.push({x:Math.round(point.x*1000)/1000,y:Math.round(point.y*1000)/1000});return true;
}
export function fitPath(points,width=800,height=480,padding=70){
 if(!points.length)return {path:'',positions:[],scale:24};
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys);
 const spanX=Math.max(...xs)-minX,spanY=Math.max(...ys)-minY;
 const scale=Math.min(32,(width-padding*2)/Math.max(spanX,1),(height-padding*2)/Math.max(spanY,1));
 const positions=points.map(p=>({x:(p.x-minX-spanX/2)*scale+width/2,y:(p.y-minY-spanY/2)*scale+height/2}));
 return {path:positions.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),positions,scale};
}
export class StepTracker{
 constructor(stepLength=.7){
  if(!Number.isFinite(stepLength)||stepLength<.3||stepLength>1.2)throw new Error('Use um passo entre 0,30 e 1,20 m.');
  this.stepLength=stepLength;this.heading=null;this.originHeading=null;this.headingAt=-Infinity;this.gravity=null;this.samples=0;this.lastStep=-Infinity;this.high=false;
 }
 orient(heading,at){
  if(!Number.isFinite(heading)||!Number.isFinite(at))return;
  const normalized=(heading%360+360)%360;
  this.heading=this.heading===null?normalized:(this.heading+angleDelta(this.heading,normalized)*.4+360)%360;
  this.originHeading??=this.heading;this.headingAt=at;
 }
 resetMotion(){this.gravity=null;this.samples=0;this.high=false;this.lastStep=-Infinity;}
 sample(acceleration,at){
  if(!Number.isFinite(at)||!acceleration||!['x','y','z'].every(k=>Number.isFinite(acceleration[k])))return null;
  const magnitude=Math.hypot(acceleration.x,acceleration.y,acceleration.z);
  if(magnitude<3||magnitude>24)return null;
  this.gravity??=magnitude;this.gravity=.92*this.gravity+.08*magnitude;this.samples++;
  const signal=magnitude-this.gravity;
  if(signal<.15)this.high=false;
  if(this.samples<20||signal<1.1||this.high)return null;
  this.high=true;
  if(at-this.lastStep<340||at-this.headingAt>1800||this.heading===null)return null;
  this.lastStep=at;
  const radians=angleDelta(this.originHeading,this.heading)*Math.PI/180;
  return {x:Math.sin(radians)*this.stepLength,y:-Math.cos(radians)*this.stepLength};
 }
}
