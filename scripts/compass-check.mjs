import assert from 'node:assert/strict';
import {AutoJourney} from '../assets/js/routes/auto-guidance.js?v=20261106-route3d';
import {buildGuide} from '../assets/js/routes/guidance.js?v=20261106-route3d';
import {compassReading,startMotionCapture} from '../assets/js/routes/capture.js?v=20261106-route3d';
import {actionsMarkup,instructionMarkup,navigationMap} from '../assets/js/routes/navigation-views.js?v=20261106-route3d';
let checks=0;const equal=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=value=>{assert.ok(value);checks++;};
const route={start:'A',end:'B',points:[{x:0,y:0},{x:0,y:-4,cue:'right'},{x:4,y:-4,cue:'stairs-up'},{x:4,y:0}]},original=JSON.stringify(route),plan=buildGuide(route);
let at=1000;const reading=(heading,extra={})=>({heading,at:at+=500,source:'relative',level:true,reliable:true,...extra});
const trip=new AutoJourney(plan);equal(trip.advance(.7,at),false);trip.start();equal(trip.advance(.7,at),false);equal(trip.travelled,0);
trip.updateHeading(reading(359));const stationary=trip.position;trip.updateHeading(reading(89));equal(trip.heading,90);equal(trip.position,stationary);equal(trip.travelled,0);equal(trip.phase,'active');
trip.updateHeading(reading(359));
for(let i=0;i<6;i++){trip.updateHeading(reading(359));trip.advance(.7,at);ok(trip.phase==='active');}
equal(trip.index,1);equal(trip.travelled,4);ok(Math.abs(trip.position.x)<.001);
for(let i=0;i<6;i++){trip.updateHeading(reading(89));trip.advance(.7,at);ok(trip.phase==='active');}
equal(trip.index,2);equal(trip.travelled,8);ok(trip.position.x>3.9);equal(trip.heading,90);
for(let i=0;i<6;i++){trip.updateHeading(reading(179));trip.advance(.7,at);ok(!['checkpoint','departure'].includes(trip.phase));}
equal(trip.phase,'arrived');equal(trip.remaining,0);equal(trip.advance(.7,at+500),false);equal(JSON.stringify(route),original);
ok(instructionMarkup(trip).includes('Chegada estimada'));ok(!actionsMarkup(new AutoJourney(plan),{method:'motion'}).includes('data-nav-action="confirm"'));
const rotated=navigationMap(trip,{scale:40,offsetX:0,offsetY:0},2,{follow:true});ok(rotated.includes('rotate(-180)'));ok(rotated.includes('translate(400,350) rotate(0)'));

const wrong=new AutoJourney(plan);wrong.start();wrong.updateHeading(reading(0));for(let i=0;i<5;i++){wrong.updateHeading(reading(90));wrong.advance(.7,at);}equal(wrong.travelled,0);ok(wrong.position.x>3);equal(wrong.quality,'off-route');equal(wrong.phase,'active');
const loop=new AutoJourney(buildGuide({...route,points:[{x:0,y:0},{x:0,y:-3},{x:3,y:-3},{x:3,y:0},{x:0,y:0},{x:0,y:3}]}));loop.start();loop.updateHeading(reading(0));loop.updateHeading(reading(180));loop.advance(.7,at);equal(loop.travelled,0);equal(loop.index,0); // cannot jump to the nearby return segment
const stale=new AutoJourney(plan);stale.start();stale.updateHeading(reading(40));const before=stale.position;equal(stale.advance(.7,at+2000),false);equal(stale.position,before);
stale.updateHeading(reading(40,{level:false}));equal(stale.advance(.7,at),false);equal(stale.quality,'tilted');
stale.updateHeading(reading(40,{reliable:false}));equal(stale.advance(.7,at),false);equal(stale.quality,'weak-compass');
stale.updateHeading(reading(40));equal(stale.advance(.7,at),true);const distance=stale.travelled;equal(stale.advance(.7,at),false);equal(stale.travelled,distance);equal(stale.advance(NaN,at+500),false);
stale.updateHeading(reading(null));equal(stale.quality,'waiting-heading');equal(stale.advance(.7,at),false);stale.updateHeading(reading(40));
stale.updateHeading(reading(40,{source:'absolute'}));equal(stale.phase,'paused');equal(stale.quality,'source-changed');equal(stale.advance(.7,at),false);stale.recalibrate();stale.resume();stale.updateHeading(reading(40,{source:'absolute'}));equal(stale.quality,'tracking');equal(stale.advance(.7,at),true);
const departure=new AutoJourney(buildGuide({...route,points:[{x:0,y:0,cue:'stairs-up'},{x:0,y:-3}]}));departure.start();equal(departure.phase,'active');
const reverse=new AutoJourney(buildGuide(route,true));reverse.start();for(let i=0;i<6;i++){reverse.updateHeading(reading(120));reverse.advance(.7,at);}equal(reverse.index,1);equal(reverse.phase,'active');

