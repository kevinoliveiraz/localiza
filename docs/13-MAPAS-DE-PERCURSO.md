# Mapas de percurso — 02/11/2026

## Atualização de 03/11/2026 — edição por toque

A primeira experiência móvel só acrescentava pontos e bloqueava o desenho ao concluir. Agora:

- Arrastar A, B ou uma curva reposiciona aquele ponto. A captura do gesto usa Pointer Events; um gesto cancelado restaura a posição anterior, sem acrescentar pontos. A página continua rolável fora do quadro.
- Tocar na linha insere uma curva entre dois pontos. Tocar no espaço vazio acrescenta o próximo ponto. Os botões Reto/Esquerda/Direita continuam a partir do último ponto com um comprimento escolhido (referência visual), incluindo a quebra de 90°.
- O ponto selecionado pode receber `Vire à esquerda`, `Vire à direita`, `Escada — subir` ou `Escada — descer`. A sinalização acompanha o ponto ao mover/inserir/remover outros pontos e aparece também no mapa salvo e na lista de orientações. É uma indicação manual; não detecta escadas nem liga andares automaticamente.
- A revisão possui **Voltar à edição**. A tela de um mapa salvo possui **Editar percurso**, pela rota `#editar-percurso/ID`; salvar atualiza o mesmo ID e preserva a data de criação. Uma edição concorrente em outra aba é detectada antes de sobrescrever.
- Há desfazer/refazer, remoção de pontos e retorno aos nomes de A/B. No teclado, selecione um círculo e use as setas para mover (Shift amplia o passo); Enter seleciona e Delete remove. No quadro vazio, setas e Enter criam pontos.
- O rascunho é preservado nesta aba ao sair da tela ou recarregar. Em Mapas aparece **Continue de onde parou**. `sessionStorage` usa uma chave separada, `localiza_route_drafts_v1`; fechar a aba encerra esse rascunho. O mapa salvo continua em `localiza_route_maps_v1`, com o mesmo formato compatível e `cue` opcional em cada ponto. Falha de armazenamento é informada. A captura física não reinicia automaticamente ao retomar um rascunho.
- Ao ajustar uma caminhada, pontos intermediários alinhados são simplificados, preservando A/B, curvas e sinalizações, e o resultado é identificado como caminhada com ajustes manuais. Isso não aumenta a precisão dos sensores.

Os recursos alterados têm a versão `20261103-editor` na URL para evitar misturar arquivos novos com o cache da versão anterior no celular. A publicação continua no GitHub Pages em HTTPS.

Validação da atualização: 201 verificações de geometria/dados/permissões e 36 verificações DOM de arraste, cancelamento, inserção, marcação, revisão, rascunho e atualização sem duplicar, além da integração da navegação do app. `npm run check` passou na pasta principal após a aplicação da atualização. O controle do navegador foi desativado nas configurações Work durante esta atualização; o harness DOM não valida layout, toque físico ou sensores reais. Essas verificações permanecem para o teste no telefone.

O responsável substituiu a criação complexa de ambientes por um percurso A → B em corredores internos. A saída principal agora é uma linha em 2D vista de cima, com uma faixa ilustrativa de corredor. Não há salas, móveis, texturas, vídeo, câmera ou reconstrução 3D neste fluxo. O editor 3D anterior continua nas ferramentas secundárias da Administração.

## Fluxo implementado no front

Abra **Mapas → Criar percurso**, informe a saída e o destino e escolha:

- **Com o celular**: autorize movimento, segure a tela para cima, espere a direção e caminhe com o aparelho na mesma posição. Picos de aceleração estimam passos; a orientação estima as curvas. O primeiro ponto vira a origem local A. Ao chegar, conclua em B, revise e salve.
- **Desenhar**: marque A no quadro, acrescente os pontos das curvas e conclua. Há desfazer e operação por teclado: setas movem o cursor, Enter acrescenta um ponto. É um desenho manual identificado, sem simular captura física.

A captura pode ser pausada e retomada a partir do mesmo ponto. Ao ocultar a página, ela pausa. Ao sair da tela, os sensores são desligados. Sem permissão, direção ou movimento válido, o aplicativo informa o problema e não gera deslocamentos. O comprimento do passo pode ser ajustado antes de começar (padrão 0,70 m).

Os percursos salvos reaparecem após recarregar a página; podem ser consultados e excluídos neste navegador. Os perfis existentes continuam sendo uma simulação; não há autorização real nem compartilhamento entre aparelhos.

## Limites da captura automática

**Experimental, sem validação de caminhada física nesta entrega.** Não é GPS indoor, SLAM, medição arquitetônica ou navegação em tempo real. Passos podem ser perdidos ou contados a mais, e o rumo pode sofrer interferência e deriva. A largura da faixa é ilustrativa; não representa a largura do corredor. A distância é estimada pelo número de passos, não uma medida independente.

É necessário um celular/navegador com eventos de movimento e orientação, HTTPS e permissão. `localhost` no computador pode ser considerado seguro, mas não oferece sensores de celular. Abrir um IP da rede local por HTTP no telefone não atende à exigência de contexto seguro. O servidor local atual continua vinculado a `127.0.0.1`; esta etapa não publica o app nem configura HTTPS. Uma sessão física exige hospedar a mesma interface em HTTPS acessível ao telefone. Não orientar a desativar proteções do navegador.

Antes de tratar como captura confiável, testar um corredor de comprimento conhecido e curvas conhecidas em aparelhos Android e iPhone, comparar rumo e distância e registrar erros. Se a precisão necessária não for alcançada, avaliar rastreamento visual/inercial nativo numa etapa própria.

## Dados e módulos

- `assets/js/routes/model.js`: polilinha local, distância, ajuste ao quadro e detecção experimental de passos/direção.
- `capture.js`: permissões e assinatura/liberação de eventos do navegador, com detecção de ausência de dados.
- `controller.js`: estados de criação, desenho, pausa, conclusão e salvamento.
- `views.js` e `assets/css/routes.css`: lista, criação responsiva e mapa salvo.
- `store.js`: chave local `localiza_route_maps_v1`, até 40 percursos e 6.000 pontos por percurso. Armazena somente coordenadas locais x/y e metadados; não grava latitude/longitude, imagens ou logs brutos dos sensores. Não envia os percursos a um serviço.

Entrada canônica: `/#mapas`; `paginas/mapeamento.html` abre a mesma lista. Tudo continua somente frontend. Os módulos de informações e a página inicial com vídeo foram preservados.

## Verificação

`npm run check:routes` verifica geometria, ruído parado, passos, curva de 90°, rumo desatualizado, origem relativa, dados inválidos, armazenamento indisponível, escape de conteúdo, permissões negadas e liberação idempotente de sensores com um alvo de eventos explicitamente falso. Esses testes não substituem a validação física. O fluxo manual deve ser verificado no navegador em desktop/celular e após recarregar.

Validação desta entrega: `npm run check` passou na pasta principal, incluindo 168 verificações do módulo de percursos. No Chrome, foram conferidos toque, teclado, curvas, desfazer, concluir, salvar e reabrir após recarregar; também foram revisados temas claro/escuro e largura de 390 px sem rolagem horizontal. O teste em computador sem sensores ficou em 0 m e pausou com aviso. O exemplo visual salvo chama-se **Teste manual**, não representa uma caminhada capturada. A criação foi aberta em `http://localhost:5173/#criar-mapa` na versão principal. Nenhuma validação física em telefone foi realizada.

Referências de API: [eventos de orientação e movimento](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events), [permissão de orientação](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static), [permissão de movimento](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static).
