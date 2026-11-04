# Instruções para o Codex — Projeto Localiza

## Ajuste vigente — 03/11/2026: iniciar e seguir um percurso

O responsável pediu a opção **Iniciar percurso**, como um guia de navegação. Mapas salvos abrem `#navegar/ID`, também para leitores na prévia. O usuário confirma estar na saída e pode seguir por confirmação de pontos ou por estimativa experimental de passos. Curvas, escadas e chegada exigem confirmação; a estimativa não atravessa um ponto de decisão automaticamente. Há sentido inverso, pausa e conclusão. É guia de caminho cadastrado, sem GPS indoor, detecção de desvios ou recálculo. Não salvar navegação como edição nem alterar o mapa original. Leia `docs/14-NAVEGACAO-DE-PERCURSOS.md`. Continua somente frontend; a autorização por perfis permanece simulada.

## Ajuste vigente — 03/11/2026: edição de percursos no celular

O responsável testou no celular e pediu voltar à edição, arrastar A e as curvas e marcar esquerda/direita/escadas. O editor agora mantém os pontos móveis, insere curvas ao tocar na linha, oferece trechos retos/curvas de 90°, sinalização por ponto e desfazer/refazer. Mapas salvos abrem em `#editar-percurso/ID`, sem duplicar ao salvar; rascunhos são preservados nesta aba em sessionStorage. Não remover percursos antigos nem alterar a chave de mapas já salvos. Capture por sensores continua experimental. Consulte a atualização em `docs/13-MAPAS-DE-PERCURSO.md`.

## Prioridade vigente — 02/11/2026: percursos simples A → B

O responsável pediu que a criação de mapas passe a registrar uma caminhada em corredores internos e gere apenas um percurso em 2D visto de cima. A entrada principal é **Mapas → Criar percurso** (`assets/js/routes/`), com captura experimental por passos/direção do celular e desenho manual identificado para teste. Leia `docs/13-MAPAS-DE-PERCURSO.md`. Não apresentar a estimativa como GPS indoor preciso, planta medida ou captura física já validada. Não adicionar objetos/câmera/3D a esse fluxo. O editor 3D anterior continua como ferramenta secundária. Esta solicitação substitui as instruções antigas de manter a criação de mapas intocada. A etapa permanece somente frontend, com percursos locais e sem backend. Preservar busca, informações, perfis, tema e a página inicial com vídeo sem moldura.

## Distribuição no GitHub

O repositório inclui o código atual, os dados fictícios e as mídias usadas pelo frontend. As pastas de dados privados, ferramentas instaladas, dependências, validação e configurações locais ficam fora do Git. Referências visuais e recortes históricos, que não são usados pelo código atual, também ficam apenas no computador e estão listados em `.gitignore`. Não restaurar essas imagens antigas na interface nem adicioná-las à distribuição pública. A direção visual vigente está em `docs/12-INICIO-COM-VIDEO.md`.

## Direção visual vigente — 02/11/2026

O responsável aprovou a etapa funcional do front e pediu a primeira melhoria visual com a imagem de referência fornecida e o vídeo `Localiza_background_sutil_v2.mp4`. A tela inicial usa header sobre o vídeo, título central, busca translúcida, atalhos e uma transição para a área de conteúdo. A composição e as regras estão em `docs/12-INICIO-COM-VIDEO.md`. Preservar busca, dados, administração, seletor de perfis e botão claro/escuro. O vídeo é decorativo, local, mudo e pode ser pausado. Respeitar movimento reduzido. A mudança continua sendo somente frontend; não estender contas, banco de dados ou 3D.

Correção explícita do responsável: o início deve preencher a tela de ponta a ponta, sem moldura, margens externas nem cantos arredondados. Não restaurar o enquadramento externo da imagem de referência.

## Prioridade vigente — 01/11/2026: somente front

O responsável esclareceu que a planilha era apenas o backend do HSP Localiza. O backend futuro do Localiza será tratado em outra etapa; agora o trabalho é **somente frontend**. A tela inicial deve abrir sem cadastro ou login, com uma busca simples. Resultados são agrupados por páginas, com filtros e tabelas de campos livres, sem tipos obrigatórios. A Administração permanece separada em Páginas, Pessoas e Perfis. Não importar dados, marca, planilhas ou código do HSP.

O fluxo padrão usa `assets/js/front/` e exemplos fictícios em localStorage, identificados como prévia. O seletor de perfis é uma simulação visual, não autenticação nem autorização. Não integrar serviços ou estender o backend nesta etapa. Os módulos locais de contas da etapa anterior foram preservados, mas não são chamados por esta prévia. Não exigir uma conta real para revisar o front. Manter mapa/3D como estão. Esta instrução substitui a prioridade de 31/10 abaixo. Consulte `docs/11-FRONT-CONSULTA-E-PAGINAS.md`.

