# Mobile e rotas na Administração — 04/11/2026

A consulta e a criação têm entradas diferentes:

- **Buscar → nome da rota → Iniciar rota:** para quem vai usar o caminho.
- **Administração → Rotas → Criar rota:** para preparar um caminho. A central oferece **Testar rota**, **Editar** e **Ver detalhes**. Depois de salvar, há **Ver na busca**.

Mapas não aparece mais no menu principal. O endereço `#mapas` foi mantido para compatibilidade com links e rascunhos, como central administrativa. Na simulação de leitor ele redireciona à busca. A simulação continua somente visual: todos os mapas locais seguem no navegador, sem autenticação ou segurança nova por perfil.

## Interface

O vídeo aprovado da página inicial continua sem moldura. O texto de apoio, os atalhos, a busca, o menu e os controles de tema/perfil foram ampliados no celular. O novo `assets/css/responsive.css`, carregado depois das folhas existentes, define o tamanho de leitura e toque para as telas do frontend. Campos usam 16 px; textos de uso ficam em torno de 14–16 px e botões principais têm 50–54 px de altura. Legendas secundárias podem ser menores.

A central de rotas e a navegação reutilizam a imagem do vídeo, gradientes violeta/navy, cartões arredondados e os dois temas do Localiza. O mapa continua apenas com o caminho e as marcações existentes. A criação apresenta três etapas, **Nome → Caminho → Salvar**, com a etapa atual indicada. Explicações de precisão ficam recolhidas. Nome continua obrigatório; saída e destino permanecem opcionais.

No celular, os controles para iniciar, pausar e continuar a navegação ficam no rodapé da tela. Antes de iniciar, o rodapé mostra a orientação de alinhar o topo do aparelho. A página reserva espaço no fim para permitir acesso ao restante do conteúdo sem sobreposição permanente. O algoritmo de passos/bússola não foi alterado.

## Verificação

O fluxo foi conferido no navegador em 360 × 800, 390 × 844 e 1280 × 900, incluindo temas claro e escuro, criação manual apenas com nome, revisão/salvamento, entrada administrativa, resultado da busca e retorno do leitor do endereço antigo à busca. Foram verificadas largura sem rolagem horizontal e posição do botão de iniciar no viewport mobile.

Os testes existentes cobrem busca, preservação de IDs/rascunhos, edição, orientação automática e liberação dos sensores. O front também verifica a ausência de Mapas no menu e a entrada administrativa de criar/testar rotas. A validação visual não substitui uma caminhada física com os sensores.

`npm run check` passou na pasta principal: inclui 85 verificações do front, 201 de rotas, 103 de navegação e 83 do automático, além das verificações legadas. Os harnesses DOM externos passaram em 36 verificações do editor, 26 do fluxo de busca/rotas, integração geral do app e 50 do acompanhamento automático.

Cache das entradas, módulos e folhas da atualização: `20261104-mobile`. As chaves de dados locais permanecem iguais. O site continua somente frontend.
