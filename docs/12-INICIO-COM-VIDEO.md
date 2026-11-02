# Tela inicial com vídeo — 02/11/2026

O responsável aprovou a etapa funcional anterior e pediu uma composição semelhante à referência anexada, usando seu vídeo como background. A mudança se concentra no início da consulta; resultados, edição, pessoas, perfis e 3D conservam o fluxo anterior.

## Composição

- A tela ocupa toda a largura, sem moldura, margens externas ou cantos arredondados, conforme a correção solicitada pelo responsável. A navegação horizontal fica sobre o vídeo.
- Marca Localiza, acesso à busca, exploração, administração, tema e simulação de perfil.
- Título central com a segunda linha em itálico, descrição curta e busca translúcida.
- Atalhos funcionais para as páginas disponíveis: ramais, setores, pessoas, espaços, serviços e orientações.
- Transição para o conteúdo inferior nos temas claro e escuro. Os números de páginas e linhas são calculados a partir do conteúdo visível da prévia; não são métricas de desempenho inventadas.

## Mídia e movimento

O arquivo original `C:\Users\Aluno\Downloads\Localiza_background_sutil_v2.mp4` foi copiado sem alterações para `assets/media/localiza-background.mp4` (336.949 bytes, 12 segundos, 1280 × 720). O SHA-256 da cópia foi conferido com o original. `assets/media/localiza-background-poster.png` é uma imagem de apoio capturada do próprio vídeo.

O vídeo decorativo reproduz localmente, sem áudio, em loop e com `playsinline`. O controle Pausar/Reproduzir fundo fica junto ao acesso de exploração e preserva a preferência em `localiza_ui_v2.homeMotionPaused`. A preferência de movimento reduzido impede a reprodução automática e o carregamento da fonte de vídeo, mantendo a imagem de apoio. Uma ação explícita permite reproduzir o fundo. O vídeo só é montado na tela inicial e é removido ao entrar nos resultados ou na administração.

O servidor estático recebeu apenas os tipos de conteúdo `video/mp4` e `video/webm`. A alteração não cria endpoints nem amplia o backend da aplicação.

## Validação

`npm run check:front` passou com as 61 verificações existentes. No Chrome foram conferidos reprodução e loop sem erro, pausa, preferência de pausa após recarregar, retomada, tema claro/escuro e busca por ramal a partir do novo formulário. Os resultados não mantêm o vídeo montado.

A preferência de movimento reduzido foi simulada em uma página de teste separada, que não faz parte da entrega. A tela abriu pausada, sem fonte de vídeo e com imagem de apoio; a reprodução por ação explícita funcionou.

O início e os resultados foram conferidos em viewport de 390 × 844, com o botão da busca visível e sem transbordamento horizontal. O tamanho do navegador foi restaurado. O material de validação e o backup anterior ficam em `C:\Users\Aluno\Documents\ChatGPT\freelancer\localiza-entrega-visual-2026-11-02`.
