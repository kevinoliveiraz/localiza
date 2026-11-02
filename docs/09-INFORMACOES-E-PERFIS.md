# Informações e perfis — direção de 31/10/2026

O responsável pediu priorizar informações novas e livres, sem reutilizar conteúdo do HSP e sem impor tipos. O 3D deve ficar como está. O fluxo principal passa a ser cadastrar → definir quem vê → consultar.

O cadastro contém título, conteúdo e link opcional. O administrador escolhe todos ou perfis específicos. Auxiliar, Supervisor e Aprendiz são perfis iniciais independentes, editáveis; não existe herança automática de acesso. Uma pessoa pode pertencer a mais de um perfil. Administrador é a função de gerenciar, separada do perfil de leitura.

## Modelo desta etapa local

- Organização: nome e configuração inicial única nesta instalação.
- Pessoas: nome, e-mail, hash de senha, função, perfis e situação.
- Perfis: nome e descrição livres.
- Informações: título, conteúdo, link opcional, rascunho/publicado/arquivado e público permitido.
- Sessões: tokens aleatórios em memória com expiração; cookie HttpOnly e SameSite.
- Histórico: ações administrativas, sem copiar corpos dos textos para os registros.

Os dados são persistidos atomicamente pelo servidor Node em `.localiza-data/information/information.json`. Não ficam em localStorage. Não foi adotado um serviço externo nem integrado Supabase. Esta é uma instalação local para uma organização, não uma implementação multi-organização com RLS.

## Regras verificáveis

Sem sessão não há conteúdo. Colaboradores recebem somente informações publicadas e explicitamente liberadas; rascunhos e arquivos são exclusivos da administração. A consulta por ID aplica a mesma regra da busca. Alterações de perfis e suspensão de pessoas valem nas próximas requisições, inclusive com sessão existente. Não existe seletor de perfil para elevar acesso de um colaborador. A prévia é exclusiva do administrador e filtra a resposta no servidor.

Cada gravação administrativa verifica novamente a função atual dentro da transação. Arquivar é reversível. O último administrador ativo não pode ser suspenso nem perder a função. Mudanças concorrentes de um texto exigem reabertura se a revisão ficou desatualizada.

O 3D e seus dados anteriores permanecem separados e não são convertidos em conteúdo desta área. Somente o novo módulo de informações participa do controle de contas implementado aqui. A instalação permanece limitada a loopback; esta etapa não publica o produto na internet nem implementa e-mail, recuperação automática de senha, MFA ou múltiplas organizações.

Referências técnicas: https://nodejs.org/docs/latest-v22.x/api/crypto.html e https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html .
