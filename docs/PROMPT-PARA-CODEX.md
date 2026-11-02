# Contexto e instruções para continuar no Codex

## Escopo vigente — 01/11/2026

Somente frontend: busca na entrada, resultados por página, tabelas com campos livres e administração separada. A prévia abre sem criar conta, com exemplos fictícios e simulação explícita dos perfis. Não integrar backend ou ler planilhas do HSP nesta etapa. Leia `docs/11-FRONT-CONSULTA-E-PAGINAS.md` e a prioridade vigente em `AGENTS.md`; elas substituem a direção de 31/10 abaixo.

## Direção atual — 31/10/2026

Priorizar informações novas e livres, sem tipos obrigatórios e sem conteúdo do HSP. O administrador decide quem consulta cada informação por perfis independentes. A etapa de 3D deve permanecer como está, em ferramentas secundárias. Leia primeiro `docs/09-INFORMACOES-E-PERFIS.md` e a prioridade atual em `AGENTS.md`; elas substituem a sequência antiga de implementação abaixo. O módulo de informações já usa contas e autorização no servidor local, sem Supabase, com uma organização por instalação.

## Leia antes de escrever código

Este ZIP é a **base visual de frontend** do **Localiza**. Leia `AGENTS.md`, `README.md`, `docs/01-VISAO-DO-PRODUTO.md`, `docs/03-ARQUITETURA-E-SEGURANCA.md`, `docs/04-ROADMAP-E-CRITERIOS.md` e `docs/05-DESIGN-SYSTEM.md`.

## Sua função

Atue como engenheiro de software responsável por evoluir uma plataforma open source, **não como gerador de landing pages genéricas**. Entenda o produto e proponha arquitetura antes de substituir código. Faça mudanças incrementais e justifique trade-offs de custo, privacidade, manutenção, segurança e escalabilidade.

## O produto

Localiza é um sistema **interno e privado por organização**, não um mapa público. O proprietário cria uma organização, cadastra prédios, andares e salas; depois convida colaboradores. Cada colaborador pertence a um ou mais departamentos. Uma sala restrita ao RH **não pode ser consultada ou baixada por alguém só da Farmácia**. A regra é enforced no backend. Há um estúdio planejado para escanear ambientes com a câmera do celular e reconstruir um modelo 3D real (fotogrametria ou abordagem comprovada), publicá-lo e futuramente conectar pontos QR e rotas. O código do produto pode ser público; dados dos clientes nunca.

## O que já existe

- HTMLs separados em `paginas/`, landing `index.html`.
- Header horizontal, layout, cores e grid em `assets/css/styles.css`.
- Componentes e interações em `assets/js/main.js`.
- Dataset inventado em `assets/js/data.js`.
- Referências visuais originais em `referencias/`.
- `npm run dev` e `npm run check` sem dependências.

## Não confunda maquete com realidade

A cena 3D atual **é uma imagem recortada de um protótipo**, sem geometria real; os controles de mapa são meramente ilustrativos. O indicador de escaneamento é simulado. Convites, departamentos e organização usam localStorage: não são sistemas multiusuário. A prévia da câmera opcional via `getUserMedia` só mostra vídeo ao vivo, **não registra imagens nem gera malha 3D**.

## Regras inegociáveis

- Preservar **rigorosamente** o header horizontal das telas aprovadas e a paleta dark/navy/azul.
- Consultar `referencias/` para grids específicos antes de alterar.
- Não introduzir Tailwind ou reescrever todo o frontend em React apenas por preferência.
- Não adicionar dados do Hospital São Paulo/SPDM ou qualquer informação interna.
- Nunca expor credenciais secretas, storage público de modelos privados ou controle de acesso baseado apenas em CSS/JS.
- Não alegar funcionamento real de scanning, GPS indoor, QR Codes, permissões ou login sem testes e infraestrutura.
- Não fazer upload automático de fotos de ambientes sem confirmação e controles de privacidade.
- Componentes acessíveis, usáveis em celular e desktop, testados.
- Planejar primeiro: objetivo → arquitetura → UX/Figma → aprovação → assets → código → testes → deploy.

## Primeira atividade recomendada

**Antes de trocar a interface**, revisar a estrutura, testar todas as rotas e documentar a lacuna entre mock e implementação real. Depois criar uma POC separada de reconstrução 3D com fotos de um ambiente autorizado (sem pessoas ou dados sensíveis). Avaliar ferramentas de fotogrametria, exportar arquivo real GLB e visualizá-lo em Three.js. Relatar custo/tempo/limitações.

**Se a demanda for implementar autenticação**: primeiro apresentar schema, políticas RLS e testes de isolamento por organização e departamento; implementar com Supabase só após aprovação. Administrador e convidado são os únicos papéis obrigatórios do primeiro MVP. Setores são grupos independentes dos papéis.

## Condição de conclusão da primeira versão real

Um ADM consegue criar organização → cadastrar sala → produzir modelo 3D real → convidar membros RH e Farmácia → autorizar RH → usuário de RH visualiza → Farmácia recebe negação válida também por acesso direto à API/arquivo.

Não confundir a interface prototipada com essa entrega funcional.
