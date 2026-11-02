# 02 · Fluxos e mapa de telas

## Fluxo de administrador

```text
Landing
  └─ Criar organização (etapa 1)
       └─ Conta principal (etapa 2)
            └─ Revisar/finalizar (etapa 3)
                 └─ Painel administrativo
                      ├─ Ambientes → prédio → andar → sala
                      ├─ Estúdio 3D → capturar → processar → revisar → publicar (futuro)
                      ├─ Departamentos → atribuir salas e membros
                      ├─ Membros → convidar e definir grupo
                      └─ Mapa → consultar modelos autorizados
```

## Fluxo de colaborador

```text
Convite enviado pelo administrador [backend futuro]
  └─ Verificação de identidade (código por e-mail / SSO futuro)
       └─ Entrar na organização
            └─ Buscar local → ver informações e modelo permitido
                 └─ QR Code para origem de rota [futuro]
```

## Separação de telas

| Tela | Usuário principal | Comportamento esperado |
|---|---|---|
| Landing | Visitante público do produto | Entender Localiza e criar/acessar organização |
| Criar organização | Futuro proprietário | Nome e identificador; não exigir dados excessivos |
| Conta principal | Futuro proprietário | Nome e e-mail; sem armazenar senha no demo |
| Finalizar | Futuro proprietário | Rever e confirmar a criação (demo local) |
| Login/Acesso | Administrador ou convidado | Auth real em etapa futura |
| Dashboard | Administrador | Indicadores, ações de cadastro e mapeamento |
| Ambientes | Administrador | Prédios/andares/salas, dados e status do modelo |
| Mapa | Membro autorizado | Consultar ambientes e detalhes permitidos |
| Estúdio 3D | Administrador/Mapeador | Enviar capturas, processar e revisar modelo (futuro) |
| Departamentos | Administrador | Criar grupo; conceder/revogar acesso a salas |
| Membros | Administrador | Convidar, atribuir grupos e remover acesso |
| Relatórios | Administrador | Cobertura, status e auditoria (placeholder) |

### Links entre páginas

Este pacote usa **HTMLs reais em `paginas/`** e um módulo compartilhado em `assets/js/main.js`. Não é um SPA com roteador oculto. Todos os links são relativos para facilitar uso local e GitHub Pages.

### Comportamentos simulados no frontend

- Formulários e novos itens: `localStorage['localiza_demo_v1']`.
- Seleção de ambientes e andares: memória da aba.
- Grupos/permissões: apenas demonstração visual, sem autorização real.
- Escaneamento: imagem ilustrativa e indicador de progresso manual.
- Câmera: visualização opcional via `getUserMedia`, sem capturar ou persistir fotografias.

Ao conectar backend, esses mocks precisam ser substituídos por respostas autenticadas, nunca usados como autorização.
