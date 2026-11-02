import * as THREE from '../../vendor/three/three.module.js';
import {OrbitControls} from '../../vendor/three/addons/controls/OrbitControls.js';
import {distance,planBounds,wallSegments} from './plan-model.js';

const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.02,...extra});
function box(parent,width,height,depth,x,y,z,mat){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function roomShape(points){const shape=new THREE.Shape();points.forEach((point,index)=>index?shape.lineTo(point.x,-point.y):shape.moveTo(point.x,-point.y));shape.closePath();return shape;}
function furniture(object){
 const group=new THREE.Group();group.name=object.type;group.userData={kind:'object',id:object.id};
 const wood=material('#bca58b'),dark=material('#62677e'),fabric=material('#aaa0d4'),leaf=material('#739b83'),white=material('#efedf4');
 const w=object.width,d=object.depth,h=object.height;
 if(object.type==='desk'){
  box(group,w,.08,d,0,h,0,wood);
  for(const x of [-w*.4,w*.4])for(const z of [-d*.36,d*.36])box(group,.055,h,.055,x,h/2,z,dark);
  box(group,.48,.3,.035,0,h+.22,-d*.15,dark);box(group,.035,.14,.035,0,h+.06,-d*.15,dark);
 }else if(object.type==='sofa'){
  box(group,w,h*.38,d,0,h*.32,0,fabric);box(group,w,h*.63,.2,0,h*.65,-d/2+.1,fabric);
  for(const x of [-w/2+.09,w/2-.09])box(group,.18,h*.55,d,x,h*.46,0,fabric);
  box(group,w*.84,.08,d*.72,0,h*.56,.06,white);
 }else if(object.type==='chair'){
  box(group,w,.1,d,0,h*.5,0,wood);box(group,w,h*.5,.07,0,h*.76,-d/2+.035,wood);
  for(const x of [-w*.38,w*.38])for(const z of [-d*.36,d*.36])box(group,.045,h*.5,.045,x,h*.25,z,dark);
 }else if(object.type==='cabinet'){
  box(group,w,h,d,0,h/2,0,white);box(group,.018,h*.92,.018,0,h/2,d/2+.01,dark);
  for(const x of [-.08,.08])box(group,.025,.14,.04,x,h*.56,d/2+.025,dark);
 }else{
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(w*.4,w*.28,h*.4,16),wood);pot.position.y=h*.2;pot.castShadow=true;group.add(pot);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(w*.62,1),leaf);crown.scale.y=Math.max(1,h/w*.65);crown.position.y=h*.7;crown.castShadow=true;group.add(crown);
 }
 group.position.set(object.x,0,object.y);group.rotation.y=-object.rotation*Math.PI/180;return group;
}
export function buildPlanGroup(plan,{cutaway=false,ceilings=false}={}){
 const group=new THREE.Group();group.name='Localiza';group.userData={units:'meters',building:plan.building,floor:plan.floor,source:plan.source};
 for(const room of plan.rooms){
  const geometry=new THREE.ExtrudeGeometry(roomShape(room.points),{depth:.12,bevelEnabled:false});geometry.rotateX(-Math.PI/2);
  const floor=new THREE.Mesh(geometry,material(room.color||'#e6e0f6'));floor.name=room.name;floor.position.y=-.12;floor.receiveShadow=true;floor.userData={kind:'room',id:room.id,roomId:room.roomId};group.add(floor);
  if(ceilings){const ceiling=new THREE.Mesh(new THREE.ShapeGeometry(roomShape(room.points)),material('#eef0f5',{side:THREE.DoubleSide,transparent:true,opacity:.35}));ceiling.rotation.x=-Math.PI/2;ceiling.position.y=plan.height;group.add(ceiling);}
 }
 for(const wall of plan.walls){
  const wallGroup=new THREE.Group();wallGroup.position.set(wall.a.x,0,wall.a.y);wallGroup.rotation.y=-Math.atan2(wall.b.y-wall.a.y,wall.b.x-wall.a.x);wallGroup.userData={kind:'wall',id:wall.id};wallGroup.name='Parede';
  const wallMaterial=material(wall.color||'#e3e5ee');
  for(const segment of wallSegments(wall)){
   const top=cutaway?Math.min(segment.top,1.25):segment.top;if(top<=segment.bottom)continue;
   const mesh=box(wallGroup,segment.end-segment.start,top-segment.bottom,wall.thickness,(segment.start+segment.end)/2,(top+segment.bottom)/2,0,wallMaterial);
   mesh.userData={kind:'wall',id:wall.id};
   const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:'#b4b9cd',transparent:true,opacity:.4}));mesh.add(edges);
  }
  for(const opening of wall.openings){
   if(cutaway&&opening.sill>1.25)continue;
   const frame=material('#d4c4b1');
   if(opening.kind==='door'){
    const hinge=new THREE.Group();hinge.position.set(opening.offset-opening.width/2,0,0);hinge.rotation.y=-Math.PI/5;
    box(hinge,opening.width,cutaway?1.15:opening.height,.045,opening.width/2,(cutaway?1.15:opening.height)/2,0,frame);wallGroup.add(hinge);
   }else{
    const visibleHeight=cutaway?Math.max(.1,1.25-opening.sill):opening.height;
    const glass=material('#8bc7e0',{transparent:true,opacity:.3,roughness:.1,side:THREE.DoubleSide,depthWrite:false});
    box(wallGroup,opening.width,visibleHeight,.025,opening.offset,opening.sill+visibleHeight/2,0,glass);
    for(const x of [-opening.width/2,opening.width/2])box(wallGroup,.045,visibleHeight,.065,opening.offset+x,opening.sill+visibleHeight/2,0,frame);
    box(wallGroup,opening.width,.045,.065,opening.offset,opening.sill,0,frame);
    if(!cutaway)box(wallGroup,opening.width,.045,.065,opening.offset,opening.sill+opening.height,0,frame);
   }
  }
  group.add(wallGroup);
 }
 plan.objects.forEach(object=>group.add(furniture(object)));
 return group;
}
function disposeTree(root){const geometries=new Set(),materials=new Set();root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const item of Array.isArray(object.material)?object.material:[object.material])if(item)materials.add(item);});geometries.forEach(item=>item.dispose());materials.forEach(item=>{for(const value of Object.values(item))if(value?.isTexture)value.dispose();item.dispose();});}

