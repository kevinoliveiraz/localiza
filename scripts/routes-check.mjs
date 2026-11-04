import assert from 'node:assert/strict';
import {StepTracker,addPoint,length,fitPath,angleDelta,MAX_POINTS,projection,toCanvas,fromCanvas,nextSegment,movePoint,simplifyPoints,EditHistory} from '../assets/js/routes/model.js';
import {validateRoute,readRoutes,saveRoute,removeRoute,updateRoute} from '../assets/js/routes/store.js';
import {readDraft,writeDraft,clearDraft} from '../assets/js/routes/drafts.js';
import {startMotionCapture} from '../assets/js/routes/capture.js';
import {mountRecorder} from '../assets/js/routes/controller.js';
import * as views from '../assets/js/routes/views.js';
let checks=0;const equal=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=value=>{assert.ok(value);checks++;},throws=fn=>{assert.throws(fn);checks++;};
equal(length([{x:0,y:0},{x:0,y:-6},{x:8,y:-6},{x:8,y:-2}]),18);
equal(angleDelta(359,1),2);equal(angleDelta(1,359),-2);
const points=[];equal(addPoint(points,{x:0,y:0}),true);equal(addPoint(points,{x:.01,y:0}),false);throws(()=>addPoint(points,{x:Infinity,y:2}));
throws(()=>addPoint(Array.from({length:MAX_POINTS},()=>({x:0,y:0})),{x:1,y:1}));
const fitted=fitPath([{x:-100,y:-100},{x:200,y:-100},{x:200,y:300}]);ok(fitted.positions.every(p=>p.x>=70&&p.x<=730&&p.y>=70&&p.y<=410));equal(fitPath([]).path,'');
const tracker=new StepTracker(.7);let at=0;
function sample(magnitude,heading=0){at+=20;tracker.orient(heading,at);return tracker.sample({x:0,y:0,z:magnitude},at);}
for(let i=0;i<120;i++)equal(sample(9.81+Math.sin(i)*.1),null);
const step=sample(12);ok(step&&Math.abs(step.y+.7)<.001&&Math.abs(step.x)<.001);
equal(sample(12),null); // one sustained peak must never produce two steps
for(let i=0;i<25;i++)sample(9.81);
for(let i=0;i<20;i++)sample(9.81,90);
const turn=sample(12,90);ok(turn&&Math.abs(turn.x-.7)<.002&&Math.abs(turn.y)<.002);
tracker.resetMotion();for(let i=0;i<25;i++)tracker.sample({x:0,y:0,z:9.81},at+=100);
equal(tracker.sample({x:0,y:0,z:12},at+3000),null); // stale direction cannot invent a path
equal(tracker.sample({x:null,y:0,z:12},at+4000),null);
const noHeading=new StepTracker();for(let i=0;i<25;i++)noHeading.sample({x:0,y:0,z:9.81},i*20);equal(noHeading.sample({x:0,y:0,z:12},700),null);
throws(()=>new StepTracker(0));

let stored=null;globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
const input={start:'Entrada',end:'Destino',method:'manual',points:[{x:7,y:8,latitude:-20},{x:10,y:12,longitude:-40}]};
const saved=saveRoute(input);equal(saved.distance,5);equal(saved.points,[{x:0,y:0},{x:3,y:4}]);equal(readRoutes()[0].id,saved.id);ok(!stored.includes('latitude')&&!stored.includes('longitude'));
throws(()=>validateRoute({...input,points:[{x:0,y:0},{x:.01,y:0}]}));throws(()=>validateRoute({...input,method:'gps'}));throws(()=>validateRoute({...input,points:[null,{x:0,y:1}]}));throws(()=>validateRoute({...input,points:[{x:'0',y:0},{x:0,y:1}]}));
const routeHTML=views.detail({...saved,title:'<img src=x onerror=alert(1)>'},true);ok(routeHTML.includes('&lt;img'));ok(!routeHTML.includes('<img'));ok(!views.detail(saved,false).includes('data-route-delete'));
ok(views.list([],true).includes('#criar-mapa'));ok(!views.list([],false).includes('#criar-mapa'));
removeRoute(saved.id);equal(readRoutes(),[]);stored='broken';equal(readRoutes(),[]);stored=JSON.stringify([{points:[]},saved]);equal(readRoutes().length,1);
localStorage.setItem=()=>{throw new Error('quota');};throws(()=>saveRoute(input));

