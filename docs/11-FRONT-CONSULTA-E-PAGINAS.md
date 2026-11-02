# Front de consulta e páginas — 01/11/2026

O responsável pediu observar a consulta do HSP Localiza no Chrome e esclareceu que a planilha era apenas seu backend. A orientação final desta etapa é trabalhar somente o front. A integração futura de backend não faz parte desta entrega.

## Experiência

- Início com uma pergunta e uma busca, sem cadastro obrigatório.
- Busca por nome da página, texto, nome de coluna ou conteúdo de uma célula; “todos” e “Ver todas as informações” abrem o conteúdo disponível na simulação.
- Resultados agrupados por página. A busca pelo nome da página mostra seu conteúdo; a busca por uma célula mostra as linhas correspondentes. Filtros permitem selecionar as páginas.
- Administração em três blocos: Páginas de informação, Pessoas e Perfis de acesso.
- Uma página pode ter texto, uma tabela de colunas livres ou os dois. Nome da página e pelo menos um conteúdo são obrigatórios; não há categoria de negócio obrigatória.
- É possível adicionar/remover colunas e linhas no editor, salvar rascunho, publicar, editar, arquivar e restaurar na prévia.
- Auxiliar, Supervisor e Aprendiz são perfis iniciais independentes e editáveis. O seletor do topo é explicitamente uma simulação para revisar o front.

## Limites intencionais

Todos os exemplos são fictícios, novos e locais. Nenhuma informação, marca, planilha ou código do HSP foi transferido. Foi observada a tela de consulta, seus resultados em tabelas e os filtros; não foi acessada uma área administrativa institucional nem confirmada uma sessão com o e-mail indicado pelo responsável.

`assets/js/front/` não faz chamadas ao backend. As alterações da prévia ficam somente em `localiza_front_preview_v1`, no localStorage da origem utilizada. Não inserir dados privados: este é um protótipo visual, e o filtro de perfil não protege os dados. A prévia não cria contas, senhas, convites ou permissões reais.

Os arquivos do serviço de contas anterior e sua base privada foram preservados e estão fora do fluxo padrão. O desenho 2D/3D, a análise de vídeo, as bibliotecas e o motor local não foram modificados. O servidor de desenvolvimento existente continua disponível; também é possível revisar o front por um servidor estático comum, sem API.

## Validação

`npm run check:front` executa 61 verificações: busca em texto e tabelas, linhas correspondentes, simulação dos perfis sem hierarquia, validação de campos livres, persistência e falha de armazenamento, renderização, escape de conteúdo, ausência de chamadas de API e inclusão dos exemplos em prévias já salvas sem perder alterações.

### Conteúdo fictício adicionado para testes

O responsável solicitou listas úteis para localizar ramais, setores e e-mails. Foram acrescentadas 9 páginas da empresa fictícia Horizonte, com 71 linhas e 12 contatos, incluindo salas, horários, orientação sobre quem procurar e exemplos específicos de cada perfil. Todos os nomes, locais e ramais são inventados; os e-mails usam `horizonte.example`. A atualização de exemplos é aplicada uma única vez à chave de prévia existente e preserva IDs já presentes, páginas editadas, rascunhos, pessoas, perfis e a visualização selecionada.

No Chrome, foram testados a entrada sem login, pesquisa por célula, filtros, criação de página com tabela de três colunas e duas linhas, preservação do conteúdo ao expandir a tabela, publicação na prévia, persistência após recarregar e simulação de perfis diferentes. Busca, resultados e editor foram conferidos em viewport de 390 × 844 sem transbordamento horizontal da página; as tabelas têm rolagem própria. O tamanho do navegador foi restaurado.

`npm run check` mantém as regressões da etapa anterior e inclui os testes do front. Os testes do backend preservado não devem ser interpretados como segurança implementada nesta prévia.

Projeto: `C:\Users\Aluno\Documents\progamação\localiza`. Backup e capturas desta etapa: `C:\Users\Aluno\Documents\ChatGPT\freelancer\localiza-entrega-front-2026-11-01`.