export class SpatialViewer{
 constructor(container,{onPick=()=>{},onError=()=>{}}={}){
  this.container=container;this.onPick=onPick;this.disposed=false;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#f2f3f9');
  this.camera=new THREE.PerspectiveCamera(43,1,.05,1500);
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});}
  catch(error){onError('O navegador não conseguiu iniciar o 3D. A planta 2D continua disponível.');throw error;}
  this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.renderer.domElement.setAttribute('aria-label','Modelo 3D do ambiente. Arraste para girar; use a roda ou dois dedos para aproximar.');this.renderer.domElement.setAttribute('role','img');this.renderer.domElement.tabIndex=0;
  container.replaceChildren(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minDistance=.7;this.controls.maxDistance=300;this.controls.target.set(0,0,0);
  this.scene.add(new THREE.HemisphereLight('#f9fbff','#b8afc4',2.3));
  const sun=new THREE.DirectionalLight('#fff7ee',3);sun.position.set(12,20,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.normalBias=.035;this.scene.add(sun);
  this.grid=new THREE.GridHelper(100,100,'#bac0d2','#dfe2ee');this.grid.position.y=-.14;this.scene.add(this.grid);
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  this.down=event=>{this.pointerStart={x:event.clientX,y:event.clientY};};
  this.up=event=>{if(!this.content||!this.pointerStart||Math.hypot(event.clientX-this.pointerStart.x,event.clientY-this.pointerStart.y)>5)return;const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObject(this.content,true).find(item=>item.object.userData.kind);if(hit)this.onPick(hit.object.userData);};
  this.renderer.domElement.addEventListener('pointerdown',this.down);this.renderer.domElement.addEventListener('pointerup',this.up);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
  this.themeObserver=new MutationObserver(()=>this.updateTheme());this.themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});this.updateTheme();
  this.invalidate=()=>this.requestRender();this.controls.addEventListener('change',this.invalidate);this.requestRender();
 }
 requestRender(){if(this.disposed||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=null;if(this.disposed)return;this.controls.update();if(this.container.offsetWidth&&this.container.offsetHeight)this.renderer.render(this.scene,this.camera);});}
 resize(){if(this.disposed)return;const width=Math.max(1,this.container.clientWidth),height=Math.max(1,this.container.clientHeight);this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.requestRender();}
 updateTheme(){const dark=document.documentElement.dataset.theme==='dark';this.scene.background.set(dark?'#171925':'#f2f3f9');this.grid.material.forEach?.(item=>item.color.set(dark?'#383d58':'#d1d5e3'));if(!Array.isArray(this.grid.material))this.grid.material.color.set(dark?'#383d58':'#d1d5e3');this.requestRender();}
 setPlan(plan,options={}){this.grid.visible=true;this.controls.maxPolarAngle=Math.PI*.49;this.replaceContent(buildPlanGroup(plan,options),!options.preserveView);this.plan=plan;}
 replaceContent(content,fit=true){if(this.content){this.scene.remove(this.content);disposeTree(this.content);}this.content=content;this.scene.add(content);this.resize();if(fit)this.fit();}
 fit(){if(!this.content)return;const bounds=new THREE.Box3().setFromObject(this.content);if(bounds.isEmpty()){this.camera.position.set(12,12,12);this.controls.target.set(4,0,4);this.controls.update();return;}const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z,3);this.controls.target.copy(center);const vertical=this.camera.fov*Math.PI/180,horizontal=2*Math.atan(Math.tan(vertical/2)*this.camera.aspect),radius=size.length()/2,dist=Math.max(4,radius/Math.sin(Math.min(vertical,horizontal)/2)*1.08);this.camera.position.copy(center).add(new THREE.Vector3(.82,.95,1.05).normalize().multiplyScalar(dist));this.camera.near=Math.max(.02,extent/1000);this.camera.far=Math.max(500,extent*40);this.camera.updateProjectionMatrix();this.controls.update();}
 zoom(factor){const delta=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);this.camera.position.copy(this.controls.target).add(delta);this.controls.update();}
 topView(){if(!this.content)return;const bounds=new THREE.Box3().setFromObject(this.content),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());this.controls.target.copy(center);this.camera.position.set(center.x,center.y+Math.max(size.x/this.camera.aspect,size.z,3)*1.6,center.z+.001);this.controls.update();}
 async loadModel(buffer,format,shouldApply=()=>true){
  let content;
  if(format==='ply'){
   const {PLYLoader}=await import('../../vendor/three/addons/loaders/PLYLoader.js');const geometry=new PLYLoader().parse(buffer);geometry.computeVertexNormals();
   const colors=Boolean(geometry.getAttribute('color'));
   content=geometry.index?new THREE.Mesh(geometry,material('#e8e2f3',{vertexColors:colors,side:THREE.DoubleSide})):new THREE.Points(geometry,new THREE.PointsMaterial({size:.035,vertexColors:colors,color:colors?'#ffffff':'#a795eb'}));
  }else{
   const {GLTFLoader}=await import('../../vendor/three/addons/loaders/GLTFLoader.js');const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(url.startsWith('blob:')||url.startsWith('data:'))return url;throw new Error('O modelo deve ser um GLB autocontido, sem arquivos externos.');});
   content=await new Promise((resolve,reject)=>new GLTFLoader(manager).parse(buffer,'',result=>resolve(result.scene),reject));
  }
  if(this.disposed||!shouldApply()){disposeTree(content);return;}
  const root=new THREE.Group();root.name='Modelo por fotos';root.add(content);const bounds=new THREE.Box3().setFromObject(content);if(bounds.isEmpty())throw new Error('O arquivo não contém geometria.');
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),scale=10/Math.max(size.x,size.y,size.z,.001);content.position.sub(center);root.scale.setScalar(scale);root.userData={source:'photos',units:'relative'};this.grid.visible=false;this.controls.maxPolarAngle=Math.PI;this.replaceContent(root);
 }
 async exportGLB(){if(!this.content)throw new Error('Não há modelo para exportar.');const {GLTFExporter}=await import('../../vendor/three/addons/exporters/GLTFExporter.js');return await new GLTFExporter().parseAsync(this.content,{binary:true,onlyVisible:true});}
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.themeObserver.disconnect();this.controls.removeEventListener('change',this.invalidate);this.controls.dispose();this.renderer.domElement.removeEventListener('pointerdown',this.down);this.renderer.domElement.removeEventListener('pointerup',this.up);if(this.content)disposeTree(this.content);this.grid.geometry.dispose();if(Array.isArray(this.grid.material))this.grid.material.forEach(item=>item.dispose());else this.grid.material.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
