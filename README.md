# Localiza — prévia do front

Versão 0.6.0. Esta etapa trabalha somente a interface: pesquisar informações, consultar páginas com texto ou tabelas e organizar o conteúdo pela Administração. O backend será tratado depois.

O início recebeu uma composição com o vídeo fornecido pelo responsável, busca translúcida, atalhos e tema claro/escuro. O fundo é mudo, pode ser pausado e respeita movimento reduzido. Consulte `docs/12-INICIO-COM-VIDEO.md`.

## Abrir

Execute `npm run dev` e abra http://localhost:5173/. A entrada abre diretamente na busca, sem e-mail ou senha. O front também funciona com um servidor estático, como Live Server.

Teste online: [abrir o Localiza](https://kevinoliveiraz.github.io/localiza/) ou [criar um percurso](https://kevinoliveiraz.github.io/localiza/#criar-mapa). O workflow **Publicar Localiza** publica os arquivos estáticos de `main` no GitHub Pages em HTTPS; `.nojekyll` mantém os arquivos originais. Há apenas uma publicação por vez, com ações oficiais fixadas por SHA. Não há backend hospedado. Os percursos continuam salvos apenas no navegador de cada aparelho. Consulte `docs/16-PUBLICACAO-GITHUB-PAGES.md`.

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

Em **Administração → Rotas → Criar rota**, informe o **Nome da rota**. Saída A e destino B são opcionais, em **Mais detalhes**. **Gravar caminhada** usa movimento e direção para estimar a caminhada em corredores internos; **Desenhar** permite marcar os pontos manualmente para criar/testar o caminho no computador. O resultado é uma rota simples em 2D vista de cima, sem objetos. É possível pausar, concluir, salvar, consultar e excluir os percursos locais. Mapas saiu do menu principal; a consulta e o início de rotas ficam na busca. Consulte `docs/17-MOBILE-E-ROTAS-NA-ADMINISTRACAO.md`.

No editor, arraste A, B ou as curvas; toque na linha para inserir um ponto e no espaço vazio para continuar. Os botões **Reto**, **Esquerda** e **Direita** acrescentam trechos. Selecione um círculo para marcar uma virada ou escada (subir/descer). Há desfazer/refazer e **Voltar à edição** na revisão. Rotas salvas têm **Editar** na central administrativa, que atualiza o mesmo mapa. Rascunhos são preservados nesta aba ao navegar ou recarregar; em **Administração → Rotas**, use **Retomar**. Fechar a aba encerra o rascunho; mapas salvos permanecem neste navegador.

Para seguir uma rota salva, pesquise seu nome na **busca principal** e toque em **Iniciar rota**: o mapa abre diretamente. Também é possível buscar pela saída ou destino, quando informados, sem acentos. O nome da rota é obrigatório no editor. Edição e exclusão ficam recolhidas em **Gerenciar rota**. Consulte `docs/15-ROTAS-NA-BUSCA.md`.

O padrão continua **Automático · passos e bússola**: na saída, aponte o topo físico do celular para o primeiro trecho e toque em **Iniciar rota**. A posição estimada se move pelos passos e pela direção; o mapa acompanha o topo do aparelho e passa pelas curvas sem cliques. Há pausa, reorientação e mapa inteiro. **Opções da rota** reúne sentido inverso, tamanho do passo e guia manual como alternativa. A chegada é estimada, sem confirmação obrigatória. O acompanhamento não é localização indoor precisa; depende dos sensores, da escala do desenho e do comprimento do passo. Não detecta a altura de escadas nem recalcula caminhos. Consulte `docs/14-NAVEGACAO-DE-PERCURSOS.md`.

**A captura por sensores é experimental e ainda precisa ser validada numa caminhada real.** Requer celular compatível, HTTPS e permissão de movimento. Não é GPS indoor nem planta medida. A distância e a largura do corredor são referências estimadas/ilustrativas. O servidor local em `localhost` não fornece acesso HTTPS ao celular. Os percursos ficam no navegador, em `localiza_route_maps_v1`, sem envio de dados. Consulte `docs/13-MAPAS-DE-PERCURSO.md`.

O mapa de ambientes e o editor 3D anteriores continuam em **Administração → Ferramentas de ambientes anteriores**. Seus arquivos e o motor local foram preservados. Os módulos de contas da etapa anterior também continuam no código, sem participar do fluxo padrão da prévia. Não foram alteradas as bases privadas existentes.

Para os detalhes do 3D e as limitações anteriores da análise de vídeo, consulte `docs/08-VIDEO-E-MODELO-SIMPLIFICADO.md`.

## Verificar

- `npm run check:front`: testes do novo fluxo visual, busca em tabelas/texto, simulação de perfis, edição livre e persistência da prévia.
- `npm run check:routes`: geometria, estimativa de passos/direção, armazenamento e ciclo de permissões/sensores com dados de teste.
- `npm run check:navigation`: orientações, progresso, sentido inverso, pausa e confirmação de curvas/escadas/chegada, com dados de teste.
- `npm run check:compass`: avanço automático pela direção do topo, giro sem deslocamento, curvas sem cliques, desvios estimados e qualidade/liberação dos sensores, com dados de teste.
- `npm run check`: inclui os testes do front e mantém as verificações anteriores de HTML, estado, 3D, vídeo e do módulo de contas preservado.

Direção atual: `docs/11-FRONT-CONSULTA-E-PAGINAS.md`, `docs/12-INICIO-COM-VIDEO.md` e `docs/13-MAPAS-DE-PERCURSO.md`.
