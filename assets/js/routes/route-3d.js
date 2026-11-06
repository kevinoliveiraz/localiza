import * as THREE from '../../vendor/three/three.module.js';
import {createRouteScene,cameraPose} from './route-scene.js?v=20261106-polish3d';
import {CameraHeading,labelLayout} from './route-camera.js?v=20261106-polish3d';

export function mount3D(host,{onFailure=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor('#000000',0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const canvas=renderer.domElement;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Rota em 3D: corredor ilustrativo com saída, destino e posição.');host.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.08,300);scene.add(new THREE.HemisphereLight('#ffffff','#847099',1.9));const light=new THREE.DirectionalLight('#fff9f1',2);light.position.set(-6,12,8);scene.add(light);
 const heading=new CameraHeading(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let model=null,plan=null,latest=null,disposed=false,lastDark=null,lastWidth=0,lastHeight=0,frame=0,lastHeading=null;
 function update(journey,{follow=false}={}){const snap=reduced.matches||!latest||latest.follow!==follow||plan!==journey.plan;if(snap||journey.heading!==lastHeading){heading.set(journey.heading,window.performance.now(),snap);lastHeading=journey.heading;}latest={journey,follow};redraw();}
 function redraw(){window.cancelAnimationFrame(frame);frame=0;draw();}
 function draw(){
  frame=0;if(disposed||!latest||host.hidden||document.hidden){heading.finish();return;}
  const {journey,follow}=latest;
  if(plan!==journey.plan){if(model){scene.remove(model.group);model.dispose();}plan=journey.plan;model=createRouteScene(plan);scene.add(model.group);lastDark=null;}
  const dark=document.documentElement.dataset.theme==='dark';if(dark!==lastDark){model.theme(dark);lastDark=dark;}
  model.update(journey);
  const width=host.clientWidth||320,height=host.clientHeight||320;if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);lastWidth=width;lastHeight=height;}camera.aspect=width/height;
  if(reduced.matches)heading.finish();const pose=cameraPose(model,{position:journey.position,heading:heading.sample(window.performance.now())},camera.aspect,follow);camera.position.fromArray(pose.position);camera.far=pose.far;camera.lookAt(...pose.target);camera.updateProjectionMatrix();renderer.render(scene,camera);
  // Labels are projected from the real 3D pins, without textures or external images.
  const pins=[['a',model.start],['b',model.end]].map(([name,pin])=>{const v=pin.position.clone();v.y=model.pinLabelHeight;v.project(camera);return {label:host.querySelector(`[data-route-pin="${name}"]`),x:(v.x+1)*width/2,y:(1-v.y)*height/2,visible:pin.visible&&v.z>-1&&v.z<1&&Math.abs(v.x)<.96&&Math.abs(v.y)<.94};});
  for(const p of labelLayout(pins,width)){if(!p.label)continue;p.label.hidden=!p.visible;p.label.classList.toggle('is-compact',p.compact);if(p.visible){p.label.style.left=`${p.x}px`;p.label.style.top=`${p.y}px`;}}
  if(follow&&heading.active&&!reduced.matches)frame=window.requestAnimationFrame(draw);
 }
 function lost(event){event.preventDefault();onFailure();}
 canvas.addEventListener('webglcontextlost',lost);
 const resize=new ResizeObserver(redraw);resize.observe(host);const theme=new MutationObserver(redraw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('visibilitychange',redraw);reduced.addEventListener('change',redraw);
 return {update,dispose(){if(disposed)return;disposed=true;window.cancelAnimationFrame(frame);resize.disconnect();theme.disconnect();reduced.removeEventListener('change',redraw);document.removeEventListener('visibilitychange',redraw);canvas.removeEventListener('webglcontextlost',lost);model?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();latest=null;}};
}
