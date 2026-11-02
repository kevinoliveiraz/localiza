# Localiza — prévia do front

Versão 0.6.0. Esta etapa trabalha somente a interface: pesquisar informações, consultar páginas com texto ou tabelas e organizar o conteúdo pela Administração. O backend será tratado depois.

O início recebeu uma composição com o vídeo fornecido pelo responsável, busca translúcida, atalhos e tema claro/escuro. O fundo é mudo, pode ser pausado e respeita movimento reduzido. Consulte `docs/12-INICIO-COM-VIDEO.md`.

## Abrir

Execute `npm run dev` e abra http://localhost:5173/. A entrada abre diretamente na busca, sem e-mail ou senha. O front também funciona com um servidor estático, como Live Server.

Teste online: [abrir o Localiza](https://kevinoliveiraz.github.io/localiza/) ou [criar um percurso](https://kevinoliveiraz.github.io/localiza/#criar-mapa). O GitHub Pages publica a raiz de `main` como site estático em HTTPS; `.nojekyll` mantém os arquivos originais. Não há backend hospedado. Os percursos continuam salvos apenas no navegador de cada aparelho.

## Testar o fluxo

1. Pesquise uma palavra, um nome de página ou o conteúdo de uma célula. “Ver todas as informações” abre a consulta completa da simulação.
2. Use os filtros para escolher as páginas que aparecem nos resultados. Abra uma página para consultar todo o conteúdo.
3. Em **Administração → Páginas de informação**, crie uma página com texto, tabela ou os dois. Você define livremente os nomes das colunas e o conteúdo das linhas.
4. Escolha **Quem pode ver** e publique na prévia ou salve como rascunho.
5. Use **Simular visualização como**, no topo, para revisar a experiência de Auxiliar, Supervisor, Aprendiz ou de um perfil criado por você. Selecione Administrador para voltar às ferramentas de edição.

**É um protótipo visual com exemplos fictícios.** O seletor de perfis não é autenticação nem controle de acesso real. Nenhuma conta, senha ou convite é criado nesta etapa. Não inserir dados privados.

As alterações da prévia ficam no localStorage do navegador e da origem utilizados, na chave `localiza_front_preview_v1`. Não há chamadas à API de contas nem integração com planilhas ou serviços externos. Nenhum conteúdo ou marca do HSP foi importado.

## Informações fictícias para testar

A empresa fictícia Horizonte tem listas de ramais, setores, contatos e e-mails, assuntos por área responsável, salas, serviços e horários. Há também páginas específicas de Supervisor, Auxiliar e Aprendiz para testar a simulação de perfis. São 9 páginas adicionais com 71 linhas e 12 contatos, além dos exemplos anteriores.

Experimente buscar `2301`, `Financeiro`, `bruno.lima@horizonte.example`, `impressora` ou `sala de reunião`. Os e-mails usam o domínio reservado `.example`; os nomes, ramais e locais são inventados. Os exemplos são acrescentados às prévias já salvas sem substituir páginas editadas, rascunhos, pessoas ou o perfil selecionado.

## Mapas de percurso

Em **Mapas → Criar percurso**, informe a saída A e o destino B. **Com o celular** usa movimento e direção para estimar a caminhada em corredores internos; **Desenhar** permite marcar os pontos manualmente para criar/testar o caminho no computador. O resultado é uma rota simples em 2D vista de cima, sem objetos. É possível pausar, concluir, salvar, consultar e excluir os percursos locais.

**A captura por sensores é experimental e ainda precisa ser validada numa caminhada real.** Requer celular compatível, HTTPS e permissão de movimento. Não é GPS indoor nem planta medida. A distância e a largura do corredor são referências estimadas/ilustrativas. O servidor local em `localhost` não fornece acesso HTTPS ao celular. Os percursos ficam no navegador, em `localiza_route_maps_v1`, sem envio de dados. Consulte `docs/13-MAPAS-DE-PERCURSO.md`.

O mapa de ambientes e o editor 3D anteriores continuam em **Administração → Ferramentas de ambientes anteriores**. Seus arquivos e o motor local foram preservados. Os módulos de contas da etapa anterior também continuam no código, sem participar do fluxo padrão da prévia. Não foram alteradas as bases privadas existentes.

Para os detalhes do 3D e as limitações anteriores da análise de vídeo, consulte `docs/08-VIDEO-E-MODELO-SIMPLIFICADO.md`.

## Verificar

- `npm run check:front`: testes do novo fluxo visual, busca em tabelas/texto, simulação de perfis, edição livre e persistência da prévia.
- `npm run check:routes`: geometria, estimativa de passos/direção, armazenamento e ciclo de permissões/sensores com dados de teste.
- `npm run check`: inclui os testes do front e mantém as verificações anteriores de HTML, estado, 3D, vídeo e do módulo de contas preservado.

Direção atual: `docs/11-FRONT-CONSULTA-E-PAGINAS.md`, `docs/12-INICIO-COM-VIDEO.md` e `docs/13-MAPAS-DE-PERCURSO.md`.
