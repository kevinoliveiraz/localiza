# Etapa 2 — modelos reais e processamento local

Solicitação de 27/10/2026: criar modelos de ambientes por desenho manual (planta 2D e modelo 3D) e por fotografias. O usuário escolheu explicitamente processamento no próprio computador, sem serviço pago e sem envio de imagens para terceiros.

A aplicação mantém HTML, CSS e módulos JavaScript. Three.js é a dependência de renderização, instalada em versão fixa e copiada para assets/vendor/three; a execução não usa CDN. O código do editor usa geometria em metros, paredes com espessura e altura, aberturas, pisos e móveis. O GLB exportado contém malhas reais.

O caminho por fotografias é independente do desenho: um motor HTTP em 127.0.0.1:5175 recebe arquivos somente da interface local e executa PyCOLMAP por CPU, seguido de OpenMVS para densificação, malha, textura e exportação GLB. A instalação inicial baixa apenas ferramentas públicas; as reconstruções não fazem chamadas de rede. O serviço aceita origens de loopback e exige cabeçalho específico nas operações de escrita. Ele não deve ser publicado como backend de produção.

Fotogrametria sem referência física tem escala relativa. Ela não produz automaticamente paredes paramétricas nem uma planta técnica editável. Se a malha falhar e a estrutura esparsa existir, o resultado é identificado como nuvem de pontos parcial, nunca como modelo completo.

Dados do editor ficam em chaves locais separadas, com salvar, rascunho e exportação JSON/GLB. Os trabalhos fotográficos ficam em .localiza-data, protegidos do servidor estático e ignorados no Git. .tools contém os motores locais e também não é versionada.

A inicialização é npm run setup:photos (uma vez) e npm run dev. Os motores externos mantêm suas licenças; Three.js é MIT, PyCOLMAP/COLMAP é BSD e OpenMVS é AGPL-3.0. Referências: https://threejs.org/docs/, https://colmap.github.io/pycolmap/ e https://github.com/cdcseacave/openMVS.

Esta etapa não implementa contas reais, isolamento multi-organização ou autorização no servidor. Os módulos de pessoas e grupos continuam demonstrativos. O servidor de fotos é exclusivo de execução local e não expõe os arquivos na rede local ou na internet.

Validação: o conjunto público de 11 fotografias Sceaux Castle registrou 11 câmeras e aproximadamente 9 mil pontos esparsos, produzindo malha com 166 mil faces. A etapa de correção de costuras do OpenMVS 2.4.0 gerou regiões pretas neste ambiente; ela foi desativada após comparar as texturas. A exportação final incorpora os PNGs no GLB. O visualizador foi testado com esse arquivo real. Isso não valida a precisão ou a qualidade de reconstrução de interiores.
