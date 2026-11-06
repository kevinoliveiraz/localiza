# Rota em 3D

Entrega de 06/11/2026, solicitada pelo responsável. A navegação e os detalhes de uma rota salva abrem em **3D**, com um seletor **2D / 3D** sobre o mapa. O editor continua em 2D para desenhar e ajustar os pontos. A busca e as ferramentas mantêm a organização anterior.

## Comportamento

- O traçado salvo gera geometria 3D real no navegador: piso do corredor, linha, saída A, destino B e seta da posição. O corredor tem largura e espessura ilustrativas. Sinais de escadas são marcadores; não se inferem alturas de andares a partir dos pontos 2D.
- Antes de iniciar, a câmera enquadra o percurso inteiro em perspectiva. Durante o automático, acompanha a posição estimada e a direção do topo do celular. **Ver mapa inteiro** alterna entre acompanhamento e visão geral também no 3D.
- Mudar 2D/3D preserva posição, progresso, sensores, pausa, alinhamento e sentido. Não edita a rota salva. O botão **Alinhar** e seu ajuste automático continuam disponíveis.
- A prévia de detalhes usa o mesmo visualizador, sem iniciar sensores. As miniaturas da lista e o editor permanecem em 2D.
- Se o dispositivo não oferece WebGL 2 ou perde o contexto gráfico, a tela retorna ao 2D, mostra uma mensagem e permite continuar o percurso.

## Implementação e limites

`route-viewer.js` coordena o seletor e carrega `route-3d.js` sob demanda. `route-scene.js` converte os segmentos locais em malhas instanciadas usando o Three.js já distribuído no projeto. Não há CDN, pacote novo, serviço externo, câmera ou reconstrução de ambientes.

A renderização ocorre ao mudar posição/direção, tema ou tamanho; não existe laço de animação contínuo enquanto parado. A densidade de pixels é limitada para reduzir carga no celular. Ao sair, materiais, geometrias, instâncias, observadores e contexto WebGL são liberados. Importações tardias não montam uma cena depois do descarte.

O 3D muda a apresentação do percurso. A localização continua sendo a estimativa experimental por passos e bússola; não há GPS indoor preciso, recálculo ou reconstrução do prédio. As chaves de armazenamento, a geometria 2D e os percursos existentes permanecem compatíveis.

## Validação

`npm run check` inclui `scripts/route-3d-check.mjs`, com geometria, coordenadas locais, enquadramento em diferentes proporções, trajetos longos/curtos, curvas, escadas, inversão, progresso e descarte. A integração DOM testa troca de dimensão sem reiniciar, falha de WebGL e importação tardia com renderer e sensores explicitamente simulados. A renderização WebGL também é conferida no navegador em telas de celular e desktop e nos dois temas. Não equivale a validar uma caminhada física.

A versão pública dos arquivos é `20261106-route3d`. Publicação pelo workflow existente, conforme `16-PUBLICACAO-GITHUB-PAGES.md`.
