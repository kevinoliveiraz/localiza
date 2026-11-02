# 05 · Diretrizes visuais e fonte da verdade

> Documento histórico. A direção atual está em `docs/06-REFORMULACAO-UI.md`, `docs/11-FRONT-CONSULTA-E-PAGINAS.md` e `docs/12-INICIO-COM-VIDEO.md`. As referências e os recortes antigos não são usados pela interface atual e não fazem parte da distribuição pública.

## Prioridade visual

1. Capturas originais em `referencias/` — **fonte da verdade**.
2. Design Figma e SVGs fornecidos pelo responsável pelo produto, quando existirem.
3. Componentes atuais em `assets/css/styles.css`.
4. Novas decisões visuais devem ser aprovadas antes da codificação.

## Correção de histórico

Houve uma tentativa anterior de dashboard com sidebar fixa que não respeitou a linguagem visual aprovada. A referência correta é `referencias/05-dashboard-referencia-aprovada.png`: **header horizontal** com logo à esquerda, itens Início/Mapa/Ambientes/Departamentos/Membros/Relatórios e ações à direita.

**Não trocar por sidebar, layout de template genérico nem reordenar o grid arbitrariamente.**

## Tokens

| Token CSS | Padrão |
|---|---|
| `--bg` | `#061521` |
| `--panel` | `#0c2131` |
| `--panel-soft` | `#102b40` |
| `--blue` | `#087fff` |
| `--text` | `#f5f8ff` |
| `--muted` | `#a0b4c8` |
| `--outline` | `#1b394d` |
| `--radius` | `14px` |
| `--header-h` | `74px` |

## Direção

- Azul elétrico para interações/rotas/pontos de referência; navy para áreas estruturais.
- Formulários de onboarding sobre **painéis brancos**, com área de preview 3D escura.
- Espaçamento generoso, cartões arredondados, tipografia sans-serif sem exagero.
- No dashboard, prioridade ao mapa 3D com ações próximas e três painéis inferiores.
- No mapa, sidebar de prédio/andar + área central + detalhes laterais.
- No estúdio, processo de captura lateral + visualização central + status/ações à direita.
- Os assets `.webp` recortados são **ilustrativos**; texto e botões devem ser HTML acessível, nunca uma screenshot clicável.

## Referências disponíveis

- `01-home.png`: landing de rolagem vertical.
- `02-criar-organizacao-formulario.png`: primeira versão do formulário.
- `03-criar-organizacao-etapa-1.png`: versão da etapa organização.
- `04-conta-principal-etapa-2.png`: conta proprietária.
- `05-dashboard-referencia-aprovada.png`: **dashboard de referência**.
- `06-mapa-explorador.png`: mapa e detalhe do ambiente.
- `07-estudio-mapeamento.png`: estúdio com passos e status.
- `08-estudio-mapeamento-alternativa.png`: estrutura e imagem alternativa do estúdio.
- `09-gerenciamento-ambientes.png`: estrutura, lista e detalhe de ambientes.

Telas novas (conclusão do cadastro, login, permissões, membros, relatórios) são **adaptações propostas**, não designs individualmente aprovados.

O arquivo `gerenciamento-ambientes-html-original.html` também foi incluído como referência técnica do protótipo anterior. Não é o código principal do novo projeto.

**Observação para publicação:** screenshots históricos podem conter nomes meramente ilustrativos provenientes das gerações iniciais. Não tratá-los como dados de clientes nem replicar esses nomes na aplicação. A interface codificada utiliza a organização fictícia **Instituto Atlas**.
