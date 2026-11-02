/** Modelo geométrico em metros, independente do DOM e do renderizador. */
export const PLAN_VERSION=1;
export const EPSILON=.002;
export const uid=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}`;
export const clone=value=>JSON.parse(JSON.stringify(value));
export const clamp=(number,min,max)=>Math.min(max,Math.max(min,number));
export const snap=(value,grid=.25)=>Math.round(value/grid)*grid;
export const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export const samePoint=(a,b)=>distance(a,b)<EPSILON;
export const polygonArea=points=>Math.abs(points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+point.x*next.y-next.x*point.y;},0))/2;
export const polygonCenter=points=>({x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length});
export function emptyPlan(building='central',floor='Térreo'){
 return {version:PLAN_VERSION,id:uid('plan'),building,floor,name:`${floor}`,units:'m',height:2.8,thickness:.16,rooms:[],walls:[],objects:[],source:'manual',example:false,updatedAt:new Date().toISOString()};
}
export function addWall(plan,a,b,options={}){
 if(distance(a,b)<.2)throw new Error('A parede precisa ter pelo menos 20 cm.');
 const existing=plan.walls.find(wall=>(samePoint(wall.a,a)&&samePoint(wall.b,b))||(samePoint(wall.a,b)&&samePoint(wall.b,a)));
 if(existing)return existing;
 const wall={id:uid('wall'),a:{...a},b:{...b},height:plan.height,thickness:plan.thickness,color:'#e3e5ee',openings:[],...options};
 plan.walls.push(wall);return wall;
}
export function addRectRoom(plan,{x,y,width,depth,name='Novo ambiente',roomId=null,color='#e6e0f6'}){
 if(width<1||depth<1||width>50||depth>50)throw new Error('Use largura e comprimento entre 1 e 50 metros.');
 const points=[{x,y},{x:x+width,y},{x:x+width,y:y+depth},{x,y:y+depth}];
 const walls=points.map((point,index)=>addWall(plan,point,points[(index+1)%points.length]));
 const room={id:uid('room'),roomId,name:name.trim()||'Novo ambiente',points,wallIds:walls.map(wall=>wall.id),color};
 plan.rooms.push(room);return room;
}
export function planBounds(plan){
 const points=[...plan.walls.flatMap(wall=>[wall.a,wall.b]),...plan.rooms.flatMap(room=>room.points),...plan.objects.map(object=>({x:object.x,y:object.y}))];
 if(!points.length)return {minX:-1,minY:-1,maxX:11,maxY:9,width:12,depth:10};
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 return {minX,minY,maxX,maxY,width:Math.max(1,maxX-minX),depth:Math.max(1,maxY-minY)};
}
export function closestPoint(wall,point){
 const dx=wall.b.x-wall.a.x,dy=wall.b.y-wall.a.y,len=dx*dx+dy*dy;
 const t=clamp(((point.x-wall.a.x)*dx+(point.y-wall.a.y)*dy)/len,0,1);
 const projected={x:wall.a.x+dx*t,y:wall.a.y+dy*t};
 return {point:projected,t,offset:Math.sqrt(len)*t,distance:distance(point,projected)};
}
export function addOpening(plan,wallId,kind,offset){
 const wall=plan.walls.find(item=>item.id===wallId);if(!wall)throw new Error('Selecione uma parede.');
 const length=distance(wall.a,wall.b),width=kind==='door'?.9:1.2;
 if(length<width+.2)throw new Error('A parede é curta para esta abertura.');
 const opening={id:uid(kind),kind,offset:clamp(offset,width/2+.05,length-width/2-.05),width,height:kind==='door'?2.1:1.1,sill:kind==='door'?0:.95};
 if(wall.openings.some(other=>Math.abs(other.offset-opening.offset)<(other.width+opening.width)/2+.05))throw new Error('Já existe uma abertura neste trecho.');
 wall.openings.push(opening);return opening;
}
export function wallSegments(wall){
 const length=distance(wall.a,wall.b),height=wall.height,segments=[];
 const openings=[...wall.openings].map(o=>({...o,start:clamp(o.offset-o.width/2,0,length),end:clamp(o.offset+o.width/2,0,length)})).sort((a,b)=>a.start-b.start);
 let cursor=0;
 for(const opening of openings){
  if(opening.start>cursor+EPSILON)segments.push({start:cursor,end:opening.start,bottom:0,top:height});
  if(opening.sill>EPSILON)segments.push({start:opening.start,end:opening.end,bottom:0,top:Math.min(opening.sill,height)});
  if(opening.sill+opening.height<height-EPSILON)segments.push({start:opening.start,end:opening.end,bottom:opening.sill+opening.height,top:height});
  cursor=Math.max(cursor,opening.end);
 }
 if(cursor<length-EPSILON)segments.push({start:cursor,end:length,bottom:0,top:height});
 return segments.filter(segment=>segment.end-segment.start>EPSILON&&segment.top-segment.bottom>EPSILON);
}
export function moveVertex(plan,from,to){
 for(const wall of plan.walls){if(samePoint(wall.a,from))wall.a={...to};if(samePoint(wall.b,from))wall.b={...to};}
 for(const room of plan.rooms)room.points=room.points.map(point=>samePoint(point,from)?{...to}:point);
}
export function resizeWall(plan,wallId,length){
 const wall=plan.walls.find(item=>item.id===wallId);if(!wall||length<.3||length>100)throw new Error('Use um comprimento de 0,3 a 100 metros.');
 const old={...wall.b},angle=Math.atan2(wall.b.y-wall.a.y,wall.b.x-wall.a.x);
 moveVertex(plan,old,{x:wall.a.x+Math.cos(angle)*length,y:wall.a.y+Math.sin(angle)*length});
 wall.openings=wall.openings.filter(opening=>opening.offset+opening.width/2<length);
}
export function createExamplePlan(building,floor,roomList=[]){
 const plan=emptyPlan(building,floor);plan.example=true;plan.source='example';let cursor=0;
 for(const [index,item] of roomList.slice(0,6).entries()){
  const width=clamp(Math.round(Math.sqrt(item.size||25)*2)/2,4,9),depth=clamp(Math.round(((item.size||25)/width)*2)/2,3,10);
  const room=addRectRoom(plan,{x:cursor,y:0,width,depth,name:item.name,roomId:item.id,color:['#e6e0f6','#dceaf4','#deeee6'][index%3]});
  const front=plan.walls.find(wall=>room.wallIds.includes(wall.id)&&samePoint(wall.a,{x:cursor,y:0})&&samePoint(wall.b,{x:cursor+width,y:0}));
  if(front)addOpening(plan,front.id,'door',width/2);
  const back=plan.walls.find(wall=>room.wallIds.includes(wall.id)&&wall.a.y===depth&&wall.b.y===depth);
  if(back)addOpening(plan,back.id,'window',width/2);
  plan.objects.push({id:uid('object'),type:index%2?'sofa':'desk',x:cursor+width*.5,y:depth*.62,rotation:0,width:1.6,depth:.8,height:.75});
  plan.objects.push({id:uid('object'),type:'plant',x:cursor+.65,y:depth-.65,rotation:0,width:.5,depth:.5,height:1});
  cursor+=width;
 }
 return plan;
}
export function validatePlan(value){
 if(!value||value.version!==PLAN_VERSION||value.units!=='m')throw new Error('Arquivo de planta incompatível. Use um JSON exportado pelo Localiza.');
 if(!Array.isArray(value.rooms)||!Array.isArray(value.walls)||!Array.isArray(value.objects)||value.walls.length>1000||value.rooms.length>200||value.objects.length>500)throw new Error('A planta excede os limites do editor ou está incompleta.');
 const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 const point=p=>p&&number(p.x,-200,200)&&number(p.y,-200,200);
 const ids=new Set();
 const id=entry=>{if(typeof entry.id!=='string'||!entry.id||entry.id.length>120||ids.has(entry.id))throw new Error('A planta contém identificadores inválidos ou repetidos.');ids.add(entry.id);};
 if(!number(value.height,1,8)||!number(value.thickness,.05,1))throw new Error('As medidas padrão das paredes são inválidas.');
 for(const wall of value.walls){
  if(typeof wall.id!=='string'||ids.has(wall.id)||!point(wall.a)||!point(wall.b)||distance(wall.a,wall.b)<.1||!number(wall.height,.3,15)||!number(wall.thickness,.05,1)||!Array.isArray(wall.openings))throw new Error('A planta contém uma parede inválida.');ids.add(wall.id);
  if(wall.openings.length>100)throw new Error('Há aberturas demais nesta parede.');
  for(const opening of wall.openings){id(opening);if(!['door','window'].includes(opening.kind)||!number(opening.offset,0,distance(wall.a,wall.b))||!number(opening.width,.2,10)||!number(opening.height,.2,12)||!number(opening.sill,0,12)||opening.sill+opening.height>wall.height+.01||opening.offset-opening.width/2<-.01||opening.offset+opening.width/2>distance(wall.a,wall.b)+.01)throw new Error('A abertura precisa caber inteiramente na parede.');}
  const sorted=[...wall.openings].sort((a,b)=>a.offset-b.offset);for(let n=1;n<sorted.length;n++)if(sorted[n].offset-sorted[n-1].offset<(sorted[n].width+sorted[n-1].width)/2-.001)throw new Error('As aberturas não podem ocupar o mesmo trecho da parede.');
 }
 for(const room of value.rooms){id(room);if(typeof room.name!=='string'||!room.name.trim()||room.name.length>100||!Array.isArray(room.wallIds)||!room.wallIds.every(wallId=>value.walls.some(wall=>wall.id===wallId))||!Array.isArray(room.points)||room.points.length<3||room.points.length>100||!room.points.every(point)||polygonArea(room.points)<.01)throw new Error('A planta contém um ambiente inválido.');
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),p=room.points;
  for(let a=0;a<p.length;a++){if(distance(p[a],p[(a+1)%p.length])<.05)throw new Error('O ambiente contém pontos sobrepostos.');for(let b=a+2;b<p.length;b++){if(a===0&&b===p.length-1)continue;const A=p[a],B=p[(a+1)%p.length],C=p[b],D=p[(b+1)%p.length];if(cross(A,B,C)*cross(A,B,D)<0&&cross(C,D,A)*cross(C,D,B)<0)throw new Error('As bordas do ambiente não podem se cruzar.');}}
 }
 for(const object of value.objects){id(object);if(!['desk','chair','sofa','plant','cabinet'].includes(object.type)||!number(object.x,-200,200)||!number(object.y,-200,200)||!number(object.rotation,-3600,3600)||!number(object.width,.1,20)||!number(object.depth,.1,20)||!number(object.height,.1,10))throw new Error('A planta contém um objeto inválido.');}
 return clone(value);
}
