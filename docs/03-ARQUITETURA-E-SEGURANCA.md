# 03 · Arquitetura de referência (futura)

> Este documento é uma proposta para a implementação real, **não representa serviços já configurados**.

## Agora: base de interface

- HTML sem framework + CSS tradicional + módulos JavaScript.
- Imagens `.webp` originadas dos protótipos e favicon SVG.
- Dados inteiramente fictícios em `assets/js/data.js`.
- `localStorage` apenas para melhorar navegação da demo, sem segurança.
- Servidor HTTP estático Node.js sem pacotes externos.

## Depois: módulos separados

```text
Navegador (frontend Localiza)
  ├─ Auth + dados estruturados → Supabase Auth / PostgreSQL / RLS
  ├─ Metadados de modelos → PostgreSQL
  ├─ Upload e download privado → Supabase Storage ou storage S3 equivalente
  └─ Solicitação de reconstrução → API de jobs (serviço isolado)
       └─ Worker de processamento 3D → Python + COLMAP + pipeline de malha/textura
            └─ Exportação validada → GLB/glTF → Visualizador Three.js
```

A captura inicial pode ser uma sequência de **fotografias sobrepostas** ou vídeo convertido em quadros. COLMAP realiza estimação de poses/reconstrução esparsa/densa conforme pipeline, mas **não entrega automaticamente uma malha texturizada GLB pronta para navegação**; isso exige ferramentas e etapas extras. Gaussian Splatting é alternativa visual futura e não fornece necessariamente geometria adequada para rotas.

Usar backend independente para jobs pesados: não executar a reconstrução em Edge Functions normais ou no navegador. Validar volume, privacidade, tempo, custo e dispositivos antes de prometer processamento em tempo real.

## Esboço de dados (não SQL executável)

- `organizations(id, name, slug, owner_user_id, created_at)`
- `organization_members(id, organization_id, user_id, role, status)`
- `departments(id, organization_id, name)`
- `member_departments(organization_member_id, department_id)`
- `sites(id, organization_id, name)`
- `buildings(id, site_id, name)`
- `floors(id, building_id, label, sort_order)`
- `rooms(id, floor_id, name, code, visibility, status)`
- `room_department_permissions(room_id, department_id)`
- `scans(id, room_id, created_by, state, raw_files_path, model_path)`
- `qr_points(id, floor_id, room_id nullable, random_public_identifier, label)`
- `audit_events(id, organization_id, actor_id, action, target, created_at)`

Os `organization_id` e relações devem ser validados pelo banco; evitar referências entre organizações. O vínculo de `room → floor → building → site → organization` deve ser checado por política/restrição apropriada.

## Modelo de autorização

1. Todo acesso autenticado é filtrado por **vínculo ativo com a organização**.
2. `owner` administra usuários, grupos e mapas; `member` só lê ambientes autorizados.
3. Salas `interno`: visíveis para membros ativos da organização.
4. Salas `restrito`: visíveis somente a grupos explicitamente liberados e a administradores com escopo adequado.
5. O acesso a imagens, documentos, arquivos GLB e capturas depende da mesma autorização no servidor; **não basta ocultar itens na UI**.
6. Mudança/revogação deve refletir na autorização dos downloads; links temporários já emitidos podem continuar válidos até expirar — use prazo curto e controles adequados para arquivos sensíveis.
7. JWT antigo pode conter claims desatualizadas; para acesso sensível usar políticas que consultem dados de associação atuais e avaliar validação de sessão quando apropriado.
8. Tokens de convite precisam ser únicos, de vida curta, uso único e passíveis de revogação. QR Codes físicos **não devem funcionar como tokens de convite**.
9. Política RLS habilitada em todas as tabelas expostas; políticas explícitas com vínculo de organização e departamentos. Não derivar permissão de `user_metadata` editável pelo usuário.
10. Nunca expor `service_role` ou segredos no frontend. Somente chave pública com regras restritivas.

## Privacidade e controles organizacionais

- Capturas podem conter documentos, imagens de pessoas e telas. Solicitar autorização institucional e fornecer revisão antes de publicar.
- Upload privado, revisão de conteúdo, criptografia em trânsito, restrição por organização e retenção de originais.
- Evitar rastreamento contínuo de movimentação de funcionários por padrão; logar eventos administrativos relevantes.
- Não divulgar dados reais em demonstrações, exemplos e issues públicas.

## Implantação open source

Começar como web estática (GitHub Pages/Vercel) para demonstração. Para aplicação real, documentar configuração de backend, Storage privado, worker de reconstrução e dados de teste. Futuramente suportar self-hosting (Docker Compose) para organizações que exigem controle completo da infraestrutura.

MIT é uma licença permissiva para este **pacote de código original**. Verificar a licença de bibliotecas externas adicionadas e revisar a estratégia de licenciamento antes de publicar a versão final.
