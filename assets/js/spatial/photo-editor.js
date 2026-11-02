import {esc,go} from '../ui.js';
import {localRequest,engineHealth,download,reportError} from './local-api.js';
import {associatePhotoModel} from './plan-store.js';
const stageNames=[['preparing','Preparar fotos'],['features','Encontrar detalhes'],['matching','Relacionar fotografias'],['sparse','Estimar a estrutura 3D'],['dense','Reconstruir superfícies'],['mesh','Criar a malha'],['texture','Aplicar as fotografias'],['export','Preparar o modelo']];
const terminal=['completed','failed','cancelled','interrupted'];
export function mountPhotoEditor(root,{state}){
 let files=[],thumbnails=[],ready=false,job=null,pollTimer=null,viewer=null,disposed=false,loadingModel=null,busy=false;
 const abort=new AbortController();
 const selector=root.querySelector('[data-photo-files]'),start=root.querySelector('[data-photo-start]'),count=root.querySelector('[data-photo-count]'),runtime=root.querySelector('[data-photo-runtime]'),stageList=root.querySelector('[data-photo-stages]'),drop=root.querySelector('[data-photo-drop]');
 const clearURLs=()=>{thumbnails.forEach(url=>URL.revokeObjectURL(url));thumbnails=[];};
 function updateSelection(){
  clearURLs();count.textContent=files.length?`${files.length} fotografias · ${(files.reduce((sum,file)=>sum+file.size,0)/1024/1024).toFixed(1)} MB`:'Nenhuma foto selecionada';
  root.querySelector('[data-photo-clear]').hidden=!files.length;
  root.querySelector('[data-photo-thumbnails]').innerHTML=files.slice(0,80).map((file,index)=>{const url=URL.createObjectURL(file);thumbnails.push(url);return `<div class="photo-thumbnail"><img src="${url}" alt="Fotografia selecionada ${index+1}"/><button type="button" data-remove-photo="${index}" aria-label="Remover fotografia ${index+1}">×</button><span>${index+1}</span></div>`;}).join('');
  start.disabled=!ready||files.length<8||files.reduce((sum,file)=>sum+file.size,0)>600*1024*1024||busy;start.textContent=files.length>0&&files.length<8?`Selecione mais ${8-files.length} fotografias`:'Reconstruir neste computador';
 }
 function chooseFiles(incoming){
  if(busy)return;reportError(root,'');const accepted=[...incoming].filter(file=>['image/jpeg','image/png','image/webp'].includes(file.type)||/\.(jpe?g|png|webp)$/i.test(file.name));
  if(accepted.length!==incoming.length)reportError(root,'Alguns arquivos foram ignorados. Use JPG, PNG ou WebP.');
  const seen=new Set(files.map(file=>file.name+'|'+file.size+'|'+file.lastModified));
  for(const file of accepted){if(file.size>20*1024*1024){reportError(root,'Uma foto ultrapassa 20 MB. Reduza seu tamanho antes de importar.');continue;}const key=file.name+'|'+file.size+'|'+file.lastModified;if(!seen.has(key)){files.push(file);seen.add(key);}}
  if(files.length>160){files=files.slice(0,160);reportError(root,'O limite inicial é de 160 fotografias por trabalho.');}
  if(files.reduce((sum,file)=>sum+file.size,0)>600*1024*1024){reportError(root,'O conjunto ultrapassa 600 MB. Remova algumas fotografias.');}
  updateSelection();
 }
 async function checkEngine(){
  try{const health=await engineHealth(abort.signal);if(disposed)return;ready=health.ready;runtime.textContent=ready?'Motor pronto · execução somente neste computador':'Instalação do motor pendente';root.querySelector('[data-runtime-help]').hidden=ready;updateSelection();
   const previous=await localRequest('/api/scans',{signal:abort.signal});const history=root.querySelector('[data-photo-history]');history.innerHTML='<option value="">Selecionar um trabalho local…</option>'+previous.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.floor)+' · '+item.photoCount+' fotos · '+esc(new Date(item.createdAt).toLocaleString('pt-BR'))+' · '+esc(item.status==='completed'?'Concluído':item.status==='failed'?'Falhou':item.status==='cancelled'?'Interrompido':item.status)+'</option>').join('');root.querySelector('[data-photo-history-label]').hidden=!previous.length;const matching=previous.find(item=>item.building===state.building&&item.floor===state.floor);if(!files.length&&matching){job=matching;history.value=job.id;showJob();if(!terminal.includes(job.status))schedulePoll();}
  }catch{if(!disposed){ready=false;runtime.textContent='Motor local desligado';root.querySelector('[data-runtime-help]').hidden=false;updateSelection();}}
 }
 function showJob(){
  if(!job||disposed)return;busy=!terminal.includes(job.status)&&job.status!=='uploading';
  root.querySelector('[data-photo-progress]').hidden=false;
  const labels={uploading:'Recebendo fotos',queued:'Na fila local',running:'Processando',completed:job.stage==='partial'?'Resultado parcial':'Modelo pronto',failed:'Não concluído',cancelled:'Interrompido',interrupted:'Motor encerrado'};
  root.querySelector('[data-photo-job-status]').textContent=labels[job.status]||job.status;
  root.querySelector('[data-photo-job-message]').textContent=job.message;
  const active=stageNames.findIndex(([key])=>key===job.stage),allDone=job.status==='completed'&&job.stage==='completed',failedIndex=stageNames.findIndex(([key])=>key===job.failedStage);
  stageList.innerHTML=stageNames.map(([key,label],index)=>`<li class="${allDone||index<active?'is-done':index===active?'is-active':job.stage==='partial'&&index===failedIndex?'is-failed':''}"><span>${allDone||index<active?'✓':String(index+1).padStart(2,'0')}</span>${label}</li>`).join('');
  const cancel=root.querySelector('[data-photo-cancel]');cancel.hidden=terminal.includes(job.status);cancel.disabled=false;
  const log=root.querySelector('[data-photo-log]');log.href=job.logUrl;
  const actions=root.querySelector('[data-photo-result-actions]');actions.hidden=job.status!=='completed';
  root.querySelector('[data-photo-use]').textContent=job.stage==='partial'?'Usar nuvem de pontos no mapa':'Usar no mapa deste andar';
  root.querySelector('[data-photo-download]').textContent=job.format==='ply'?'Baixar nuvem PLY':'Baixar modelo GLB';
  start.disabled=!ready||files.length<8||files.reduce((sum,file)=>sum+file.size,0)>600*1024*1024||busy;
  if(job.status==='completed'&&loadingModel!==job.id){loadingModel=job.id;loadResult(job);}
 }
 function schedulePoll(){clearTimeout(pollTimer);if(disposed||!job||terminal.includes(job.status))return;pollTimer=setTimeout(poll,2200);}
 async function poll(){try{job=await localRequest('/api/scans/'+job.id,{signal:abort.signal});showJob();schedulePoll();}catch{if(!disposed){runtime.textContent='Conexão com o motor interrompida. Tentando novamente…';schedulePoll();}}}
 async function loadResult(result){
  const host=root.querySelector('[data-photo-viewer]');
  try{
   const response=await localRequest('/api/scans/'+result.id+'/model',{raw:true,signal:abort.signal});const buffer=await response.arrayBuffer();const {SpatialViewer}=await import('./engine.js');if(disposed||job?.id!==result.id)return;
   viewer?.dispose();viewer=new SpatialViewer(host,{onError:message=>reportError(root,message)});await viewer.loadModel(buffer,result.format,()=>!disposed&&job?.id===result.id);if(disposed||job?.id!==result.id)return;
   root.querySelector('.photo-result-heading h2').textContent=result.stage==='partial'?'Primeiros pontos reconstruídos.':'Reconstrução concluída.';
   if(result.stage==='partial')reportError(root,result.message);else reportError(root,'');
  }catch(error){if(!disposed)reportError(root,'O resultado foi salvo, mas a visualização não abriu: '+error.message);}
 }
 async function process(){
  if(!ready||files.length<8||files.reduce((sum,file)=>sum+file.size,0)>600*1024*1024||busy)return;
  if(files.reduce((sum,file)=>sum+file.size,0)>600*1024*1024){reportError(root,'O conjunto ultrapassa 600 MB. Remova fotografias antes de continuar.');return;}
  reportError(root,'');busy=true;updateSelection();
  try{
   job=await localRequest('/api/scans',{method:'POST',body:{building:state.building,floor:state.floor,quality:root.querySelector('[data-photo-quality]').value},signal:abort.signal});
   root.querySelector('[data-photo-progress]').hidden=false;
   for(let index=0;index<files.length;index++){
    root.querySelector('[data-photo-job-message]').textContent=`Recebendo fotos no motor local: ${index+1} de ${files.length}.`;
    start.textContent=`Preparando ${index+1}/${files.length}…`;
    job=await localRequest(`/api/scans/${job.id}/photos`,{method:'POST',body:files[index],signal:abort.signal});
   }
   job=await localRequest(`/api/scans/${job.id}/process`,{method:'POST',signal:abort.signal});showJob();schedulePoll();
  }catch(error){if(!disposed){busy=false;reportError(root,error.message||'Não foi possível iniciar a reconstrução. Verifique o motor local.');updateSelection();}}
 }
 const change=async event=>{if(event.target.matches('[data-photo-history]')&&event.target.value&&!busy){try{clearTimeout(pollTimer);job=await localRequest('/api/scans/'+event.target.value,{signal:abort.signal});showJob();schedulePoll();}catch(error){reportError(root,error.message);}return;}if(event.target===selector){chooseFiles([...selector.files]);selector.value='';}};
 const click=async event=>{
  const remove=event.target.closest('[data-remove-photo]');if(remove&&!busy){files.splice(Number(remove.dataset.removePhoto),1);updateSelection();return;}
  if(event.target.closest('[data-photo-clear]')&&!busy){files=[];updateSelection();}
  if(event.target.closest('[data-photo-start]'))process();
  if(event.target.closest('[data-photo-cancel]')&&job){try{event.target.disabled=true;job=await localRequest(`/api/scans/${job.id}/cancel`,{method:'POST'});busy=false;showJob();updateSelection();}catch(error){reportError(root,error.message);}}
  if(event.target.closest('[data-photo-download]')&&job?.status==='completed'){try{const response=await localRequest(`/api/scans/${job.id}/model`,{raw:true});download(await response.blob(),'localiza-fotos.'+job.format);}catch(error){reportError(root,error.message);}}
  if(event.target.closest('[data-photo-use]')&&job?.status==='completed'){try{associatePhotoModel(state.building,state.floor,job);location.href=go('mapa',`?edificio=${encodeURIComponent(state.building)}&andar=${encodeURIComponent(state.floor)}&fonte=fotos`);}catch(error){reportError(root,'Não foi possível associar o resultado: '+error.message);}}
 };
 const dragover=event=>{event.preventDefault();drop.classList.add('is-dragging');};
 const dragleave=()=>drop.classList.remove('is-dragging');
 const dropFiles=event=>{event.preventDefault();drop.classList.remove('is-dragging');chooseFiles([...event.dataTransfer.files]);};
 const key=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selector.click();}};
 root.addEventListener('click',click);root.addEventListener('change',change);drop.addEventListener('dragover',dragover);drop.addEventListener('dragleave',dragleave);drop.addEventListener('drop',dropFiles);drop.addEventListener('keydown',key);checkEngine();
 return()=>{disposed=true;abort.abort();clearTimeout(pollTimer);clearURLs();viewer?.dispose();root.removeEventListener('click',click);root.removeEventListener('change',change);drop.removeEventListener('dragover',dragover);drop.removeEventListener('dragleave',dragleave);drop.removeEventListener('drop',dropFiles);drop.removeEventListener('keydown',key);};
}
