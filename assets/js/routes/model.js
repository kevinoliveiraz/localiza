// A route is a local 2D polyline in metres. No geographic coordinates or sensor logs are stored.
export const MAX_POINTS=6000;
export const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export const length=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
export const angleDelta=(from,to)=>((to-from+540)%360)-180;
export const CUES={left:'Vire à esquerda',right:'Vire à direita','stairs-up':'Suba a escada','stairs-down':'Desça a escada'};
export const pointName=(index,count)=>index===0?'Ponto A':index===count-1?'Ponto B':`Curva ${index}`;
export function projection(points,width=800,height=640,padding=90){
 if(!points.length)return {scale:32,offsetX:width/2,offsetY:height/2};
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=points.length>1?Math.min(120,(width-padding*2)/Math.max(maxX-minX,1),(height-padding*2)/Math.max(maxY-minY,1)):32;
 return {scale,offsetX:width/2-(minX+maxX)/2*scale,offsetY:height/2-(minY+maxY)/2*scale};
}
export const toCanvas=(point,frame)=>({x:point.x*frame.scale+frame.offsetX,y:point.y*frame.scale+frame.offsetY});
export const fromCanvas=(point,frame)=>({x:(point.x-frame.offsetX)/frame.scale,y:(point.y-frame.offsetY)/frame.scale});
export function nextSegment(points,direction='straight',metres=2){
 if(!points.length)throw new Error('Marque primeiro o ponto A.');
 if(!['straight','left','right'].includes(direction)||!Number.isFinite(metres)||metres<.3||metres>30)throw new Error('Use um trecho entre 0,30 e 30 m.');
 const last=points.at(-1),previous=points.at(-2),dx=previous?last.x-previous.x:0,dy=previous?last.y-previous.y:-1;
 if(previous&&Math.hypot(dx,dy)<.08)throw new Error('Afaste os dois últimos pontos para definir a direção.');
 const angle=Math.atan2(dy,dx)+(direction==='left'?-Math.PI/2:direction==='right'?Math.PI/2:0);
 return {x:last.x+Math.cos(angle)*metres,y:last.y+Math.sin(angle)*metres};
}
export function movePoint(points,index,point){
 if(!points[index]||!Number.isFinite(point.x)||!Number.isFinite(point.y)||Math.abs(point.x)>20000||Math.abs(point.y)>20000)throw new Error('Posição inválida.');
 if([points[index-1],points[index+1]].some(neighbour=>neighbour&&distance(neighbour,point)<.08))return false;
 points[index]={...points[index],x:Math.round(point.x*1000)/1000,y:Math.round(point.y*1000)/1000};return true;
}
export function simplifyPoints(points,tolerance=.18){
 if(points.length<3)return structuredClone(points);
 const keep=new Set([0,points.length-1,...points.flatMap((p,i)=>p.cue?[i]:[])]),anchors=[...keep].sort((a,b)=>a-b),stack=anchors.slice(1).map((end,i)=>[anchors[i],end]);
 while(stack.length){const [start,end]=stack.pop(),a=points[start],b=points[end],dx=b.x-a.x,dy=b.y-a.y,squared=dx*dx+dy*dy;let farthest=-1,max=tolerance;
  for(let i=start+1;i<end;i++){const p=points[i],t=squared?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/squared)):0,d=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);if(d>max){max=d;farthest=i;}}
  if(farthest!==-1){keep.add(farthest);stack.push([start,farthest],[farthest,end]);}
 }
 return [...keep].sort((a,b)=>a-b).map(i=>({...points[i]}));
}
export class EditHistory{
 constructor(limit=30){this.limit=limit;this.past=[];this.future=[];}
 push(snapshot){this.past.push(structuredClone(snapshot));if(this.past.length>this.limit)this.past.shift();this.future=[];}
 undo(current){if(!this.past.length)return null;this.future.push(structuredClone(current));return this.past.pop();}
 redo(current){if(!this.future.length)return null;this.past.push(structuredClone(current));return this.future.pop();}
}
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
