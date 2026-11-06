export function routeViewer(svg){
 return `<div class="route-viewer" data-route-viewer data-dimension="2d"><div class="route-view-switch" role="group" aria-label="Visualização da rota"><button type="button" data-route-dimension="2d" aria-pressed="false" aria-label="Ver rota em 2D">2D</button><button type="button" data-route-dimension="3d" aria-pressed="true" aria-label="Ver rota em 3D">3D</button></div>${svg}<div class="route-3d-host" data-route-3d hidden><span class="route-3d-pin is-start" data-route-pin="a" aria-hidden="true">A</span><span class="route-3d-pin" data-route-pin="b" aria-hidden="true">B</span></div><span class="route-view-caption" data-route-view-caption role="status">Preparando 3D…</span></div>`;
}

export function mountRouteViewer(root,{journey,onChange=()=>{},load3D=()=>import('./route-3d.js?v=20261106-route3d')}={}){
 const svg=root.querySelector('svg'),host=root.querySelector('[data-route-3d]'),caption=root.querySelector('[data-route-view-caption]'),buttons=[...root.querySelectorAll('[data-route-dimension]')];
 let latest=journey,following=false,desired='3d',scene=null,loading=null,disposed=false,failed=false;
 function show(dimension){const changed=root.dataset.dimension!==dimension;root.dataset.dimension=dimension;svg.toggleAttribute('hidden',dimension==='3d');host.hidden=dimension!=='3d';buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.routeDimension===dimension)));caption.textContent=dimension==='3d'?'3D · corredor ilustrativo':failed?'3D indisponível neste aparelho · vista 2D':'2D · vista de cima';root.removeAttribute('aria-busy');if(changed)onChange(dimension);}
 function failure(){if(disposed)return;failed=true;desired='2d';scene?.dispose();scene=null;buttons.find(button=>button.dataset.routeDimension==='3d').disabled=true;show('2d');}
 async function select(dimension){
  desired=dimension;
  if(dimension==='2d'){show('2d');return;}
  if(failed)return;
  if(typeof window.WebGL2RenderingContext!=='function'){failure();return;}
  if(scene){show('3d');scene.update(latest,{follow:following});return;}
  root.setAttribute('aria-busy','true');caption.textContent='Preparando 3D…';
  try{loading??=load3D();const module=await loading;if(disposed||desired!=='3d')return;scene??=module.mount3D(host,{onFailure:failure});show('3d');scene.update(latest,{follow:following});}catch{failure();}
 }
 const click=event=>{const dimension=event.target.closest('[data-route-dimension]')?.dataset.routeDimension;if(dimension)void select(dimension);};root.addEventListener('click',click);void select('3d');
 return {update(next,{follow=false}={}){latest=next;following=follow;if(scene&&!host.hidden)scene.update(latest,{follow:following});},dispose(){if(disposed)return;disposed=true;root.removeEventListener('click',click);scene?.dispose();scene=null;}};
}
