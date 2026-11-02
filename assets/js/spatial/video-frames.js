import {VIDEO_LIMITS,frameTimes} from './video-model.js';
const abortError=()=>new DOMException('Operação interrompida.','AbortError');
export function videoEvent(video,event,signal,timeout=10000){return new Promise((resolve,reject)=>{const end=error=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',failed);signal?.removeEventListener('abort',cancel);error?reject(error):resolve();},ok=()=>end(),failed=()=>end(new Error('O navegador não decodificou este vídeo. Exporte-o como MP4/H.264 ou WebM e tente novamente.')),cancel=()=>end(abortError()),timer=setTimeout(()=>end(new Error('O vídeo demorou a responder. Tente um arquivo menor ou em outro formato.')),timeout);video.addEventListener(event,ok,{once:true});video.addEventListener('error',failed,{once:true});signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();});}
export async function seekVideo(video,time,signal){if(signal?.aborted)throw abortError();if(Math.abs(video.currentTime-time)<.015&&video.readyState>=2)return;const ready=videoEvent(video,'seeked',signal);video.currentTime=time;await ready;if(video.readyState<2)await videoEvent(video,'loadeddata',signal);}
export async function extractFrames(video,{signal,duration=video.duration,onProgress=()=>{}}={}){
 const times=frameTimes(duration),canvas=document.createElement('canvas');const ratio=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.round(video.videoWidth*ratio);canvas.height=Math.round(video.videoHeight*ratio);
 if(Math.min(canvas.width,canvas.height)<240)throw new Error('O vídeo é pequeno demais. Use pelo menos 240 px em cada lado.');
 const context=canvas.getContext('2d',{willReadFrequently:true}),probe=document.createElement('canvas');probe.width=64;probe.height=48;const sample=probe.getContext('2d',{willReadFrequently:true});
 const frames=[];let previous=null;video.pause();
 for(let index=0;index<times.length;index++){
  if(signal?.aborted)throw abortError();await seekVideo(video,times[index],signal);context.drawImage(video,0,0,canvas.width,canvas.height);sample.drawImage(video,0,0,64,48);const rgba=sample.getImageData(0,0,64,48).data;let difference=0,sum=0,square=0;
  for(let p=0;p<rgba.length;p+=4){const gray=(rgba[p]+rgba[p+1]+rgba[p+2])/3;sum+=gray;square+=gray*gray;if(previous)difference+=Math.abs(gray-(previous[p]+previous[p+1]+previous[p+2])/3);}
  const count=rgba.length/4,variance=square/count-(sum/count)**2;
  if(variance>12&&(!previous||difference/count>.6)){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));if(!blob)throw new Error('Não foi possível extrair os quadros do vídeo.');frames.push({blob,time:times[index]});previous=new Uint8ClampedArray(rgba);
  }
  onProgress({index:index+1,total:times.length,accepted:frames.length});
 }
 if(frames.length<VIDEO_LIMITS.minFrames)throw new Error('O vídeo tem poucos pontos de vista diferentes ou está muito escuro. Caminhe pelo cômodo, incluindo os quatro lados. Você também pode informar as medidas.');
 return frames;
}
