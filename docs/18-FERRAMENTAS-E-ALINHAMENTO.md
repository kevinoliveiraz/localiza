# Ferramentas e alinhamento da rota

Atualização de 04/11/2026 a pedido do responsável. O nome visível **Administração** passa a **Ferramentas**, incluindo o menu, títulos e retornos. Endereços internos, arquivos e o papel Administrador permanecem compatíveis.

## Uso

Durante a navegação automática, o mapa tem um botão **Alinhar**. A pessoa aponta o topo físico do celular ao longo do corredor atual e toca uma vez. A ação redefine a referência de direção sem reiniciar, mover o ponto, avançar o progresso ou modificar a rota salva. Funciona também a partir da pausa, retomando os sensores para obter uma leitura nova.

A seta ao lado abre as opções. **Ajuste automático** vem ativado; pode ser desligado para usar somente o botão. O painel fecha ao escolher o modo, tocar fora dele ou pressionar Escape. As configurações são da navegação atual e não mudam a preferência de outro aparelho.

## Limites do estimador

- O ajuste automático exige passos reais, um segmento reto próximo e três amostras estáveis. Não corrige a direção enquanto a pessoa está parada.
- Corrige apenas desvios entre 2° e 15°, com até 1,5° por passo e um orçamento de 12° por trecho. Fica inativo perto de curvas, longe da linha e ao caminhar em direção incompatível. Não força uma curva de 90° a continuar reta.
- O botão usa leitura confiável, com o aparelho nivelado e recebida há no máximo 1,8 segundo. Caso contrário, espera a próxima leitura válida e bloqueia o avanço nesse intervalo. Não reutiliza uma amostra anterior ao pedido.
- Uma mudança inesperada da referência dos sensores continua pausando o percurso. Um novo alinhamento explícito pode adotar a nova referência, preservando posição e progresso.
- Não há localização absoluta em interiores. Alinhar a direção não corrige um ponto que já tenha se afastado do traçado. A estimativa por passos e bússola continua sujeita a deriva e interferências.

## Validação

`npm run check` inclui os cenários de alinhamento em `scripts/compass-check.mjs`: preservação de posição/progresso, dados vencidos, qualidade ruim, troca de referência, caminhada reta com e sem correção, giro parado, curvas e sentido contrário. A integração DOM usa sensores explicitamente falsos para conferir botão, painel, pausa, eventos antigos e limpeza. A interface foi conferida em dimensões de celular e desktop. Isso não equivale a uma caminhada física com sensores de um celular.

Os dados locais e o fluxo de busca permanecem compatíveis. A publicação segue `16-PUBLICACAO-GITHUB-PAGES.md`; a versão dos arquivos desta entrega é `20261104-align`.
