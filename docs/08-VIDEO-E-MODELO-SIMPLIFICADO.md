# Direção atual: vídeo como base para modelo simplificado

O responsável corrigiu o pedido: capturar vídeo e produzir um 3D no mesmo estilo do editor, em vez de apresentar a reconstrução fotográfica texturizada.

A interface principal agora usa Desenhar / Por vídeo. Links antigos com metodo=fotos abrem o fluxo de vídeo. O mapa apresenta o modelo paramétrico salvo; os resultados fotogramétricos antigos não são usados como vista padrão. Os arquivos anteriores não foram apagados.

O navegador reproduz o vídeo local, pode gravar sem áudio com permissão explícita e extrai até 32 quadros diferentes. O motor existente usa PyCOLMAP e densificação como análise intermediária. O modo structure procura planos verticais em duas direções e devolve um contorno retangular relativo em JSON. A interface exige revisão e uma medida para conferir a proporção; não converte escala arbitrária silenciosamente em metros. Se faltar evidência de paredes opostas, a análise falha e oferece montagem pelas medidas informadas.

A etapa seguinte usa o mesmo modelo de geometria e o mesmo renderizador do desenho manual. A importação substitui somente a geometria do ambiente correspondente ou posiciona o novo ambiente ao lado dos existentes. O mapa salvo só muda quando a pessoa salva no editor. Portas, janelas e móveis não são detectados automaticamente nesta versão.

Verificação: testes de amostragem, medidas, composição do andar e referência local; quatro paredes sintéticas sob ruído e rotação; recusa de estrutura incompleta; vídeo sintético reproduzido e convertido em 12 quadros no navegador; análise sem geometria confiável recusada; prévia guiada de 20 m². A gravação física com câmera e a precisão em vídeos reais de interiores não foram validadas. Os testes não representam um escaneamento automático bem-sucedido de um cômodo real.

O servidor de análise e seus arquivos permanecem somente no computador. Vídeo, miniaturas e quadros são privados; não há envio a serviços externos nem contratação de serviço pago.
