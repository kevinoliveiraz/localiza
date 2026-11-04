import {distance,simplifyPoints,CUES} from './model.js?v=20261104-mobile';
const inverse={left:'right',right:'left','stairs-up':'stairs-down','stairs-down':'stairs-up'};
export function inferredCue(points,index){
 const explicit=points[index]?.cue;if(Object.hasOwn(CUES,explicit))return explicit;
 if(index<=0||index>=points.length-1)return 'arrival';
 const a=points[index-1],b=points[index],c=points[index+1],incoming={x:b.x-a.x,y:b.y-a.y},outgoing={x:c.x-b.x,y:c.y-b.y};
 const angle=Math.atan2(incoming.x*outgoing.y-incoming.y*outgoing.x,incoming.x*outgoing.x+incoming.y*outgoing.y)*180/Math.PI;
 return Math.abs(angle)>150?'back':Math.abs(angle)>=30?(angle>0?'right':'left'):'straight';
}
export function buildGuide(route,reverse=false){
 if(!route||!Array.isArray(route.points)||route.points.length<2||route.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Este percurso precisa de pelo menos dois pontos válidos.');
 let points=simplifyPoints(route.points.map(p=>({x:p.x,y:p.y,...(Object.hasOwn(CUES,p.cue)?{cue:p.cue}:{})})),.3);
 if(reverse)points=points.reverse().map(p=>({...p,...(p.cue?{cue:inverse[p.cue]||p.cue}:{})}));
 // Consecutive overlapping points cannot define a walkable segment. Keep any explicit sign.
 const distinct=[];for(const point of points){if(distinct.length&&distance(distinct.at(-1),point)<.08){if(point.cue)distinct.at(-1).cue=point.cue;continue;}distinct.push({...point});}points=distinct;
 if(points.length<2)throw new Error('Os pontos do percurso estão sobrepostos. Ajuste o mapa antes de iniciar.');
 const legs=points.slice(1).map((end,index)=>({start:points[index],end,distance:distance(points[index],end),cue:inferredCue(points,index+1),index}));
 return {points,legs,total:legs.reduce((sum,leg)=>sum+leg.distance,0),start:reverse?route.end:route.start,end:reverse?route.start:route.end,reverse};
}
export class Journey{
 constructor(plan){this.plan=plan;this.phase='ready';this.index=0;this.along=0;}
 get leg(){return this.plan.legs[this.index];}
 get cue(){return this.phase==='departure'?this.plan.points[0].cue:this.leg.cue;}
 get travelled(){return this.plan.legs.slice(0,this.index).reduce((sum,leg)=>sum+leg.distance,0)+this.along;}
 get remaining(){return Math.max(0,this.plan.total-this.travelled);}
 get position(){const leg=this.leg,t=Math.min(1,this.along/leg.distance);return {x:leg.start.x+(leg.end.x-leg.start.x)*t,y:leg.start.y+(leg.end.y-leg.start.y)*t};}
 get heading(){return Math.atan2(this.leg.end.x-this.leg.start.x,-(this.leg.end.y-this.leg.start.y))*180/Math.PI;}
 get trace(){return [...this.plan.points.slice(0,this.index+1),this.position];}
 start(){if(this.phase!=='ready')return false;this.phase=this.plan.points[0].cue?'departure':'active';return true;}
 advance(metres){
  if(this.phase!=='active'||!Number.isFinite(metres)||metres<=0||metres>2)return false;
  this.along=Math.min(this.leg.distance,this.along+metres);if(this.leg.distance-this.along<.03){this.along=this.leg.distance;this.phase='checkpoint';}return true;
 }
 reach(){if(this.phase!=='active')return false;this.along=this.leg.distance;this.phase='checkpoint';return true;}
 confirm(){
  if(this.phase==='departure'){this.phase='active';return true;}
  if(this.phase!=='checkpoint')return false;
  if(this.index===this.plan.legs.length-1){this.phase='arrived';return true;}
  this.index++;this.along=0;this.phase='active';return true;
 }
 pause(){if(this.phase!=='active')return false;this.phase='paused';return true;}
 resume(){if(this.phase!=='paused')return false;this.phase='active';return true;}
 resetEstimate(){this.along=0;if(this.phase==='paused')this.phase='active';}
}
export const instruction=cue=>CUES[cue]||({straight:'Continue em frente',back:'Retorne pelo caminho',arrival:'Você está no destino'}[cue]||'Siga o percurso');
