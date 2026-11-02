import {length,MAX_POINTS} from './model.js';
const KEY='localiza_route_maps_v1';
const label=(value,fallback)=>String(value||'').trim().slice(0,90)||fallback;
export function validateRoute(input){
 if(!input||!Array.isArray(input.points)||input.points.length<2||input.points.length>MAX_POINTS)throw new Error('Registre um percurso antes de salvar.');
 if(!['motion','manual'].includes(input.method))throw new Error('Método de captura inválido.');
 if(input.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Pontos inválidos.');
 const first=input.points[0],points=input.points.map(p=>({x:Number(p.x)-Number(first.x),y:Number(p.y)-Number(first.y)}));
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000)||length(points)<.5)throw new Error('O percurso precisa ter pelo menos 0,5 m e pontos válidos.');
 return {id:label(input.id,''),title:label(input.title,`${label(input.start,'Ponto A')} → ${label(input.end,'Ponto B')}`),start:label(input.start,'Ponto A'),end:label(input.end,'Ponto B'),method:input.method,points,distance:length(points),createdAt:input.createdAt||new Date().toISOString()};
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
