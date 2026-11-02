# Etapa 1 — Reformulação da interface

Direção solicitada pelo responsável em 27/10/2026: reduzir confusão e excesso de informação, separar as ferramentas administrativas em blocos e retirar a associação com hospital/farmácia. Essa orientação substitui a obrigação anterior de copiar os grids e as cores das referências históricas para esta entrega.

O cabeçalho continua horizontal, agora com Visão geral, Explorar espaços e Administração. A nova central administrativa agrupa Espaços, Pessoas, Grupos e acessos, Estúdio 3D e Atividade. Cada módulo concentra suas ferramentas.

A base visual utiliza superfícies claras, destaque violeta, cores de apoio discretas e um tema escuro equivalente. Ilustrações CSS substituem os recortes das referências. Os arquivos históricos em referencias/ são preservados como contexto e não são utilizados na interface ativa.

Os dados de exemplo representam um workspace com edifício central, anexo criativo e oficina. A interface é genérica e não depende de um setor de atividade.

Os formulários usam dialog HTML, mensagens inline, validação e confirmação visual. A planta é um esquema 2D interativo e explicitamente ilustrativo. Não representa dimensões levantadas ou um modelo 3D. O estúdio não usa percentuais de processamento fictício.

A chave localiza_ui_v2 preserva a demonstração anterior em sua chave original. Tudo continua apenas local: não há login, convites enviados, autorização efetiva ou reconstrução 3D.

Movimento: entrada suave de conteúdo, cartões com retorno visual, detalhes discretos na ilustração. prefers-reduced-motion desativa as animações. Controles usam rótulos, foco visível, modal com Escape e restauração de foco. A câmera só é solicitada após uma ação explícita e suas tracks são encerradas ao fechar, cancelar ou sair da página.

Os testes devem verificar todas as 13 rotas, contexto de edifício/andar/ambiente, busca, formulários locais, temas e layout em celular, tablet e desktop. A reformulação não conclui as etapas futuras do roadmap.