// Alignment corrects the reference frame, never the pedestrian position/progress.
const snapshot=j=>({position:j.position,progress:j.travelled,index:j.index,along:j.along,steps:j.steps});
const align=new AutoJourney(plan);equal(align.alignHeading(at),false);align.start();align.updateHeading(reading(350));align.advance(.7,at);align.updateHeading(reading(80));const beforeAlign=snapshot(align);
equal(align.alignHeading(at),true);equal(align.heading,0);equal(snapshot(align),beforeAlign);align.updateHeading(reading(170));equal(align.heading,90);equal(snapshot(align),beforeAlign);
equal(align.alignHeading(at+1801),false);align.updateHeading(reading(170,{level:false}));equal(align.alignHeading(at),false);
const requestAt=at+2000;equal(align.requestAlignment(requestAt),true);equal(align.advance(.7,requestAt),false);equal(align.updateHeading({heading:240,at:requestAt-1,source:'relative'}),false);equal(align.alignmentPending,true);
equal(align.updateHeading({heading:240,at:requestAt,source:'absolute',reliable:false}),false);equal(align.alignmentPending,true);
equal(align.updateHeading({heading:240,at:requestAt+1,source:'absolute',level:true,reliable:true}),true);equal(align.alignmentPending,false);equal(align.sensorSource,'absolute');equal(align.heading,0);equal(snapshot(align),beforeAlign);at=requestAt+1;
align.pause();equal(align.alignHeading(at),false);equal(align.requestAlignment(at),true);align.resume();equal(align.updateHeading(reading(20,{source:'relative'})),true);equal(align.heading,0);equal(snapshot(align),beforeAlign);
wrong.updateHeading(reading(90));const offRoute=snapshot(wrong);equal(wrong.alignHeading(at),true);equal(snapshot(wrong),offRoute);equal(wrong.quality,'off-route');

// Small stable straight-line drift is corrected gradually from real steps only.
const straight=buildGuide({...route,points:[{x:0,y:0},{x:0,y:-100}]});
function drift(mode,angle=10){const j=new AutoJourney(straight,{alignment:mode});j.start();j.updateHeading(reading(0));j.updateHeading(reading(angle));return j;}
const automatic=drift('auto'),manual=drift('manual');
for(let i=0;i<20;i++){automatic.updateHeading(reading(10));manual.updateHeading({heading:10,at,source:'relative'});equal(automatic.heading,10);equal(automatic.autoCorrectionUsed,0);} // standing cannot change the alignment
let previous=automatic.heading;
for(let i=0;i<16;i++){automatic.updateHeading(reading(10));manual.updateHeading({heading:10,at,source:'relative'});automatic.advance(.7,at);manual.advance(.7,at);ok(Math.abs(automatic.heading-previous)<=1.500001);previous=automatic.heading;}
ok(automatic.heading<3);equal(manual.heading,10);ok(automatic.autoCorrectionUsed<=12);ok(automatic.travelled>10);equal(automatic.steps,16);equal(manual.steps,16);
const turning=drift('auto',90);for(let i=0;i<6;i++){turning.updateHeading(reading(90));turning.advance(.7,at);}equal(turning.heading,90);equal(turning.autoCorrectionUsed,0);equal(turning.travelled,0);
const backwards=drift('auto',180);for(let i=0;i<6;i++){backwards.updateHeading(reading(180));backwards.advance(.7,at);}equal(backwards.heading,180);equal(backwards.autoCorrectionUsed,0);equal(backwards.travelled,0);
const modeBefore=snapshot(automatic);equal(automatic.setAlignmentMode('manual'),true);equal(snapshot(automatic),modeBefore);equal(automatic.alignmentMode,'manual');equal(automatic.setAlignmentMode('invalid'),false);equal(automatic.alignmentMode,'manual');

