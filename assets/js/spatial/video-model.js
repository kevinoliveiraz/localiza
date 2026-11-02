import {emptyPlan,addRectRoom,planBounds,clone,validatePlan} from './plan-model.js';
export const VIDEO_LIMITS={minDuration:4,maxDuration:180,maxBytes:400*1024*1024,minFrames:8,maxFrames:32};
export function frameTimes(duration){if(!Number.isFinite(duration)||duration<VIDEO_LIMITS.minDuration||duration>VIDEO_LIMITS.maxDuration)throw new Error('Use um vídeo de 4 segundos a 3 minutos.');const count=Math.min(VIDEO_LIMITS.maxFrames,Math.max(12,Math.ceil(duration*1.2)));return Array.from({length:count},(_,i)=>duration*(.025+.95*i/(count-1)));}
export function suggestedDepth(structure,width){if(!structure||structure.kind!=='rectangular-room'||structure.requiresReview!==true||!Number.isFinite(structure.width)||!Number.isFinite(structure.depth)||structure.width<=0||structure.depth<=0||structure.depth/structure.width<.1||structure.depth/structure.width>10)throw new Error('A sugestão de contorno não é válida. Informe as medidas manualmente.');return Math.round(width*structure.depth/structure.width*100)/100;}
export function roomFromVideo({building,floor,name,roomId,width,depth,height,metadata={}}){
 width=Number(width);depth=Number(depth);height=Number(height);
 if(!String(name).trim())throw new Error('Dê um nome ao ambiente.');
 if(![width,depth].every(n=>Number.isFinite(n)&&n>=1&&n<=50)||!Number.isFinite(height)||height<1||height>8)throw new Error('Use largura e comprimento entre 1 e 50 m e altura entre 1 e 8 m.');
 const plan=emptyPlan(building,floor);plan.height=height;plan.source='video';plan.example=false;
 const room=addRectRoom(plan,{x:0,y:0,width,depth,name:String(name).trim().slice(0,100),roomId,color:'#e6e0f6'});
 plan.videoSource={...metadata,type:'video',roomId:room.id,dimensionsReviewed:true,reviewedAt:new Date().toISOString()};return validatePlan(plan);
}
export function mergeVideoRoom(base,generated){
 const imported=clone(generated);if(base.example||!base.rooms.length&&!base.walls.length)return imported;
 const plan=clone(base),room=imported.rooms[0],existing=plan.rooms.find(item=>item.roomId&&item.roomId===room.roomId);
 if(existing){const others=new Set(plan.rooms.filter(item=>item.id!==existing.id).flatMap(item=>item.wallIds));plan.walls=plan.walls.filter(wall=>!existing.wallIds.includes(wall.id)||others.has(wall.id));plan.rooms=plan.rooms.filter(item=>item.id!==existing.id);}
 const bounds=planBounds(plan),offset=plan.rooms.length||plan.walls.length?bounds.maxX+1:0;
 for(const wall of imported.walls){wall.a.x+=offset;wall.b.x+=offset;}for(const point of room.points)point.x+=offset;
 plan.rooms.push(room);plan.walls.push(...imported.walls);plan.videoSource=imported.videoSource;plan.source='video';plan.example=false;plan.updatedAt=new Date().toISOString();return validatePlan(plan);
}
export const validReference=value=>typeof value==='string'&&value.length<180000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