## Prioridade atual — 31/10/2026

O responsável pediu manter o 3D como está e priorizar informações novas, livres, sem importar conteúdo do HSP e sem tipos obrigatórios. A entrada principal agora é a consulta de informações; a administração tem três blocos: Informações, Pessoas e Perfis de acesso. Auxiliar, Supervisor e Aprendiz são perfis independentes, editáveis, sem hierarquia de leitura. O administrador escolhe os perfis de cada informação. Esta direção substitui as prioridades antigas de instalações e reconstrução abaixo. Consulte `docs/09-INFORMACOES-E-PERFIS.md`.

O módulo novo usa contas e autorização real no servidor Node, com base JSON privada de uma única organização local. Não considerar o localStorage antigo uma credencial. Não substituir essa implementação por um seletor demonstrativo de papel. Não publicar nem integrar serviços externos como parte desta etapa. Mapa/3D continuam separados, com o estado anterior e suas limitações documentadas.

## Direção atual — reformulação solicitada em 27/10/2026

O responsável solicitou explicitamente reformular cores, animações e UI/UX, reduzir informação simultânea, separar ferramentas administrativas em blocos e retirar associações com hospital/farmácia. Para essa etapa, a direção em `docs/06-REFORMULACAO-UI.md` substitui as restrições visuais antigas abaixo. Preservar a navegação horizontal simplificada e a central de Administração. As imagens em `referencias/` são contexto histórico, não o layout que deve ser reposto. A interface nova ainda pode receber ajustes do responsável; não presumir aprovação final.

Leia `docs/PROMPT-PARA-CODEX.md` e `docs/01-VISAO-DO-PRODUTO.md` antes de alterar a arquitetura ou gerar código.

## Decisões já tomadas

1. Nome do projeto: **Localiza** (sem HSP/SPDM).
2. Produto de **uso interno**, voltado a organizações que administram suas próprias instalações. Não é mapa público nem diretório de shoppings.
3. Código **open source**; mapas, colaboradores e modelos das organizações serão privados.
4. Perfis iniciais: **administrador proprietário** e **colaborador convidado**. Departamentos/grupos são uma dimensão independente do papel: RH vê suas salas, Farmácia as suas; uma pessoa pode participar de vários grupos.
5. MVP prioriza criar organização, criar/invitar usuário, cadastro de ambientes, teste real de captura/reconstrução 3D e visualização segura por grupo.
6. Futuro: QR Codes, navegação entre ambientes, outros papéis e rotas acessíveis. Não implementar tudo de uma vez.
7. Fluxo: **Ideia → Arquitetura → Figma/UX → Design aprovado → SVGs/Assets → Código → Testes**. Sem refazer o layout por conta própria.
8. Preferência: **HTML + CSS tradicional + JS explícito**; evitar Tailwind ou troca automática para frameworks sem justificativa técnica/aprovação.

## Restrições obrigatórias

- **Preservar header horizontal e grid aprovado** em `referencias/05-dashboard-referencia-aprovada.png` e telas associadas.
- **Não reutilizar dados, marca, telas internas, plantas ou código proprietário do HSP/SPDM.** A empresa de demonstração é fictícia.
- Distinguir claramente **protótipo** vs **funcionalidade real**. Não simular segurança ou processamento e apresentá-los como implementados.
- Nunca colocar chaves secretas do Supabase no navegador ou versionar arquivos `.env` reais.
- Futuro backend deve aplicar autorização no servidor e RLS no banco; ocultar sala com CSS não é proteção.
- Os QR Codes não serão credenciais: apenas identificam pontos de referência.
- Modelos 3D e imagens brutas são privados por organização, com controles de acesso e retenção adequada.
- Guardar mudanças significativas em pequenas entregas, documentar suposições e testar desktop/mobile.

## Primeiro passo de implementação real

**Provar que a câmera de um celular comum pode fornecer imagens suficientes para reconstruir um cômodo e visualizar o resultado no navegador.** Separar escaneamento do frontend e processamento pesado em serviço independente; não afirmar que uma imagem ou vídeo 2D já é modelo 3D.

Depois, criar schema e fluxo de autenticação/organizações, usando RLS e storage privado. Somente integrar quando um protótipo técnico e permissões estiverem validados.

## Comandos

- `npm run dev`: servidor local na porta 5173, sem dependências.
- `npm run check`: verifica sintaxe JS e arquivos/rotas.
