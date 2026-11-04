# Navegação automática por passos e bússola — 03/11/2026

O responsável testou a navegação anterior e esclareceu que precisa andar sem clicar em botões a cada ponto, usando o topo físico do celular como frente. Essa instrução substitui o bloqueio manual de curvas/escadas/chegada da entrega anterior.

## Como usar

1. Abra um mapa salvo em **Mapas → Iniciar percurso**. O padrão agora é **Automático · passos e bússola**.
2. Vá fisicamente à saída e aponte o topo do aparelho para a direção do primeiro trecho. Use o celular em retrato, com a tela voltada para cima. Toque em **Topo alinhado · Iniciar** e autorize os sensores quando solicitado.
3. Aguarde uma leitura estável da direção antes de caminhar. Os passos deslocam a estimativa e o giro do topo muda a direção, inclusive parado. Girar sem caminhar não aumenta a distância.
4. O mapa acompanha a direção com a seta à frente. **Ver mapa inteiro** alterna para a vista geral. Curvas e chegada estimada avançam automaticamente, sem botão em cada ponto.
5. **Pausar percurso** libera sensores e tela ativa. Para **Reorientar**, volte à linha do trecho atual, aponte o topo na direção desse trecho e use o botão de reorientação. Ele estabelece uma nova referência nesse ponto do mapa, não encontra o aparelho sozinho.
6. **Guia manual** continua disponível como alternativa quando os sensores não funcionarem. Nesse modo, somente as confirmações movem o marcador.

## Como funciona

`auto-guidance.js` integra cada passo como um deslocamento x/y na direção do topo, usando a orientação inicial para alinhar as coordenadas locais do desenho. A referência é o topo físico (+Y do dispositivo); não se soma a rotação da tela. Usa a bússola quando o navegador fornece orientação absoluta e aceita orientação relativa como referência local quando disponível. Os graus mostrados são do mapa alinhado, não o norte geográfico do prédio.

O progresso é associado apenas aos segmentos próximos da posição estimada e da distância já percorrida, com verificação da direção e limite de avanço por passo. Uma correção pequena pode reduzir deriva perto de um segmento compatível; a estimativa não é teletransportada para um trecho distante. Direção incompatível ou afastamento estimado do traçado gera aviso. Não há deslocamento por relógio, orientação faltante ou leitura de inclinação/precisão inválida. Eventos de uma captura antiga são descartados.

O modo automático não usa os estados de confirmação do guia manual. A estimativa cruza curvas e anotações de escada enquanto caminha e indica chegada ao alcançar a vizinhança do destino no desenho. Uma anotação de escada é uma orientação cadastrada: não mede altura, degraus, andares ou posição vertical.

Ao pausar, chegar, sair ou ocultar a página, os sensores são desligados. Uma referência de orientação que muda durante a sessão pausa e pede reorientação, evitando um salto de direção. Quando suportado e permitido, a navegação tenta manter a tela acesa com Screen Wake Lock; libera esse recurso ao parar. Isso não altera configurações do sistema. Se a API falhar, a navegação não é bloqueada.

## Limites

**Estimativa experimental, sem validação física nesta entrega.** Acelerômetro e direção podem acumular deriva, perder/contar passos extras e sofrer interferência. É necessário manter o topo apontado na direção em que se anda. A escala do desenho e o tamanho do passo afetam o resultado; um desenho sem medidas reais não se torna uma planta medida. Não existe posicionamento indoor absoluto, identificação real do corredor, recálculo de outro caminho ou reconhecimento de escadas. O aviso de afastamento compara uma estimativa com o desenho, não determina onde a pessoa está no prédio. A chegada é estimada e deve ser conferida no local.

Tudo continua frontend. O percurso salvo não é alterado pela navegação; coordenadas estimadas e leituras dos sensores não são enviadas ou persistidas. Mapas e rascunhos já existentes mantêm suas chaves e formatos. O modo manual conserva o fluxo anterior. Os recursos novos usam a versão `20261103-compass` para evitar cache antigo no celular.

## Validação

- `npm run check:compass`: 83 verificações de topo/direção, giro parado, curvas e escadas sem cliques, chegada estimada, direção errada sem progresso fictício, proteção contra salto para um trecho próximo de retorno, leitura inválida/antiga, mudança de referência e liberação dos sensores com dados explicitamente de teste.
- Harness DOM externo: 50 verificações de fluxo automático, câmera seguindo direção, percurso completo sem confirmações, pausa/reorientação, permissões negadas/tardias, eventos antigos, liberação de sensores e tela ativa. Também são executadas as regressões de edição e integração do app.
- O controle do navegador está desativado nas configurações Work. Os testes DOM não verificam layout, toque ou precisão física. Uma caminhada com celular Android/iPhone, incluindo curvas e comparação com medidas conhecidas, ainda é necessária antes de tratar a estimativa como confiável.

`npm run check` passou na versão aplicada à pasta principal, incluindo regressões do front, editor, navegação e sensores.

Referências: [eixos e orientação do dispositivo](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Orientation_and_motion_data_explained), [Device Orientation and Motion](https://www.w3.org/TR/orientation-event/), [manter a tela ativa](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).