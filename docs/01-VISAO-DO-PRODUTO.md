# 01 · Visão, motivação e problema

## O que é

**Localiza** é uma plataforma web, extensível e open source, para **mapear instalações privadas e permitir que colaboradores encontrem espaços e informações autorizadas**. A organização possui seu próprio ambiente lógico. Seu administrador principal configura a estrutura física (unidades → prédios → andares → salas), acrescenta informações, planeja a captura de espaços reais pela câmera do celular e convida colaboradores.

O produto **não é um mapa público**. Uma organização, escola, indústria ou qualquer instituição pode instalá-lo e utilizar dentro de sua própria operação. Ser utilizável em vários setores não significa oferecer um catálogo público.

## Problema

1. Mapas internos, nomes de salas, contatos e rotas não estão centralizados ou atualizados.
2. Pessoas novas ou de outros setores dependem de orientação informal para encontrar locais.
3. Administradores precisam atualizar a estrutura sem alterar código-fonte.
4. Um mapa completo pode revelar salas ou informações que só certos departamentos devem ver.
5. A produção de mapas internos detalhados costuma exigir esforço técnico e ferramentas de alto custo.

## Por que nasceu

A ideia nasceu da experiência de construir um localizador interno para resolver uma dificuldade real. A **nova aplicação é independente**, destinada ao GitHub e a diferentes organizações, com arquitetura e experiência visual próprias. Não há propósito de transferir qualquer informação interna da SPDM/HSP nem sua marca. Todas as demonstrações usam o nome fictício **Instituto Atlas**.

## Proposta de valor

- **Organização autônoma:** cadastrar estruturas e atualizar espaços pelo painel administrativo.
- **Mapeamento com celular:** futuramente capturar fotos/vídeos, reconstruir modelos 3D reais e conectá-los às salas.
- **Visibilidade por departamento:** RH consulta áreas autorizadas ao RH, Farmácia consulta suas áreas; corredores comuns podem ser visíveis a todos os membros.
- **Acesso simplificado:** administrador possui uma conta principal; colaboradores entram por convite e, futuramente, senha descartável ou identidade corporativa.
- **Navegação contextual:** usuários localizam uma sala, e no futuro podem escanear QR Codes físicos para estabelecer ponto inicial e ver trajetos.
- **Controle dos dados:** instalação aberta e base adaptável, sem publicar o conteúdo privado dos clientes.

## Personas

**Proprietário / ADM principal** — cria uma organização, gerencia usuários e departamentos, define salas restritas, mantém o mapa. No MVP, concentra as ações administrativas para evitar complexidade de papéis adicionais.

**Colaborador convidado** — acessa os mapas permitidos à organização e aos seus grupos, pesquisa ambientes e consulta informações autorizadas.

**Mapeador** (evolução) — pessoa autorizada a registrar imagens de ambientes e submeter alterações à revisão, sem receber permissões irrestritas de administração.

## Regras de produto

- Cada organização só acessa seus próprios dados.
- Papel (`owner`, `member`) e grupo (`RH`, `Farmácia`, etc.) são conceitos diferentes.
- Um membro pode ter diversos grupos; uma sala pode ser visível a diversos grupos.
- Espaços comuns podem estar disponíveis a todos os membros autenticados da organização.
- Um colaborador sem autorização não deve receber arquivos detalhados de salas restritas, nem pela API, URL ou busca.
- QR Code é referência de localização, **não prova de identidade**.
- Um escaneamento submetido não deve ser automaticamente publicado: revisar privacidade e qualidade.

## Fora do MVP

GPS indoor automático, exploração de cidades, rotas calculadas automaticamente, AR em tempo real, reconstrução em segundos na nuvem, QR Code para todos os ambientes, visitantes sem controle, análises de movimento dos funcionários, gamificação ou marketplace. Essas ideias só devem entrar se resolverem uma necessidade demonstrada.

## Sucesso inicial mensurável

1. Criar organização e conta proprietária de verdade.
2. Convidar pelo menos duas pessoas com grupos diferentes.
3. Cadastrar prédio, andar e uma sala.
4. Capturar um cômodo real no celular e produzir um **modelo 3D legítimo**, explorável no navegador.
5. Associar modelo à sala e demonstrar que acesso não autorizado não consegue baixar arquivo nem consultar detalhes.
6. Testar a experiência em desktop e celular.
