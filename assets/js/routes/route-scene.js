import * as THREE from '../../vendor/three/three.module.js';

// A local, flat corridor. All dimensions beyond the saved centreline are illustrative.
export function createRouteScene(plan){
 const xs=plan.points.map(p=>p.x),zs=plan.points.map(p=>p.y),bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
 const origin={x:(bounds.minX+bounds.maxX)/2,y:(bounds.minZ+bounds.maxZ)/2},width=bounds.maxX-bounds.minX+3.6,depth=bounds.maxZ-bounds.minZ+3.6;
 const group=new THREE.Group(),geometries=new Set(),materials=new Set(),textures=new Set();
 const geometry=value=>{geometries.add(value);return value;};
 function material(color,flat=false,extra={}){const value=flat?new THREE.MeshBasicMaterial({color,toneMapped:false,...extra}):new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.02,...extra});materials.add(value);return value;}
 const floor=material('#e4dff0'),rim=material('#a398c1'),line=material('#8165c5',true),trace=material('#6541d9',true),ink=material('#6541d9',true),white=material('#ffffff',true),startMat=material('#3a9d85'),pinSide=material('#837398'),signMat=material('#d0a05c');
 const glow=material('#9671eb',true,{transparent:true,opacity:.13,depthWrite:false}),fanMat=material('#8960df',true,{transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide});
 const shadowData=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);shadowData.set([255,255,255,Math.round(Math.pow(Math.max(0,1-r),1.6)*255)],i);}
 const shadowTexture=new THREE.DataTexture(shadowData,64,64);shadowTexture.magFilter=THREE.LinearFilter;shadowTexture.needsUpdate=true;textures.add(shadowTexture);
 const shadowMat=material('#33204f',true,{map:shadowTexture,transparent:true,opacity:.24,depthWrite:false});
 const box=geometry(new THREE.BoxGeometry(1,1,1)),cylinder=geometry(new THREE.CylinderGeometry(1,1,1,24)),plane=geometry(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
 // A constant cross-section keeps the small bevel the same size on long and short legs.
 const section=new THREE.Shape();section.moveTo(-.5,-.5);section.lineTo(.5,-.5);section.lineTo(.5,.28);section.quadraticCurveTo(.5,.5,.47,.5);section.lineTo(-.47,.5);section.quadraticCurveTo(-.5,.5,-.5,.28);section.closePath();
 const slabGeometry=geometry(new THREE.ExtrudeGeometry(section,{depth:1,bevelEnabled:false,curveSegments:4}).translate(0,0,-.5));
 const jointGeometry=geometry(new THREE.LatheGeometry([[0,-.5],[1,-.5],[1,.28],[.996,.36],[.986,.44],[.97,.49],[.95,.5],[0,.5]].map(([x,y])=>new THREE.Vector2(x,y)),32));
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),s=new THREE.Vector3();
 function instances(geo,mat,count,name){const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.name=name;group.add(mesh);return mesh;}
 function place(mesh,index,x,y,z,sx,sy,sz,angle=0){rotation.setFromAxisAngle(up,angle);matrix.compose(v.set(x-origin.x,y,z-origin.y),rotation,s.set(sx,sy,sz));mesh.setMatrixAt(index,matrix);}
 function segment(mesh,index,a,b,thickness,height,y,extra=0){place(mesh,index,(a.x+b.x)/2,y,(a.y+b.y)/2,thickness,height,Math.hypot(b.x-a.x,b.y-a.y)+extra,Math.atan2(b.x-a.x,b.y-a.y));}
 const slabs=instances(slabGeometry,floor,plan.legs.length,'corridor'),rims=instances(box,rim,plan.legs.length,'corridor-base'),joints=instances(jointGeometry,floor,plan.points.length,'corners'),rimJoints=instances(cylinder,rim,plan.points.length,'base-corners');
 const shadows=instances(plane,shadowMat,plan.legs.length,'contact-shadows'),cornerShadows=instances(plane,shadowMat,plan.points.length,'corner-shadows');
 const stripGlow=instances(box,glow,plan.legs.length,'route-glow'),glowJoints=instances(cylinder,glow,plan.points.length,'glow-joints'),strips=instances(box,line,plan.legs.length,'planned-route'),dots=instances(cylinder,line,plan.points.length,'route-joints'),travelled=instances(box,trace,plan.legs.length,'travelled-route');
 plan.legs.forEach((leg,i)=>{
  segment(slabs,i,leg.start,leg.end,2.4,.22,-.11);segment(rims,i,leg.start,leg.end,2.48,.1,-.25);
  segment(shadows,i,leg.start,leg.end,4.2,1,-.36,2);segment(stripGlow,i,leg.start,leg.end,.46,.014,.022);segment(strips,i,leg.start,leg.end,.19,.03,.048);
 });
 plan.points.forEach((p,i)=>{place(joints,i,p.x,-.11,p.y,1.2,.22,1.2);place(rimJoints,i,p.x,-.25,p.y,1.24,.1,1.24);place(cornerShadows,i,p.x,-.355,p.y,4.2,1,4.2);place(dots,i,p.x,.048,p.y,.095,.03,.095);place(glowJoints,i,p.x,.022,p.y,.23,.014,.23);});
 // Small stair signs follow the local corridor; they do not imply measured floor heights.
 const stairPoints=plan.points.flatMap((p,index)=>p.cue==='stairs-up'||p.cue==='stairs-down'?[{p,index}]:[]),stairs=instances(slabGeometry,signMat,stairPoints.length*3,'stair-signs');
 stairPoints.forEach(({p,index},i)=>{const leg=plan.legs[Math.min(index,plan.legs.length-1)],dx=(leg.end.x-leg.start.x)/leg.distance,dz=(leg.end.y-leg.start.y)/leg.distance,angle=Math.atan2(dx,dz);for(let j=0;j<3;j++){const level=p.cue==='stairs-down'?2-j:j;place(stairs,i*3+j,p.x-dz*.72+dx*(j-1)*.21,.12+level*.09,p.y+dx*.72+dz*(j-1)*.21,.42,.17+level*.18,.2,angle);}});
 const pinStem=geometry(new THREE.CylinderGeometry(.045,.065,.58,16)),pinCap=geometry(new THREE.SphereGeometry(.16,20,12)),pinBase=geometry(new THREE.CylinderGeometry(.28,.34,.08,24)),pinRing=geometry(new THREE.TorusGeometry(.38,.024,6,32).rotateX(Math.PI/2));
 function pin(p,mat,name){
  const g=new THREE.Group();g.name=name;g.position.set(p.x-origin.x,0,p.y-origin.y);
  const base=new THREE.Mesh(pinBase,mat),ring=new THREE.Mesh(pinRing,mat),stem=new THREE.Mesh(pinStem,pinSide),cap=new THREE.Mesh(pinCap,mat);base.position.y=.045;ring.position.y=.045;stem.position.y=.38;cap.position.y=.75;g.add(base,ring,stem,cap);group.add(g);return g;
 }
 const start=pin(plan.points[0],startMat,'start'),end=pin(plan.points.at(-1),ink,'destination');
 const arrowShape=new THREE.Shape();arrowShape.moveTo(0,-.65);arrowShape.lineTo(.4,.42);arrowShape.lineTo(0,.23);arrowShape.lineTo(-.4,.42);arrowShape.closePath();
 const arrowGeometry=geometry(new THREE.ExtrudeGeometry(arrowShape,{depth:.1,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025})),arrowSide=material('#493394');
 const player=new THREE.Group();player.name='position';
 const haloMat=material('#9671eb',true,{map:shadowTexture,transparent:true,opacity:.24,depthWrite:false}),halo=new THREE.Mesh(plane,haloMat);halo.scale.set(1.9,1,1.9);halo.position.y=.095;
 const outline=new THREE.Mesh(arrowGeometry,white);outline.rotation.x=Math.PI/2;outline.position.y=.36;outline.scale.set(1.09,1.09,1);
 const arrow=new THREE.Mesh(arrowGeometry,[ink,arrowSide]);arrow.rotation.x=Math.PI/2;arrow.position.y=.43;
 const fanShape=new THREE.Shape();fanShape.moveTo(0,0);fanShape.lineTo(-.85,-2);fanShape.quadraticCurveTo(0,-2.6,.85,-2);fanShape.closePath();const fan=new THREE.Mesh(geometry(new THREE.ShapeGeometry(fanShape).rotateX(Math.PI/2)),fanMat);fan.position.y=.075;
 player.add(halo,fan,outline,arrow);group.add(player);
 let lastProgress=-1,lastIndex=-1;
 function update(journey){
  player.position.set(journey.position.x-origin.x,0,journey.position.y-origin.y);player.rotation.y=-journey.heading*Math.PI/180;
  start.visible=journey.phase==='ready';player.visible=!['ready','arrived'].includes(journey.phase);
  if(lastProgress!==journey.travelled||lastIndex!==journey.index){
   travelled.count=journey.index+(journey.along>0?1:0);
   for(let i=0;i<travelled.count;i++){const leg=plan.legs[i],t=i<journey.index?1:Math.min(1,journey.along/leg.distance);segment(travelled,i,leg.start,{x:leg.start.x+(leg.end.x-leg.start.x)*t,y:leg.start.y+(leg.end.y-leg.start.y)*t},.24,.045,.078);}
   travelled.instanceMatrix.needsUpdate=true;lastProgress=journey.travelled;lastIndex=journey.index;
  }
 }
 function theme(dark){floor.color.set(dark?'#49425e':'#e4dff0');rim.color.set(dark?'#252038':'#a398c1');line.color.set(dark?'#9d83dc':'#8165c5');trace.color.set(dark?'#c3a6ff':'#6541d9');ink.color.set(dark?'#bba0ff':'#6541d9');arrowSide.color.set(dark?'#7253ad':'#493394');pinSide.color.set(dark?'#827497':'#afa1c1');shadowMat.color.set(dark?'#090513':'#33204f');shadowMat.opacity=dark?.48:.24;}
 function dispose(){group.traverse(object=>{if(object.isInstancedMesh)object.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());group.clear();}
 return {group,origin,width,depth,player,start,end,travelled,pinLabelHeight:1.13,update,theme,dispose};
}

export function cameraPose(model,journey,aspect=1,follow=false){
 if(follow){const heading=journey.heading*Math.PI/180,dx=Math.sin(heading),dz=-Math.cos(heading),x=journey.position.x-model.origin.x,z=journey.position.y-model.origin.y;return {position:[x-dx*7.5,8.5,z-dz*7.5],target:[x+dx*3,0,z+dz*3],far:300};}
 const radius=Math.hypot(model.width,model.depth)/2+1,vertical=45*Math.PI/180,horizontal=2*Math.atan(Math.tan(vertical/2)*Math.max(.2,aspect)),distance=radius/Math.sin(Math.min(vertical,horizontal)/2)*1.12;
 const direction=new THREE.Vector3(.5,1,.65).normalize();return {position:direction.multiplyScalar(distance).toArray(),target:[0,0,0],far:Math.max(300,distance*4)};
}
