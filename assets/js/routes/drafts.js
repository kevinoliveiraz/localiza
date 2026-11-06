import {MAX_POINTS,CUES} from './model.js?v=20261106-route3d';
const KEY='localiza_route_drafts_v1',memory=new Map();
function clean(input){
 if(!input||!Array.isArray(input.points)||input.points.length>MAX_POINTS||!['motion','manual'].includes(input.method))return null;
 if(input.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000))return null;
 return {method:input.method,phase:['idle','review'].includes(input.phase)?input.phase:'editing',title:String(input.title||'').slice(0,90),start:String(input.start||'').slice(0,90),end:String(input.end||'').slice(0,90),points:input.points.map(p=>({x:p.x,y:p.y,...(Object.hasOwn(CUES,p.cue)?{cue:p.cue}:{})})),stepLength:Number(input.stepLength)||.7,adjusted:Boolean(input.adjusted),baseStamp:String(input.baseStamp||'')};
}
function collection(){try{const data=JSON.parse(sessionStorage.getItem(KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}}
export function readDraft(id='new',baseStamp=''){
 const draft=clean(memory.has(id)?memory.get(id):collection()[id]);return draft&&draft.baseStamp===baseStamp?draft:null;
}
export function writeDraft(id,input){
 const draft=clean(input);if(!draft)return false;memory.set(id,draft);
 try{const data=collection();data[id]=draft;sessionStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}
}
export function clearDraft(id='new'){memory.set(id,null);try{const data=collection();delete data[id];sessionStorage.setItem(KEY,JSON.stringify(data));}catch{}}
