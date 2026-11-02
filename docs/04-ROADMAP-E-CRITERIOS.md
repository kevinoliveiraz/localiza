# 04 · Roadmap, prioridades e critérios de aceite

## Fase 0 — Base visual (entregue neste ZIP)

- [x] Landing, cadastro de organização, conta principal, revisão e página de acesso.
- [x] Dashboard, mapa, estúdio, ambientes, departamentos, membros e relatórios como interface navegável.
- [x] Header, cores e estilo compartilhados.
- [x] Mock data, interações demonstrativas, layout desktop e ajustes responsivos.
- [x] Protótipos originais em `referencias/`.
- [ ] Revisão visual no Figma com aprovação final dos elementos novos.

**Aceite:** abrir todas as rotas e navegar sem erros; distinguir com clareza o que é demo.

## Fase 1 — Pesquisa técnica do 3D (prioridade alta)

### Experimentação (branch separada)

- [ ] Definir conjunto de fotos de um cômodo próprio/permitido capturadas com celular comum.
- [ ] Validar cobertura, iluminação, reflexos e captura sem LiDAR.
- [ ] Testar ferramenta de fotogrametria offline (COLMAP + malha + texturização) com dados não sensíveis.
- [ ] Exportar e visualizar um GLB verdadeiro em Three.js.
- [ ] Anotar tempo de processamento, hardware, RAM/GPU, tamanho do arquivo e qualidade visual.

**Aceite:** usuário consegue orbitar/entrar em um modelo 3D real reconstruído com fotos; mostrar dados medidos e limitações, não screenshot.

## Fase 2 — Organizações, administrador e convidado

- [ ] Aprovar esquema relacional multi-organização com migrações versionadas.
- [ ] Implementar Supabase Auth com usuário proprietário.
- [ ] Criar e administrar uma organização com vínculo de proprietário.
- [ ] Convidar membros de forma segura, verificando identidade e expirando convites.
- [ ] Criar departamentos, associar membros e salas; aplicar RLS real.
- [ ] Proteger arquivos do Storage no servidor.
- [ ] Auditoria de ações administrativas.

**Aceite:** ao autenticar dois colaboradores do RH e Farmácia, RH não consulta modelos exclusivos de Farmácia e vice-versa, incluindo requisições HTTP diretas.

## Fase 3 — Cadastro de ambientes + pipeline de modelo

- [ ] CRUD organização / unidade / prédio / andar / sala.
- [ ] Captura com upload orientado pelo celular e validações de arquivo.
- [ ] Fila de jobs e worker de reconstrução independente.
- [ ] Revisão, versionamento, autorização e publicação de modelos.
- [ ] Carregamento progressivo e responsivo no visualizador web.

**Aceite:** criar sala, capturar dados, finalizar processamento, revisar e publicar modelo com permissões corretas.

## Fase 4 — Orientação espacial (evolução, fora do MVP inicial)

- [ ] QR Codes físicos como marcadores de posição.
- [ ] Modelagem de corredores, portas, escadas e elevadores como grafo.
- [ ] Motor de rotas (por exemplo, menor caminho com restrições).
- [ ] Mapa 2D simplificado para celular, pontos de origem/destino e acessibilidade.
- [ ] Estratégia de mapas offline e atualização incremental, se houver caso real.

## Critérios técnicos transversais

- Acessibilidade: foco visível, controles por teclado, contraste e feedback de status.
- Layout responsivo (desktop e mobile); priorizar celular na etapa de captura.
- Segurança: testes RLS negativos entre organizações/departamentos.
- Privacidade: pré-publicação, revisões e retenção das capturas brutas.
- Manutenção: comentários nos pontos não óbvios, pequenas funções e testes.
- Performance: carregamento sob demanda de modelos, limites de tamanho e memória.
- Não prometer métricas de precisão ou tempo sem medir no protótipo técnico.
