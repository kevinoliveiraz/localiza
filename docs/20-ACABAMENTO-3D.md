# Acabamento da rota 3D

Polimento solicitado pelo responsável em 06/11/2026, sobre a visualização descrita em `19-ROTA-EM-3D.md`.

## Mudanças visuais

- Piso com um pequeno chanfro constante, juntas arredondadas e base contínua nas curvas. A largura e a espessura continuam ilustrativas.
- Sombras de contato suaves, fundo discreto e iluminação com controle de exposição. A textura das sombras é gerada localmente; não há imagens ou serviços externos.
- Traçado com mais contraste, contorno suave e destaque do trecho percorrido.
- Marcadores com base e haste, acompanhados de **A · Saída** e **B · Destino**. Em percursos muito curtos, os rótulos ficam compactos e se separam para preservar a leitura.
- Seta com relevo, chanfro, contorno claro e indicação discreta da frente. Ela aparece durante o percurso; antes do início, a saída é identificada somente pelo marcador A.
- Sinais de escadas acompanham a direção do segmento e distinguem subir/descer de forma esquemática. Não se atribuem alturas reais ao prédio.

## Câmera e desempenho

Somente a orientação visual da câmera recebe uma transição de até 180 ms pelo arco mais curto, inclusive ao passar de 359° para 0°. A posição, o progresso, a bússola usada na navegação e os dados salvos não são alterados pela transição. A preferência de movimento reduzido desativa a suavização. A animação termina ao alcançar a direção recebida e é cancelada ao ocultar/sair da vista; não há movimento fictício por tempo nem animação contínua enquanto parado.

As peças repetidas continuam usando malhas instanciadas, com densidade de pixels limitada. Sombras usam textura procedural, sem mapa de sombras em tempo real. Geometrias, materiais, textura, instâncias, callbacks de animação e observadores são liberados ao sair.

## Validação

Os testes de 3D cobrem o arco curto e o término da transição, opção de ajuste imediato, posição/progresso preservados, separação de rótulos próximos e descarte único dos recursos. A interface é conferida em telas de celular e desktop, nos temas claro/escuro, mantendo troca 2D/3D, alinhamento e pausa. Sensores físicos continuam dependendo de validação numa caminhada real.

A versão pública dos arquivos é `20261106-polish3d`; a publicação segue o workflow existente.
