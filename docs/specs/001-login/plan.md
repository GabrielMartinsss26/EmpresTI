# Plano de implementação — primeira página e banco

## Histórico da publicação visual autorizada

O pedido posterior autoriza publicar somente a página inicial sem variáveis de banco. A Vercel usará `APP_MODE=showcase`, sem credenciais de Supabase ou PostgreSQL. Neste modo, o login é uma demonstração visual, com envio desabilitado e aviso explícito; rotas protegidas redirecionam ao login, API de autenticação responde 503 e `/health` informa somente o modo visual. A aplicação completa continua exigindo as variáveis quando este modo não estiver ativado.

Alterações: condicionais nos pontos de entrada, imports de servidor adiados até o uso autenticado, propriedade de disponibilidade no formulário, `.vercelignore` para excluir arquivos de ambiente e teste de navegador desse modo. Nenhuma migration será aplicada nesta publicação.

O pedido de seguir com todas as pendências autoriza a execução sequencial deste plano na mesma sessão. Cada etapa será verificada antes da seguinte. Permissões de Git seguem `rules/operacao.md`.

## Ambiguidades e padrões adotados nesta execução

- Entrada válida leva a `/catalogo`; inicialmente essa rota é uma área protegida com estado vazio real, sem inventário fictício.
- `/` apresenta a landing, conforme spec 002; uma pessoa autenticada em `/login` segue para `/catalogo`.
- Rotas protegidas sem sessão voltam ao login; não há redirecionamento para URL enviada pelo cliente.
- Erro de credencial: “E-mail ou senha inválidos.”; usuário desativado ou sem vínculo: “Seu acesso não está ativo. Fale com Operações.”.
- Durante o envio, botão e campos ficam desabilitados e o texto passa para “Entrando…”.
- Validar e-mail e senha não vazia; não impor nova regra de tamanho à senha já cadastrada.
- A sessão segue a validade configurada no Supabase, com renovação de cookies no servidor. Não há “lembrar de mim”.
- Recuperação, MFA e login social ficam fora desta entrega. Logout integra a área protegida mínima.
- Suporte é uma orientação textual para procurar Operações, sem inventar endereço ou contato.
- Rate limit: cinco tentativas por IP e cinco por e-mail em janela fixa de 15 minutos; contadores persistidos no PostgreSQL. Usar hash, sem IP ou e-mail bruto.
- `/health` público retorna somente disponibilidade, sem configuração ou dados internos.
- Erros de formulário usam texto de atraso já definido no layout, com identificação acessível; não introduzem nova cor.

## Etapas e arquivos

1. Configuração: `package.json`, lockfile npm, TypeScript strict, ESLint, Prettier, Tailwind, Next, Vitest, Playwright, `.env.example`, `.gitignore` e comandos em `AGENTS.md`.
2. Dados: `prisma/schema.prisma`, uma migration inicial com constraints, índices parciais, RLS, policies e trigger de auditoria, `prisma/seed.ts` e teste em PostgreSQL local vazio. O campo do vínculo usa `user_id`, conforme ADR-001, referenciando o perfil global.
3. Servidor: `src/server/` com ambiente validado, Prisma singleton, autenticação Supabase somente no servidor, tRPC/contexto, service de login e rate limit.
4. Interface: `src/app/` com `/`, `/login`, `/catalogo`, `/health`, API tRPC; `src/components/` com formulário e componentes locais no padrão shadcn/ui; fonte pelo Next; tokens do ADR-002.
5. Verificação: testes de isolamento, RLS, integridade e autenticação; lint, tipos, build e navegador em 1440 × 820.
6. Produção: validar conexão Supabase, aplicar somente a migration já testada no destino autorizado e publicar com Vercel se houver autenticação disponível. Não criar conta, cobrança ou usuário de teste em produção.

## Critérios adicionais

Os critérios CA-10 a CA-15 foram consolidados em `spec.md`, fonte vigente do comportamento. A situação por tarefa está em `tasks.md`.

## Limite desta entrega

O catálogo é somente destino protegido inicial. Cadastro de equipamento, aprovação e devolução têm modelo de dados definido, mas as telas e serviços desses fluxos não fazem parte da primeira página.