// Editing must preserve saved routes, marker associations and undo snapshots.
const editablePoints=[{x:0,y:0},{x:0,y:-3,cue:'right'},{x:4,y:-3,cue:'stairs-up'}];
const frame=projection(editablePoints),roundtrip=fromCanvas(toCanvas(editablePoints[1],frame),frame);
ok(Math.abs(roundtrip.x-editablePoints[1].x)<1e-9&&Math.abs(roundtrip.y-editablePoints[1].y)<1e-9);
const right=nextSegment(editablePoints.slice(0,2),'right',4);ok(Math.abs(right.x-4)<1e-9&&Math.abs(right.y+3)<1e-9);
const left=nextSegment(editablePoints.slice(0,2),'left',4);ok(Math.abs(left.x+4)<1e-9&&Math.abs(left.y+3)<1e-9);
throws(()=>nextSegment([]));throws(()=>nextSegment(editablePoints,'right',0));
equal(movePoint(editablePoints,0,{x:-1,y:1}),true);equal(editablePoints[1].cue,'right');equal(movePoint(editablePoints,1,{x:-1,y:1}),false);
const dense=[{x:0,y:0},{x:0,y:-1},{x:0,y:-2,cue:'stairs-up'},{x:0,y:-3},{x:1,y:-3},{x:2,y:-3}];
const simple=simplifyPoints(dense);equal(simple,[dense[0],dense[2],dense[3],dense[5]]);equal(simplifyPoints([{x:0,y:0},{x:1,y:1},{x:0,y:0}]).length,3);
const edits=new EditHistory(2);edits.push(editablePoints);const modified=structuredClone(editablePoints);modified[1].x=6;
equal(edits.undo(modified),editablePoints);equal(edits.redo(editablePoints),modified);edits.push(modified);equal(edits.future.length,0);
localStorage.setItem=(_,value)=>{stored=value;};stored=null;
const before=saveRoute({...input,points:editablePoints}),stamp=before.createdAt;
const updated=updateRoute(before.id,{...before,end:'Novo destino',title:'',points:editablePoints},stamp);
equal(updated.id,before.id);equal(updated.createdAt,before.createdAt);equal(readRoutes().length,1);equal(updated.points[2].cue,'stairs-up');ok(updated.updatedAt!==stamp);
throws(()=>updateRoute(before.id,{...updated,end:'Conflito'},stamp));equal(readRoutes()[0].end,'Novo destino');
const legacy=validateRoute(input);equal(legacy.points[0].cue,undefined);
const badCue=validateRoute({...input,points:[{x:0,y:0,cue:'<script>'},{x:2,y:0}]});equal(badCue.points[0].cue,undefined);
ok(views.detail(updated,true).includes('#editar-percurso/'));ok(views.detail(updated,true).includes('Suba a escada'));ok(!views.detail(updated,false).includes('#editar-percurso/'));
const session=new Map();globalThis.sessionStorage={getItem:key=>session.get(key)||null,setItem:(key,value)=>session.set(key,value)};
const draftInput={method:'manual',phase:'recording',start:'A',end:'B',points:editablePoints,baseStamp:''};
equal(writeDraft('new',draftInput),true);equal(readDraft().phase,'editing');equal(readDraft().points[2].cue,'stairs-up');equal(readDraft('new','changed'),null);
equal(writeDraft('invalid',{...draftInput,points:[{x:NaN,y:0}]}),false);
sessionStorage.setItem=()=>{throw new Error('quota');};equal(writeDraft('new',{...draftInput,end:'Mais recente'}),false);equal(readDraft().end,'Mais recente');clearDraft();equal(readDraft(),null);

// Browser API adapter tests use an explicitly fake event target, never real device permissions.
const listeners=new Map();let permissionCalls=0,failed='',steps=0;
const device={isSecureContext:true,DeviceMotionEvent:{requestPermission:async()=>{permissionCalls++;return 'granted';}},DeviceOrientationEvent:{requestPermission:async()=>{permissionCalls++;return 'granted';}},addEventListener:(type,listener)=>listeners.set(type,listener),removeEventListener:(type,listener)=>{if(listeners.get(type)===listener)listeners.delete(type);}};
const reject=async(fn,pattern)=>{await assert.rejects(fn,pattern);checks++;};
await reject(()=>startMotionCapture({target:{...device,isSecureContext:false}}),/HTTPS/);equal(permissionCalls,0);
await reject(()=>startMotionCapture({target:{...device,DeviceMotionEvent:null}}),/sensores/);
await reject(()=>startMotionCapture({target:{...device,DeviceMotionEvent:{requestPermission:async()=>'denied'}}}),/não autorizado/);equal(listeners.size,0);
const originalNow=Date.now;let now=1000;Date.now=()=>now;
try{
 const stop=await startMotionCapture({target:device,onStep:()=>steps++,onStatus:()=>{},onFailure:message=>{failed=message;}});
 equal(listeners.size,3);
 const orient=listeners.get('deviceorientation'),motion=listeners.get('devicemotion');
 orient({type:'deviceorientation',alpha:0,beta:0,gamma:0});
 for(let i=0;i<25;i++){now+=20;motion({accelerationIncludingGravity:{x:0,y:0,z:9.81}});}
 now+=20;motion({accelerationIncludingGravity:{x:0,y:0,z:12}});equal(steps,1);
 // A different orientation coordinate frame is ignored.
 listeners.get('deviceorientationabsolute')({type:'deviceorientationabsolute',alpha:180,beta:0,gamma:0});
 stop();stop();equal(listeners.size,0);motion({accelerationIncludingGravity:{x:0,y:0,z:12}});equal(steps,1);equal(failed,'');
}finally{Date.now=originalNow;}
// Deterministic health timeout: no browser sensors and no wall-clock wait.
const originalInterval=globalThis.setInterval,originalClear=globalThis.clearInterval;let healthCallback,cleared=false;
now=0;Date.now=()=>now;globalThis.setInterval=callback=>{healthCallback=callback;return 1;};globalThis.clearInterval=()=>{cleared=true;};
try{
 await startMotionCapture({target:device,onStep:()=>steps++,onStatus:()=>{},onFailure:message=>{failed=message;}});
 now=6000;healthCallback();equal(failed,''); // allow startup before declaring missing hardware
 now=10000;healthCallback();ok(failed.includes('Não chegaram dados'));equal(listeners.size,0);equal(cleared,true);
}finally{Date.now=originalNow;globalThis.setInterval=originalInterval;globalThis.clearInterval=originalClear;}
ok(typeof mountRecorder==='function');
console.log(`OK — ${checks} verificações de geometria, passos/direção, rejeição de ruído, armazenamento, escape, permissões e liberação de sensores. Caminhada física ainda requer validação no celular.`);
