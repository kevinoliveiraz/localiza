import {rooms} from '../store.js';
import {I,esc,iconTile} from '../ui.js';
export function videoWorkspace(state){const room=rooms().find(item=>item.id===state.roomId);return `
 <ol class="video-steps" aria-label="Etapas do modelo por vídeo"><li class="is-active" data-video-step="1"><span>01</span> Vídeo do ambiente</li><li data-video-step="2"><span>02</span> Conferir estrutura</li><li data-video-step="3"><span>03</span> Ajustar no editor</li></ol>
 <div class="video-workspace"><section class="surface video-capture-panel">
 <div class="photo-section-title">${iconTile('video','sky')}<div><h2>Mostre o espaço em vídeo.</h2><p>Caminhe pelo cômodo, mostrando os quatro lados.</p></div></div>
 <label class="video-file-drop" data-video-drop>${I('upload',26)}<strong>Escolher vídeo</strong><span>MP4, WebM ou MOV compatível · até 3 min / 400 MB</span><input data-video-file type="file" accept="video/mp4,video/webm,video/quicktime,video/*"/></label>
 <div class="video-capture-actions"><button class="btn btn-secondary btn-small" data-video-record>${I('camera',16)} Gravar com a câmera</button><button class="btn btn-secondary btn-small" data-video-stop hidden>Encerrar gravação</button><button class="text-link" data-video-remove hidden>Trocar vídeo</button></div>
 <p class="video-source-info" data-video-info role="status">Seu vídeo será aberto somente neste computador.</p>
 <div class="video-source-stage" data-video-source-stage hidden><video data-video-preview controls playsinline preload="metadata" aria-label="Vídeo do ambiente"></video><span data-recording-clock class="recording-clock" hidden></span></div>
 <div class="video-frame-strip" data-video-frames aria-label="Quadros de referência do vídeo"></div>
 <details class="capture-guide"><summary>Como gravar ${I('chevron',16)}</summary><ol><li>Comece com um único cômodo e caminhe devagar.</li><li>Mostre paredes, cantos e encontros com o piso. Mantenha o celular na vertical.</li><li>Desloque-se entre as posições: girar a câmera de um único ponto não basta.</li><li>Evite pessoas, espelhos, movimentos rápidos e mudanças de iluminação.</li></ol><p>A primeira análise procura cômodos retangulares. Contornos diferentes podem ser desenhados no editor.</p></details>
 <div class="video-engine-status"><span class="live-dot"></span><span data-video-engine>Verificando a análise local…</span></div>
 <button class="btn btn-primary btn-full" data-video-analyze disabled>${I('layers',18)} Sugerir estrutura pelo vídeo</button>
 <button class="btn btn-secondary btn-full video-guided-button" data-video-guided disabled>Montar com minhas medidas ${I('arrow',16)}</button>
 <p class="video-privacy">${I('lock',15)} O vídeo e os quadros são processados localmente. Nenhum serviço pago ou envio para terceiros.</p>
 <details class="runtime-help" data-video-runtime-help hidden><summary>Iniciar a análise local</summary><p>Na pasta do projeto, execute <code>npm run dev</code>. Na primeira instalação, use <code>npm run setup:video</code>.</p></details>
 </section><section class="surface video-model-panel">
 <div class="photo-result-heading"><div><span class="eyebrow">MODELO SIMPLIFICADO</span><h2 data-video-result-title>Do vídeo para a estrutura.</h2></div><span class="subtle-tag" data-video-status>Aguardando vídeo</span></div>
 <div class="video-model-stage" data-video-model><div class="video-model-placeholder">${I('cube',58)}<strong>O mesmo estilo do editor.</strong><p>Piso, paredes e cores limpas. Depois, ajuste portas, janelas e móveis.</p></div></div>
 <div class="video-progress" data-video-progress hidden><progress data-video-progress-bar max="100" value="0" hidden></progress><p data-video-progress-message role="status"></p><ol data-video-stage-list></ol><button class="text-link" data-video-cancel>Interromper análise</button></div>
 <form class="video-review" data-video-review hidden>
 <div class="video-review-intro"><h3>Confira antes de criar.</h3><p data-video-review-copy>Informe as medidas do ambiente que aparece no vídeo.</p></div>
 <label class="video-review-name">Nome do ambiente<input name="name" maxlength="100" required value="${esc(room?.name||'Novo ambiente')}"/></label>
 <div class="video-dimensions"><label>Largura medida (m)<input name="width" type="number" min="1" max="50" step=".01" required placeholder="Ex.: 5,00"/></label><label>Comprimento (m)<input name="depth" type="number" min="1" max="50" step=".01" required placeholder="Ex.: 4,00"/></label><label>Altura das paredes (m)<input name="height" type="number" min="1" max="8" step=".01" required value="2.8"/></label></div>
 <p class="video-review-note" data-video-dimension-note>Use medidas conferidas no local. O vídeo não fornece escala física sozinho.</p>
 <label class="video-confirm-dimensions"><input name="confirmed" type="checkbox" required/> Conferi as medidas e vou revisar portas e janelas no editor.</label>
 <div class="video-review-actions"><span data-video-area></span><button type="submit" class="btn btn-primary" data-video-continue disabled>Continuar no editor ${I('arrow',17)}</button></div>
 </form><p class="spatial-error" data-spatial-error role="alert" hidden></p>
 </section></div>`;}
