# Rotas na busca — 04/11/2026

O fluxo de consulta de percursos ficou: **Buscar pelo nome → Iniciar rota → mapa**. A criação continua em Mapas, separada da consulta.

- A busca principal reúne páginas autorizadas na simulação e rotas salvas neste navegador. Procura nome, saída e destino, sem distinguir maiúsculas ou acentos. Várias palavras devem estar presentes nos campos da rota.
- O resultado mostra nome, saída, destino, distância estimada e apenas **Iniciar rota**. Não abre o editor nem exige passar pelos detalhes do mapa.
- **Voltar à busca** recupera a pesquisa de origem. A tela Mapas usa os mesmos cartões simples; edição/detalhes ficam em **Gerenciar rota**, recolhido.
- Ao abrir o mapa, o automático por passos e bússola já está selecionado. A orientação de alinhar o topo do celular permanece antes do botão **Iniciar rota**, porque a posição inicial depende dessa referência. Não iniciar sensores sem gesto/permissão do usuário.
- Guia manual, tamanho do passo e inversão de sentido ficam em **Opções da rota**. Todas as etapas e os limites da estimativa ficam em **Etapas e ajuda**. Erros dos sensores continuam visíveis.
- O editor pede **Nome da rota** como único campo de nome obrigatório. Saída e destino ficam em **Mais detalhes**, opcional e recolhido. Só o nome basta para criar e salvar; quando os pontos não são nomeados, permanecem Ponto A e Ponto B. O nome é preservado no rascunho e ao editar o mesmo ID, sem duplicar a rota. Percursos anteriores continuam válidos com seus títulos já salvos.

Não há migração de chave, exclusão de dados, backend, envio de coordenadas ou sincronização entre aparelhos. Rotas em `localiza_route_maps_v1` continuam locais à origem/navegador em que foram criadas. Perfis são somente uma simulação visual; não há autorização real sobre mapas. A navegação por sensores não mudou neste ajuste e continua experimental.

## Validação

As verificações do front incluem pesquisa por nome e pontos A/B, acentos, múltiplas palavras, resultado somente de rota, combinação com páginas e seus filtros, perfis simulados, escape de conteúdo e retorno à busca. O harness DOM externo verifica o fluxo completo, nomes em rascunhos/edições e mesmo ID após salvar. A regressão do automático verifica que as opções recolhidas mantêm os controles e a liberação dos sensores.

No navegador local foram conferidos criação manual com nome, salvar, pesquisar sem acento, abrir diretamente o mapa, voltar à mesma busca, opções alternativas e layout com viewport de 390 × 844. Isso valida a interface responsiva, não a precisão de uma caminhada física. Cache dos módulos e entradas: `20261104-name`.

Na correção do nome, foi verificado no navegador que um nome vazio é recusado, enquanto preencher somente o nome permite desenhar, revisar e salvar sem saída/destino. O resumo durante a edição mostra o nome dado à rota.

`npm run check` passou na pasta principal, incluindo 82 verificações do front, 201 de rotas, 103 de navegação e 83 de bússola. Os harnesses DOM externos passaram em 23 verificações do novo fluxo, 36 do editor e 50 do automático. Não adicionam dependências ao projeto.
