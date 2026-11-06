import * as THREE from '../../vendor/three/three.module.js';
import {createRouteScene,cameraPose} from './route-scene.js?v=20261106-route3d';

export function mount3D(host,{onFailure=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
 const canvas=renderer.domElement;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Rota em 3D: corredor ilustrativo com saída, destino e posição.');host.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.08,300);scene.add(new THREE.HemisphereLight('#ffffff','#807199',2.8));const light=new THREE.DirectionalLight('#ffffff',2.5);light.position.set(-4,14,6);scene.add(light);
 let model=null,plan=null,latest=null,disposed=false,background=null,lastDark=null,lastWidth=0,lastHeight=0;
 function update(journey,{follow=false}={}){latest={journey,follow};draw();}
 function draw(){
  if(disposed||!latest||host.hidden||document.hidden)return;
  const {journey,follow}=latest;
  if(plan!==journey.plan){if(model){scene.remove(model.group);model.dispose();}plan=journey.plan;model=createRouteScene(plan);scene.add(model.group);lastDark=null;}
  const dark=document.documentElement.dataset.theme==='dark';if(dark!==lastDark){model.theme(dark);lastDark=dark;}const color=dark?'#19182a':'#f2effa';if(color!==background){scene.background=new THREE.Color(color);background=color;}
  model.update(journey);
  const width=host.clientWidth||320,height=host.clientHeight||320;if(width!==lastWidth||height!==lastHeight){renderer.setSize(width,height,false);lastWidth=width;lastHeight=height;}camera.aspect=width/height;
  const pose=cameraPose(model,journey,camera.aspect,follow);camera.position.fromArray(pose.position);camera.far=pose.far;camera.lookAt(...pose.target);camera.updateProjectionMatrix();renderer.render(scene,camera);
  // Labels are projected from the real 3D pins, without textures or external images.
  for(const [name,pin] of [['a',model.start],['b',model.end]]){const label=host.querySelector(`[data-route-pin="${name}"]`);if(!label)continue;const v=pin.position.clone();v.y=1.45;v.project(camera);const visible=pin.visible&&v.z>-1&&v.z<1&&Math.abs(v.x)<.94&&Math.abs(v.y)<.9;label.hidden=!visible;if(visible){label.style.left=`${(v.x+1)*width/2}px`;label.style.top=`${(1-v.y)*height/2}px`;}}
 }
 function lost(event){event.preventDefault();onFailure();}
 canvas.addEventListener('webglcontextlost',lost);
 const resize=new ResizeObserver(draw);resize.observe(host);const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.addEventListener('visibilitychange',draw);
 return {update,dispose(){if(disposed)return;disposed=true;resize.disconnect();theme.disconnect();document.removeEventListener('visibilitychange',draw);canvas.removeEventListener('webglcontextlost',lost);model?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();latest=null;}};
}
