import {I,esc} from '../ui.js';
import {fitPath,toCanvas,CUES,pointName} from './model.js?v=20261104-search';
export const metres=value=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(value)+' m';
export function cueIcon(cue,size=18){
 const paths={left:'M19 19v-7a4 4 0 0 0-4-4H5m5-5L5 8l5 5',right:'M5 19v-7a4 4 0 0 1 4-4h10m-5-5 5 5-5 5','stairs-up':'M3 20h5v-5h5v-5h5V5h4M4 9V3h6M4 3l7 7','stairs-down':'M3 20h5v-5h5v-5h5V5h4M4 3v6h6M4 9l7-7'};
 return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[cue]||paths.left}"/></svg>`;
}
export function pathMarkup(points,{finished=true,frame=null,editable=false,selected=-1,unit=1}={}){
 const positions=frame?points.map(p=>toCanvas(p,frame)):fitPath(points).positions;
 const path=positions.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
 const mark=(p,label,kind)=>`<g transform="translate(${p.x},${p.y})" class="route-mark ${kind}"><circle r="15"/><text text-anchor="middle" dy="5">${label}</text></g>`;
 const handles=editable?positions.map((p,i)=>`<g class="route-handle ${i===selected?'is-selected':''} ${i===0?'is-start':i===points.length-1?'is-end':''}" transform="translate(${p.x},${p.y})" data-route-point="${i}" role="button" tabindex="0" aria-label="${pointName(i,points.length)}${points[i].cue?'. '+CUES[points[i].cue]:''}. Arraste ou use as setas para mover."><circle class="route-handle-hit" r="${24*unit}"/><circle class="route-handle-dot" r="${11*unit}"/><text text-anchor="middle" dy="${4*unit}" style="font-size:${12*unit}px">${i===0?'A':i===points.length-1?'B':i}</text></g>`).join(''):positions.length?mark(positions[0],'A','is-start')+(positions.length>1?mark(positions.at(-1),finished?'B':'','is-end'):''):'';
 const signs=points.flatMap((p,i)=>p.cue&&CUES[p.cue]?[`<g class="route-cue" transform="translate(${Math.min(792-28*unit,positions[i].x+24*unit)},${Math.max(8,positions[i].y-34*unit)})" aria-label="${CUES[p.cue]}"><rect width="${28*unit}" height="${28*unit}" rx="${7*unit}"/>${cueIcon(p.cue,20*unit).replace('<svg ','<svg x="'+4*unit+'" y="'+4*unit+'" ')}</g>`]:[]).join('');
 return `${path?`<path class="route-corridor" d="${path}"/><path class="route-line" d="${path}"/>`:''}${signs}${handles}`;
}
export function routeMap(points,options={}){
 return `<svg class="route-svg" viewBox="0 0 800 ${options.editable?640:480}" role="${options.editable?'group':'img'}" aria-label="${options.editable?'Editor do percurso. Arraste os pontos para ajustar.':'Percurso em duas dimensões, visto de cima'}" ${options.editable?'tabindex="0"':''}><g data-route-drawing>${pathMarkup(points,{unit:2,...options})}</g></svg>`;
}
export function routeResult(route,{backTo='mapas'}={}){
 return `<article class="route-result surface" data-route-result><span class="route-result-icon">${I('compass',23)}</span><div class="route-result-copy"><span class="route-result-type">ROTA · ${metres(route.distance)} estimados</span><h2>${esc(route.title)}</h2><p>${esc(route.start)} ${I('arrow',14)} ${esc(route.end)}</p></div><a class="btn btn-primary" href="#navegar/${encodeURIComponent(route.id)}?voltar=${encodeURIComponent(backTo)}" aria-label="Iniciar rota: ${esc(route.title)}">${I('compass',17)} Iniciar rota</a></article>`;
}
export function list(routes,admin,draft=false,search=''){
 return `<section class="info-heading"><div><p class="eyebrow">ROTAS</p><h1>Aonde você quer ir?</h1><p>Busque pelo nome ou escolha uma rota para iniciar.</p></div>${admin?`<a href="#criar-mapa" class="btn btn-primary">${I('plus',17)} Criar percurso</a>`:''}</section>${search?`<div class="route-list-search">${search}</div>`:''}${admin&&draft?`<a href="#criar-mapa" class="route-resume-draft surface">${I('edit',20)}<span><strong>Continue de onde parou.</strong><small>Seu rascunho está preservado nesta aba.</small></span>Retomar ${I('arrow',17)}</a>`:''}${routes.length?`<div class="route-result-list">${routes.map(route=>routeResult(route)+(admin?`<details class="route-manage-link"><summary>Gerenciar rota</summary><a href="#percurso/${encodeURIComponent(route.id)}">Ver detalhes e editar ${I('arrow',14)}</a></details>`:'')).join('')}</div>`:`<section class="route-empty surface"><span class="route-empty-icon">${I('compass',32)}</span><h2>Nenhuma rota salva ainda.</h2><p>Depois de criar, encontre sua rota pelo nome na busca principal.</p>${admin?'<a href="#criar-mapa" class="btn btn-primary">Criar primeiro percurso '+I('arrow',17)+'</a>':'<p>Nenhum percurso foi salvo neste navegador.</p>'}</section>`}<p class="route-local-note route-list-note">${I('monitor',15)} Rotas salvas apenas neste navegador.</p>`;
}
export function workspace(route=null){
 return `<a class="back-link" href="${route?'#percurso/'+encodeURIComponent(route.id):'#mapas'}">${I('left',16)} ${route?'Voltar ao percurso':'Meus percursos'}</a><section class="info-heading route-heading"><div><p class="eyebrow">${route?'EDITAR PERCURSO':'NOVO PERCURSO'}</p><h1>${route?'Ajuste cada ponto.':'Um caminho. Dois pontos.'}</h1><p>Toque para criar. Arraste para ajustar. Marque as curvas e escadas.</p></div><span class="route-view-label">${I('map',16)} Vista de cima · 2D</span></section>
 <section class="route-workspace surface" data-route-workspace>
 <div class="route-controls">
  <div class="route-mode" role="group" aria-label="Como criar o percurso"><button type="button" data-route-mode="motion" aria-pressed="true">${I('compass',16)} Com o celular</button><button type="button" data-route-mode="manual" aria-pressed="false">${I('edit',16)} Desenhar</button></div>
  <div class="route-active-summary" data-route-active-summary hidden><p data-route-mobile-summary></p><button type="button" class="route-small-button" data-route-action="details" aria-expanded="false">${I('edit',15)} Editar nomes</button></div>
  <form id="route-create-form" data-route-form>
   <label class="route-name-field">Nome da rota <span class="front-optional">opcional</span><input name="title" maxlength="90" placeholder="Ex.: Caminho para a sala de reuniões" autocomplete="off"/></label>
   <label class="route-name-field"><span class="route-point-label"><b>A</b> De onde você sai?</span><input name="start" maxlength="90" placeholder="Ex.: Entrada principal" required autocomplete="off"/></label>
   <label class="route-name-field"><span class="route-point-label"><b>B</b> Aonde quer chegar?</span><input name="end" maxlength="90" placeholder="Ex.: Sala de reuniões" required autocomplete="off"/></label>
   <div class="route-method-copy" data-route-help></div>
   <details class="route-calibration" data-route-calibration><summary>Ajustar tamanho do passo</summary><label>Comprimento médio do passo (m)<input name="stepLength" type="number" min="0.3" max="1.2" step="0.01" value="0.70" inputmode="decimal"/></label><p>Altera a escala estimada. Padrão: 70 cm.</p></details>
   <p class="route-error" data-route-error role="alert" hidden></p><div class="route-actions" data-route-actions></div>
  </form><p class="route-capture-note" data-route-limitation></p>
 </div>
 <div class="route-canvas-wrap">
  <header class="route-canvas-header"><span class="route-capture-status" data-route-status role="status">Pronto para começar</span><button type="button" class="route-small-button" data-route-action="fit">${I('expand',16)} Enquadrar</button></header>
  <div class="route-editor-toolbar" data-route-editor-toolbar hidden><span>Toque para adicionar. Arraste os círculos.</span><div><button type="button" data-route-action="undo" aria-label="Desfazer alteração">${I('left',17)}</button><button type="button" data-route-action="redo" aria-label="Refazer alteração">${I('arrow',17)}</button></div></div>
  <div class="route-canvas" data-route-canvas>${routeMap([])}<div class="route-canvas-placeholder" data-route-placeholder><span>${I('pin',27)}</span><strong>O caminho aparece aqui.</strong><p>Apenas seu percurso, visto de cima.</p></div></div>
  <div class="route-point-editor" data-route-point-editor hidden>
   <div class="route-selected-row"><div><button type="button" data-route-action="previous-point" aria-label="Selecionar ponto anterior">${I('left',17)}</button><strong data-route-selected-name></strong><button type="button" data-route-action="next-point" aria-label="Selecionar próximo ponto">${I('arrow',17)}</button></div><button type="button" data-route-action="remove-point" class="route-small-button">${I('trash',15)} Remover</button></div>
   <label>Marcar neste ponto<select data-route-cue aria-label="Sinalização do ponto"><option value="">Sem marcação</option><option value="left">↶ Vire à esquerda</option><option value="right">↷ Vire à direita</option><option value="stairs-up">↗ Escada — subir</option><option value="stairs-down">↘ Escada — descer</option></select></label>
  </div>
  <div class="route-continue-tools" data-route-continue-tools hidden><div><strong>Continuar do último ponto</strong><label>Trecho <input type="number" min="0.3" max="30" step="0.1" value="2" inputmode="decimal" data-route-segment-length aria-label="Comprimento do próximo trecho em metros"/> m</label></div><div class="route-segment-buttons"><button type="button" data-route-segment="straight">↑ Reto</button><button type="button" data-route-segment="left">${cueIcon('left')} Esquerda</button><button type="button" data-route-segment="right">${cueIcon('right')} Direita</button></div></div>
  <footer class="route-canvas-footer"><div><strong data-route-distance>0 m</strong><span>distância estimada</span></div><div><strong data-route-count>0</strong><span>pontos do percurso</span></div><span>Corredor esquemático<br>Largura ilustrativa</span></footer>
 </div>
 <div class="route-mobile-actions route-actions" data-route-mobile-actions></div>
 <p class="route-draft-status" data-route-draft-status role="status"></p>
 </section>`;
}
export function detail(route,admin){
 const cues=route.points.flatMap((p,index)=>p.cue?[{...p,index}]:[]);
 return `<a class="back-link" href="#mapas">${I('left',16)} Rotas</a><section class="info-heading route-heading"><div><p class="eyebrow">ROTA SALVA</p><h1>${esc(route.title)}</h1><p>Encontre esta rota pelo nome na busca principal.</p></div><a class="btn btn-primary" href="#navegar/${encodeURIComponent(route.id)}">${I('compass',17)} Iniciar rota</a></section><section class="route-saved surface"><header class="route-saved-header"><span><b>A</b>${esc(route.start)}</span>${I('arrow',18)}<span><b>B</b>${esc(route.end)}</span></header><div class="route-saved-canvas">${routeMap(route.points)}</div><footer><strong>${metres(route.distance)} <small>estimados</small></strong><span>Salva neste navegador</span></footer></section>${cues.length?`<details class="route-directions surface"><summary>Ver orientações do caminho ${I('chevron',15)}</summary><ol>${cues.map(p=>`<li>${cueIcon(p.cue)}<span><strong>${CUES[p.cue]}</strong><small>${pointName(p.index,route.points.length)}</small></span></li>`).join('')}</ol></details>`:''}${admin?`<details class="route-management surface"><summary>Gerenciar rota ${I('chevron',15)}</summary><div><a class="btn btn-secondary" href="#editar-percurso/${encodeURIComponent(route.id)}">${I('edit',17)} Editar percurso</a><details class="route-delete"><summary>Excluir percurso</summary><p>Remover deste navegador?</p><button class="btn btn-secondary" type="button" data-route-delete="${esc(route.id)}">Sim, excluir percurso</button><p data-route-delete-error role="alert" hidden></p></details></div></details>`:''}`;
}
