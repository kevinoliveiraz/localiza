import {length,MAX_POINTS,CUES} from './model.js?v=20261106-polish3d';
const KEY='localiza_route_maps_v1';
const label=(value,fallback)=>String(value||'').trim().slice(0,90)||fallback;
const searchable=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
export function searchRoutes(routes,query=''){
 const term=searchable(query);if(!term||term==='todos')return routes;
 const words=term.split(/\s+/);
 return routes.filter(route=>{const text=searchable([route.title,route.start,route.end].join(' '));return words.every(word=>text.includes(word));});
}
export function validateRoute(input){
 if(!input||!Array.isArray(input.points)||input.points.length<2||input.points.length>MAX_POINTS)throw new Error('Registre um percurso antes de salvar.');
 if(!['motion','manual'].includes(input.method))throw new Error('Método de captura inválido.');
 if(input.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Pontos inválidos.');
 const first=input.points[0],points=input.points.map(p=>({x:p.x-first.x,y:p.y-first.y,...(Object.hasOwn(CUES,p.cue)?{cue:p.cue}:{})}));
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000)||length(points)<.5)throw new Error('O percurso precisa ter pelo menos 0,5 m e pontos válidos.');
 return {id:label(input.id,''),title:label(input.title,`${label(input.start,'Ponto A')} → ${label(input.end,'Ponto B')}`),start:label(input.start,'Ponto A'),end:label(input.end,'Ponto B'),method:input.method,points,distance:length(points),createdAt:input.createdAt||new Date().toISOString(),...(input.updatedAt?{updatedAt:input.updatedAt}:{}),...(input.adjusted?{adjusted:true}:{})};
}
export function readRoutes(){
 try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(data))return [];return data.slice(0,40).flatMap(item=>{try{return [validateRoute(item)];}catch{return [];}});}catch{return [];}
}
export function saveRoute(input){
 const route=validateRoute({...input,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
 const routes=readRoutes();if(routes.length>=40)throw new Error('Há 40 percursos neste navegador. Exclua um para salvar outro.');
 try{localStorage.setItem(KEY,JSON.stringify([route,...routes]));}catch{throw new Error('Não foi possível salvar neste navegador. Libere espaço ou habilite o armazenamento local.');}return route;
}
export function removeRoute(id){try{localStorage.setItem(KEY,JSON.stringify(readRoutes().filter(route=>route.id!==id)));}catch{throw new Error('Não foi possível excluir o percurso neste navegador.');}}
export function updateRoute(id,input,expectedStamp){
 const routes=readRoutes(),index=routes.findIndex(route=>route.id===id);if(index<0)throw new Error('O percurso não foi encontrado. Volte à lista de mapas.');
 const previous=routes[index];if(expectedStamp&&(previous.updatedAt||previous.createdAt)!==expectedStamp)throw new Error('Este percurso mudou em outra aba. Reabra o mapa antes de salvar.');
 const updatedAt=new Date(Math.max(Date.now(),Date.parse(previous.updatedAt||previous.createdAt)+1||0)).toISOString();
 const route=validateRoute({...input,id,createdAt:previous.createdAt,updatedAt});routes[index]=route;
 try{localStorage.setItem(KEY,JSON.stringify(routes));}catch{throw new Error('Não foi possível salvar as alterações neste navegador.');}return route;
}
