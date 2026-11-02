import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmls=['index.html','criar-organizacao','conta-principal','finalizar-cadastro','acessar','painel','informacoes','mapa','ambientes','mapeamento','editor','departamentos','membros','relatorios','administracao'].map((name,i)=>i===0?name:`paginas/${name}.html`);
let count=0;
for(const rel of htmls){
 const html=await readFile(path.join(base,rel),'utf8');
 if(!html.includes('data-page=')||!(/assets\/js\/(?:main|front\/app)\.js/.test(html)))throw new Error(`Página inválida: ${rel}`);
 const spatial=['mapa','ambientes','editor','relatorios'].some(name=>rel===`paginas/${name}.html`);
 if(!spatial&&!html.includes('assets/js/front/app.js'))throw new Error(`Prévia do front não conectada: ${rel}`);
 count++;
}
for(const rel of ['assets/css/styles.css','assets/css/home.css','assets/js/main.js','assets/js/data.js','assets/img/favicon.svg','assets/media/localiza-background.mp4','AGENTS.md','docs/PROMPT-PARA-CODEX.md']){await access(path.join(base,rel));count++}
console.log(`OK — ${count} verificações de existência e HTML concluídas.`);
