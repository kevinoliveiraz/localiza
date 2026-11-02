export const API='http://127.0.0.1:5175';
export async function localRequest(route,{method='GET',body,signal,raw=false}={}){
 const headers={};if(method!=='GET')headers['X-Localiza-Client']='localiza-editor-v1';
 if(body&&!(body instanceof Blob)&&!(body instanceof ArrayBuffer)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const response=await fetch(API+route,{method,headers,body,signal,credentials:'omit'});
 if(raw){if(!response.ok)throw new Error('O arquivo do modelo não está disponível.');return response;}
 let value;try{value=await response.json()}catch{throw new Error('O motor local não respondeu corretamente.');}
 if(!response.ok)throw new Error(value.error||'A operação local não foi concluída.');return value;
}
export function download(data,name,type='application/octet-stream'){
 const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function reportError(root,message){const element=root.querySelector('[data-spatial-error]');if(element){element.textContent=message||'';element.hidden=!message;}}
export async function engineHealth(signal){return localRequest('/api/health',{signal:signal||AbortSignal.timeout(5000)});}
