# Validação da etapa de informações — 31/10/2026

## Resultado

O fluxo principal passou a ser consultar e publicar informações novas, sem categorias obrigatórias. A administração foi dividida em Informações, Pessoas e Perfis de acesso. A base efetiva começa vazia; não recebeu dados ou contas da base isolada de testes.

## Testes automatizados

`npm run check` passou: sintaxe dos módulos novos, 15 documentos HTML, 5 telas espaciais mantidas, 8 vistas novas, entrada, escape de texto, links, estado, geometria, persistência e vídeo.

O teste de integração HTTP executou 185 verificações com uma base temporária: configuração inicial única, autenticação, ausência de credenciais nas respostas, perfis independentes, busca e consulta por ID, bloqueio de rascunhos, prévia exclusiva da administração, gravações administrativas, revisão concorrente, arquivamento/restauração, revogação após mudança de perfil, suspensão, invalidação de sessões após nova senha, proteção do último administrador, validação de links, origem e identificação das gravações, limite de tentativas de login, encerramento da sessão e persistência após reiniciar o servidor.

## Teste de uso no navegador

Executado em uma base de QA separada, com organização, contas e textos fictícios:

- Entrada com conta de administrador e troca para uma conta de Auxiliar.
- Criação de informação com texto livre; impedimento de publicação sem público selecionado; publicação para Auxiliar e Aprendiz.
- Prévia de Supervisor com somente as informações daquele perfil e as gerais; prévia de Aprendiz com o conteúdo recém-publicado.
- Consulta real como Auxiliar sem ferramentas administrativas; busca por texto restrito sem resultado; bloqueio de um link direto de conteúdo para Supervisor.
- Abertura do cadastro de pessoa e gravação sem alterar a senha; criação de um perfil com nome livre.
- Administração e consulta em viewport de 390 × 844, sem transbordamento horizontal. Tamanho do navegador restaurado ao terminar.
- Sem erros JavaScript no console durante os fluxos verificados.

Foi corrigido um problema encontrado na troca de contas: a URL da prévia administrativa não deve reaparecer como destino de um novo login de colaborador. Também foram ajustados o foco/início das telas e a limpeza de avisos entre as rotas.

## Escopo preservado e limites

Os 18 arquivos do editor espacial e do motor local existentes foram comparados por SHA-256 com a pasta de destino, sem diferenças. As páginas e os testes antigos de mapa/3D também permaneceram; a navegação compartilhada apenas passou a destacar Informações e Administração.

O controle de contas cobre o novo módulo de informações. A instalação é local, de uma única organização e um único processo servidor. Mapa e 3D permanecem separados da autorização nova, com as limitações anteriores. Não foram implementados publicação na internet, envio de e-mails, recuperação automática de senha ou sincronização entre computadores. Não houve nova validação de precisão da reconstrução de vídeo nesta etapa.

Os testes, as capturas de tela e o backup anterior ficam em `C:\Users\Aluno\Documents\ChatGPT\freelancer\localiza-entrega-informacoes-2026-10-31`. A pasta efetiva do projeto é `C:\Users\Aluno\Documents\progamação\localiza`.
