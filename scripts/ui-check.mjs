// Lightweight render smoke test without DOM libraries or network access.
// Checks the retained spatial screens and the new information views without network access.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = [
 ['mapa','paginas/mapa.html'],['ambientes','paginas/ambientes.html'],
 ['mapeamento','paginas/mapeamento.html'],['relatorios','paginas/relatorios.html'],['editor','paginas/editor.html']
];
globalThis.localStorage = {getItem(){return null},setItem(){}};
let validations=0;
for (const [page,relative] of names) {
  let html='';
  globalThis.document = {
    body:{dataset:{page,root:page==='home'?'./':'../'}},
    getElementById(){return {set innerHTML(value){html=value},get innerHTML(){return html}}},
    documentElement:{dataset:{},classList:{toggle(){}}},
    addEventListener(){},
    title:''
  };
  await import(pathToFileURL(path.join(base,'assets/js/main.js')).href+`?page=${page}`);
  if(!html.includes('<header')||!html.includes('</main>')||!html.includes('Localiza'))throw Error(`Falha ao renderizar ${page}`);
  const hrefPattern=/href="([^"]+)"/g;
  let match;
  while((match=hrefPattern.exec(html))!==null){
    const href=match[1].split(/[?#]/)[0];
    if(!href||href.startsWith('http:')||href.startsWith('https:'))continue;
    const target=path.resolve(base,path.dirname(relative),href);
    if(!target.startsWith(base+path.sep)||!fs.existsSync(target))throw Error(`Link inválido em ${page}: ${href}`);
    validations++;
  }
  validations++;
}
const views=await import('../assets/js/information/views.js');
const item={id:'item-test',title:'<img src=x onerror=alert(1)>',body:'<script>alert(1)</script>\nConteúdo livre',link:'https://example.com/',status:'published',audience:'profiles',profileIds:['aux'],updatedAt:new Date().toISOString()};
const state={session:{organization:'Teste & equipe',user:{id:'owner',name:'Admin teste',role:'owner',profileIds:[]},profiles:[{id:'aux',name:'Auxiliar',description:''}]},route:'informacoes',items:[item],record:item,people:[],profiles:[],person:null,profile:null,activity:[]};
for(const name of ['informationPage','informationForm','informationDetail','adminPage','peoplePage','personForm','profilesPage','profileForm']){
 const html=views.frame(state,views[name](state));if(!html.includes('<header')||!html.includes('</main>'))throw Error(`Falha ao renderizar ${name}`);if(html.includes('<script>alert(1)</script>')||html.includes('<img src=x'))throw Error(`Texto não escapado em ${name}`);validations++;
}
const reader={...state,session:{...state.session,user:{id:'reader',name:'Leitor teste',role:'member',profileIds:['aux']}}};
if(views.frame(reader,views.informationPage(reader)).includes('>Administração</a>'))throw Error('Menu de administração exposto ao leitor');
if(!views.authPage({configured:false}).includes('data-info-form="setup"')||!views.authPage({configured:true}).includes('data-info-form="login"'))throw Error('Entrada inválida');
console.log(`OK — ${names.length} telas espaciais, 8 novas vistas, entrada, escape de conteúdo e ${validations} verificações de interface/links.`);
