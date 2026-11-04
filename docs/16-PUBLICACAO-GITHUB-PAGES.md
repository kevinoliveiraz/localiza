# Publicação no GitHub Pages

O site é publicado pelo workflow `.github/workflows/pages.yml`, com a origem do Pages configurada como **GitHub Actions** (`build_type: workflow`). O endereço permanece https://kevinoliveiraz.github.io/localiza/ e o repositório continua público.

O fluxo usa o commit de `main`, verifica os arquivos estáticos e prepara apenas `index.html`, `.nojekyll`, `assets/` e `paginas/`. Não instala dependências nem executa um servidor. Pastas locais e dados dos navegadores não entram no artefato. As ações oficiais do GitHub são fixadas por SHA. A autenticação é temporária, pelo token e OIDC do próprio Actions; não exige chave pessoal ou segredo novo.

A concorrência `pages` permite uma publicação por vez e não cancela uma publicação em andamento. A implantação usa o ambiente `github-pages` existente. Também é possível iniciar o fluxo manualmente pela aba Actions.

## Diagnóstico em 04/11/2026

A publicação automática antiga, a partir da raiz de `main` (`legacy`), ficou em `updating_pages` até expirar no commit `fde6036`. As tentativas seguintes falharam porque o serviço ainda apontava essa publicação como em andamento, mesmo quando a API de consulta respondia `deployment_cancelled`. O site continuou entregando a versão `20261103-compass`, embora o código mais recente já estivesse no GitHub.

Repetir o job e solicitar novas compilações não resolveu o bloqueio. O fluxo explícito de Actions substitui a origem automática antiga, mantendo o mesmo endereço e os dados locais dos usuários. Execuções antigas do workflow dinâmico podem continuar aparecendo no histórico; não confundir o estado delas com o resultado do workflow **Publicar Localiza**.

## Conferência de uma atualização

1. Confirmar que **Publicar Localiza** terminou com sucesso para o commit pretendido.
2. Conferir se o HTML servido contém a versão atual do script `assets/js/front/app.js`.
3. Conferir os módulos/CSS alterados por HTTPS e recarregar a página para validar a interface publicada.

Um push concluído ou um workflow apenas na fila não confirma que o site atualizou. Não remover mapas locais, limpar localStorage, alterar o endereço ou apagar o Pages para tentar corrigir cache.

Referência: [fluxo oficial para sites estáticos](https://github.com/actions/starter-workflows/blob/main/pages/static.yml), [configurar a origem de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
