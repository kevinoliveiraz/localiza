# Iniciar percurso — 03/11/2026

O responsável pediu iniciar um percurso como em um aplicativo de mapas. O botão **Iniciar percurso** está na tela de cada mapa salvo, disponível também aos leitores da prévia. Ele abre `#navegar/ID`. A navegação é um guia do caminho já desenhado, com seta, destaque do trecho percorrido, próxima orientação, distância estimada restante, lista de etapas, pausa e chegada.

## Uso

1. Abra **Mapas**, escolha um percurso salvo e toque em **Iniciar percurso**. Para um desenho novo, revise e salve primeiro.
2. Se necessário, escolha **Inverter sentido** antes de começar. Esquerda/direita e subir/descer são invertidos no guia, sem modificar o mapa salvo.
3. Vá fisicamente até a saída indicada e confirme **Estou na saída · Iniciar**.
4. **Confirmar os pontos** é o padrão: o marcador mostra o último ponto confirmado. Ao alcançar a próxima curva, escada ou destino, confirme a orientação para prosseguir.
5. **Acompanhar pelos passos** é opcional e experimental: solicita os sensores do celular com o clique do usuário, estima a distância sobre a linha cadastrada e para no próximo ponto de decisão. É possível ajustar o comprimento do passo antes de começar. A posição estimada não atravessa curvas/escadas sem confirmação; a chegada também depende do usuário.
6. Se houver uma marcação já na saída, ela é apresentada antes do primeiro trecho. No fim, confirme a chegada para concluir. É possível voltar a Mapas ou percorrer novamente.

Ao ocultar/sair da página, os sensores param. A navegação pausa, inclusive quando a página volta pelo cache do navegador. Resultado de permissão e eventos de uma captura antiga são descartados. Se os sensores falharem, o guia pode continuar por confirmação. Não há animação simulando caminhada nem progresso por tempo.

## Limites

O guia **não determina a localização do aparelho no prédio**. O usuário precisa estar na saída correta. Por confirmação, o indicador depende dos pontos informados pelo usuário. Por passos, a estimativa avança sobre o percurso cadastrado: não identifica se a pessoa entrou em outro corredor, não detecta obstáculos nem recalcula desvios. As distâncias dependem da escala do desenho e do passo; não são medições arquitetônicas. Escadas e viradas explícitas têm prioridade sobre as curvas inferidas da geometria. Não há detecção automática de escadas, troca automática de andares, GPS indoor, infraestrutura de posicionamento ou validação física de sensores nesta entrega.

A interface continua somente frontend. Não é necessário criar conta. A simulação de perfis não fornece segurança real. A navegação não altera, envia nem duplica o percurso salvo; dados continuam locais no navegador. Não há serviço de mapas, câmera, GPS, voz ou backend novo. A orientação atual é descartada ao sair; iniciar novamente exige confirmar a saída.

## Código e validação

- `assets/js/routes/guidance.js`: plano simplificado preservando sinais, sentido inverso, instruções e estados de progresso. Um avanço por passos só alcança o próximo ponto; não confirma uma curva ou chegada.
- `navigation-views.js`: entrada, orientação principal, progresso, seta, controles e etapas.
- `navigation.js`: confirmação do usuário, permissões, captura, pausa, limpeza e descarte de eventos antigos.
- `#navegar/ID` é integrado à navegação do front. O editor e os formatos de mapas/rascunhos são preservados.
- `20261103-navigation` identifica os recursos novos e evita mistura com o cache do editor anterior.

`npm run check:navigation` contém 103 verificações de plano, inversão, progresso, bloqueio de passos em curvas/escadas/chegada, marcação na saída, pausa, compatibilidade e escape. Um harness DOM separado verifica 47 cenários de interação e ciclo de sensores com um capturador explicitamente falso, além da integração com a navegação do app e dos testes de regressão do editor. Esses testes não validam layout nem movimento real do telefone. O controle de navegador está desativado nas configurações Work desta sessão; a revisão visual e o teste físico devem ser feitos no aparelho. `npm run check` passou na pasta principal após a aplicação da navegação, junto dos testes DOM e de integração.