for(const [alpha,heading] of [[0,0],[90,270],[180,180],[270,90]])equal(compassReading({alpha,beta:0,gamma:0}).heading,heading);
equal(compassReading({alpha:270,beta:0,gamma:0,screenAngle:90}).heading,90); // physical +Y top, independent of screen rotation
equal(compassReading({alpha:0,beta:90,gamma:0}).level,false);equal(compassReading({alpha:null,beta:0,gamma:0}).heading,null);
equal(compassReading({webkitCompassHeading:25,webkitCompassAccuracy:10,alpha:180,beta:0,gamma:0}).heading,25);
equal(compassReading({webkitCompassHeading:25,webkitCompassAccuracy:-1,beta:0,gamma:0}).reliable,false);

// Explicitly fake sensor target: heading while stationary, low quality, and cleanup.
const listeners=new Map(),target={isSecureContext:true,DeviceMotionEvent:{},DeviceOrientationEvent:{},addEventListener:(name,handler)=>listeners.set(name,handler),removeEventListener:(name,handler)=>{if(listeners.get(name)===handler)listeners.delete(name);}};
const originalNow=Date.now;let now=1000,steps=0,headings=[];Date.now=()=>now;
try{
 const stop=await startMotionCapture({target,onStep:()=>steps++,onHeading:value=>headings.push(value),onStatus:()=>{},onFailure:()=>{}});
 const orient=listeners.get('deviceorientation'),motion=listeners.get('devicemotion');
 const pulse=magnitude=>{now+=20;motion({accelerationIncludingGravity:{x:0,y:0,z:magnitude}});};
 orient({type:'deviceorientation',alpha:0,beta:0,gamma:0});for(let i=0;i<12;i++){now+=20;orient({type:'deviceorientation',alpha:270,beta:0,gamma:0});}equal(steps,0);ok(headings.at(-1).heading>89&&headings.at(-1).heading<=90);
 for(let i=0;i<25;i++)pulse(9.81);pulse(12);equal(steps,1);
 now+=400;orient({type:'deviceorientation',webkitCompassHeading:90,webkitCompassAccuracy:-1,beta:0,gamma:0});for(let i=0;i<25;i++)pulse(9.81);pulse(12);equal(steps,1);equal(headings.at(-1).reliable,false);
 now+=400;orient({type:'deviceorientation',webkitCompassHeading:90,webkitCompassAccuracy:10,beta:0,gamma:0});for(let i=0;i<25;i++)pulse(9.81);pulse(12);equal(steps,2);
 stop();equal(listeners.size,0);const previous=headings.length;orient({type:'deviceorientation',alpha:0,beta:0,gamma:0});equal(headings.length,previous);
}finally{Date.now=originalNow;}
console.log(`OK — ${checks} verificações de bússola/avanço automático: direção do topo, giro parado, curvas e escadas sem botões, chegada estimada, desvios, qualidade, sinais antigos e liberação de sensores. Não valida precisão física.`);
