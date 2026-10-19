# Plano de implementação — primeira página e banco

## Publicação visual autorizada

O pedido posterior autoriza publicar somente a página inicial sem variáveis de banco. A Vercel usará `APP_MODE=showcase`, sem credenciais de Supabase ou PostgreSQL. Neste modo, o login é uma demonstração visual, com envio desabilitado e aviso explícito; rotas protegidas redirecionam ao login, API de autenticação responde 503 e `/health` informa somente o modo visual. A aplicação completa continua exigindo as variáveis quando este modo não estiver ativado.

Alterações: condicionais nos pontos de entrada, imports de servidor adiados até o uso autenticado, propriedade de disponibilidade no formulário, `.vercelignore` para excluir arquivos de ambiente e teste de navegador desse modo. Nenhuma migration será aplicada nesta publicação.

O pedido de seguir com todas as pendências autoriza a execução sequencial deste plano na mesma sessão. Cada etapa será verificada antes da seguinte. Commit e push continuam com o usuário.

## Ambiguidades e padrões adotados nesta execução

- Entrada válida leva a `/catalogo`; inicialmente essa rota é uma área protegida com estado vazio real, sem inventário fictício.
- `/` redireciona para `/login`; uma pessoa autenticada em `/login` segue para `/catalogo`.
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

- CA-10: credenciais inválidas produzem a mensagem genérica e não criam sessão.
- CA-11: autenticação ocorre no servidor; cookie de sessão é `httpOnly`, `sameSite=lax` e `secure` em produção.
- CA-12: usuário sem perfil/vínculo ativo não acessa a área protegida.
- CA-13: limite de tentativas retorna mensagem de nova tentativa em 15 minutos.
- CA-14: sair invalida a sessão e volta ao login.
- CA-15: banco vazio recebe todas as tabelas e o seed idempotente, com isolamento e auditoria verificados localmente.

## Limite desta entrega

O catálogo é somente destino protegido inicial. Cadastro de equipamento, aprovação e devolução têm modelo de dados definido, mas as telas e serviços desses fluxos não fazem parte da primeira página.
