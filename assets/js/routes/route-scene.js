import * as THREE from '../../vendor/three/three.module.js';

// A local, flat corridor extruded from the saved polyline. Width/height are illustrative.
export function createRouteScene(plan){
 const xs=plan.points.map(p=>p.x),zs=plan.points.map(p=>p.y),bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
 const origin={x:(bounds.minX+bounds.maxX)/2,y:(bounds.minZ+bounds.maxZ)/2},width=bounds.maxX-bounds.minX+3.6,depth=bounds.maxZ-bounds.minZ+3.6;
 const group=new THREE.Group(),geometries=new Set(),materials=new Set();
 const geometry=value=>{geometries.add(value);return value;},material=(color,flat=false)=>{const value=flat?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.85});materials.add(value);return value;};
 const floor=material('#d5cfea'),rim=material('#aaa0cd'),line=material('#9b8ad6',true),trace=material('#6a4ce4',true),ink=material('#6a4ce4',true),white=material('#ffffff',true),startMat=material('#419e8b'),signMat=material('#d6a255');
 const box=geometry(new THREE.BoxGeometry(1,1,1)),cylinder=geometry(new THREE.CylinderGeometry(1,1,1,16)),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 function instances(geo,mat,count,name){const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.name=name;group.add(mesh);return mesh;}
 function place(mesh,index,x,y,z,sx,sy,sz,angle=0){rotation.setFromAxisAngle(up,angle);matrix.compose(new THREE.Vector3(x-origin.x,y,z-origin.y),rotation,new THREE.Vector3(sx,sy,sz));mesh.setMatrixAt(index,matrix);}
 const slabs=instances(box,floor,plan.legs.length,'corridor'),rims=instances(box,rim,plan.legs.length,'corridor-base'),joints=instances(cylinder,floor,plan.points.length,'corners'),strips=instances(box,line,plan.legs.length,'planned-route'),dots=instances(cylinder,line,plan.points.length,'route-joints'),travelled=instances(box,trace,plan.legs.length,'travelled-route');
 function segment(mesh,index,a,b,thickness,height,y){place(mesh,index,(a.x+b.x)/2,y,(a.y+b.y)/2,thickness,height,Math.hypot(b.x-a.x,b.y-a.y),Math.atan2(b.x-a.x,b.y-a.y));}
 plan.legs.forEach((leg,i)=>{segment(slabs,i,leg.start,leg.end,2.4,.22,-.11);segment(rims,i,leg.start,leg.end,2.52,.12,-.25);segment(strips,i,leg.start,leg.end,.16,.035,.035);});
 plan.points.forEach((p,i)=>{place(joints,i,p.x,-.11,p.y,1.2,.22,1.2);place(dots,i,p.x,.035,p.y,.08,.035,.08);});
 // Explicit stair signs remain markers; no floor heights are inferred from a 2D route.
 const stairPoints=plan.points.filter(p=>p.cue==='stairs-up'||p.cue==='stairs-down'),stairs=instances(box,signMat,stairPoints.length*3,'stair-signs');
 stairPoints.forEach((p,i)=>{for(let j=0;j<3;j++)place(stairs,i*3+j,p.x+.75,.12+j*.1,p.y+(j-1)*.2,.35,.16+j*.2,.18);});
 const pinGeometry=geometry(new THREE.CylinderGeometry(.12,.12,.7,12)),capGeometry=geometry(new THREE.SphereGeometry(.26,16,10));
 function pin(p,mat,name){const g=new THREE.Group();g.name=name;g.position.set(p.x-origin.x,0,p.y-origin.y);const stem=new THREE.Mesh(pinGeometry,mat),cap=new THREE.Mesh(capGeometry,mat);stem.position.y=.4;cap.position.y=.85;g.add(stem,cap);group.add(g);return g;}
 const start=pin(plan.points[0],startMat,'start'),end=pin(plan.points.at(-1),ink,'destination');
 const shape=new THREE.Shape();shape.moveTo(0,-.65);shape.lineTo(.4,.42);shape.lineTo(0,.2);shape.lineTo(-.4,.42);shape.closePath();
 const arrowGeometry=geometry(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false})),player=new THREE.Group();player.name='position';
 const halo=new THREE.Mesh(geometry(new THREE.CylinderGeometry(.68,.68,.035,32)),white);halo.position.y=.11;player.add(halo);
 const arrow=new THREE.Mesh(arrowGeometry,ink);arrow.rotation.x=Math.PI/2;arrow.position.y=.32;player.add(arrow);group.add(player);
 let lastProgress=-1,lastIndex=-1;
 function update(journey){
  player.position.set(journey.position.x-origin.x,0,journey.position.y-origin.y);player.rotation.y=-journey.heading*Math.PI/180;
  start.visible=journey.phase==='ready';player.visible=journey.phase!=='arrived';
  if(lastProgress!==journey.travelled||lastIndex!==journey.index){
   travelled.count=journey.index+(journey.along>0?1:0);
   for(let i=0;i<travelled.count;i++){const leg=plan.legs[i],t=i<journey.index?1:Math.min(1,journey.along/leg.distance);segment(travelled,i,leg.start,{x:leg.start.x+(leg.end.x-leg.start.x)*t,y:leg.start.y+(leg.end.y-leg.start.y)*t},.19,.045,.065);}
   travelled.instanceMatrix.needsUpdate=true;lastProgress=journey.travelled;lastIndex=journey.index;
  }
 }
 function theme(dark){floor.color.set(dark?'#34314d':'#ded9ef');rim.color.set(dark?'#242139':'#b7abd6');line.color.set(dark?'#777094':'#ab9bd5');trace.color.set(dark?'#ba9fff':'#6a4ce4');ink.color.set(dark?'#b69aff':'#6a4ce4');}
 function dispose(){group.traverse(object=>{if(object.isInstancedMesh)object.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();}
 return {group,origin,width,depth,player,start,end,travelled,update,theme,dispose};
}

export function cameraPose(model,journey,aspect=1,follow=false){
 if(follow){const heading=journey.heading*Math.PI/180,dx=Math.sin(heading),dz=-Math.cos(heading),x=journey.position.x-model.origin.x,z=journey.position.y-model.origin.y;return {position:[x-dx*7.5,8.5,z-dz*7.5],target:[x+dx*3,0,z+dz*3],far:300};}
 const radius=Math.hypot(model.width,model.depth)/2+1,vertical=45*Math.PI/180,horizontal=2*Math.atan(Math.tan(vertical/2)*Math.max(.2,aspect)),distance=radius/Math.sin(Math.min(vertical,horizontal)/2)*1.12;
 const direction=new THREE.Vector3(.5,1,.65).normalize();return {position:direction.multiplyScalar(distance).toArray(),target:[0,0,0],far:Math.max(300,distance*4)};
}
