import {angleDelta} from './model.js?v=20261106-polish3d';
const normal=angle=>(angle%360+360)%360;

// Visual camera easing only. This never updates heading, distance or position in a journey.
export class CameraHeading{
 constructor(){this.value=null;this.target=0;this.from=0;this.at=0;this.active=false;}
 sample(at){if(!this.active)return this.value??0;const t=Math.max(0,Math.min(1,(at-this.at)/180));this.value=normal(this.from+(this.target-this.from)*(1-Math.pow(1-t,3)));if(t===1)this.active=false;return this.value;}
 set(value,at,snap=false){if(!Number.isFinite(value)||!Number.isFinite(at))return;if(this.value===null||snap){this.value=normal(value);this.target=this.value;this.active=false;return;}const current=this.sample(at),delta=angleDelta(current,value);this.from=current;this.target=current+delta;this.at=at;this.active=Math.abs(delta)>.05;if(!this.active)this.value=normal(value);}
 finish(){this.value=normal(this.target);this.active=false;}
}

// Keep very close endpoints readable without moving the actual 3D pins.
export function labelLayout(pins,width){
 const compact=pins.every(p=>p.visible)&&Math.abs(pins[0].x-pins[1].x)<110&&Math.abs(pins[0].y-pins[1].y)<45,result=pins.map(p=>({...p,compact}));
 if(compact&&Math.abs(pins[0].x-pins[1].x)<38&&Math.abs(pins[0].y-pins[1].y)<34){const center=Math.max(40,Math.min(width-40,(pins[0].x+pins[1].x)/2)),left=pins[0].x<=pins[1].x?0:1;result[left].x=center-19;result[1-left].x=center+19;}
 for(const p of result){const edge=compact?20:52;p.x=Math.max(edge,Math.min(width-edge,p.x));p.y=Math.max(38,p.y);}return result;
}
