# Spec — Login

Status: vigente. Login conectado implementado e verificado em 05/nov/2026; pendências em `tasks.md`. CA-03 acompanha ADR-004/008: três itens e 14 dias úteis. E09 da spec 005 sincroniza o texto local, com publicação ainda pendente; evidências antigas não provam o texto novo.

## Objetivo

Permitir que uma pessoa provisionada pelo administrador entre com e-mail e senha, mantenha uma sessão protegida e saia do sistema.

## Vínculo

- PRD: identificação do colaborador e acesso aos próprios empréstimos.
- ADR-001: Supabase Auth, cookies httpOnly, tRPC, cadastro fechado e autorização no servidor.
- ADR-002 e `docs/layout.md`: identidade visual e composição desktop.
- Spec 002-landing: a raiz `/` é a apresentação pública. O login fica em `/login`.

## Regras

1. A raiz apresenta a landing; a entrada no sistema acontece em `/login`.
2. Autenticação válida com perfil, tenant e vínculo ativos leva a `/catalogo`. Usuário autenticado nessas condições também é redirecionado quando abre `/login`.
3. Rotas protegidas sem sessão retornam a `/login`; não há retorno para URL fornecida pelo cliente.
4. O formulário tem e-mail e senha; o e-mail é normalizado e a senha é preservada, limitada a 256 caracteres e não pode ser vazia.
5. Durante o envio, campos e botão ficam desabilitados e o botão mostra “Entrando…”.
6. Credenciais inválidas retornam “E-mail ou senha inválidos.”; perfil ou vínculo inativo retorna “Seu acesso não está ativo. Fale com Operações.”.
7. São permitidas cinco tentativas por IP e cinco por e-mail em janela fixa de 15 minutos. Contadores ficam no PostgreSQL, com identificadores em hash.
8. A sessão segue a validade configurada no Supabase, renovada no servidor. Cookies são httpOnly, sameSite=lax e secure em produção.
9. Não há cadastro público na interface. Provisionamento inicial e futuros convites são responsabilidades administrativas.
10. O formulário usa tRPC com Zod; não há Server Actions ou token em localStorage/sessionStorage.
11. Sair invalida a sessão e retorna ao login.
12. O health público informa disponibilidade sem dados de usuário ou de configuração.
13. O layout é somente escuro, com hero de 560px no desktop, controles e tipografia do design system.
14. O ícone e o nome da marca no login são um link para a landing, acessível por teclado.

## Critérios de aceitação

- CA-01 · Uma pessoa sem sessão abre `/login` e vê o formulário; `/` continua sendo a landing, conforme spec 002.
- CA-02 · Em 1440 × 820, o hero tem 560px e a área de formulário ocupa o restante, sem rolagem horizontal.
- CA-02a · Não há rolagem horizontal ou vertical em 1440 × 820, 1366 × 768 e 1280 × 720, inclusive com erros de validação. Janelas menores e zoom podem rolar para manter os campos acessíveis.
- CA-03 · Hero apresenta marca, “3 itens por pessoa”, “14 dias úteis de prazo” e “Operações · v1”, conforme ADR-008/ADR-004. Números e rótulos são verificados no navegador em E09/CA-E11 da spec 005, sem tratar o teste antigo como prova de dias úteis.
- CA-04 · Campos têm rótulos, a senha é ocultada e o formulário apresenta o botão Entrar e a orientação de suporte.
- CA-05 · Não existe ação de autocadastro; o provedor deve impedir cadastro público.
- CA-06 · Controles interativos têm foco de teclado visível.
- CA-07 · Não existe modo claro nem alternador de tema.
- CA-08 · Tokens não são armazenados em localStorage/sessionStorage ou variáveis públicas.
- CA-09 · Renovação da sessão acontece no servidor.
- CA-10 · Credenciais inválidas produzem mensagem genérica e não criam sessão.
- CA-11 · Autenticação acontece no servidor e a sessão usa cookies httpOnly, sameSite=lax e secure em produção.
- CA-12 · Usuário sem perfil, tenant ou vínculo ativo não acessa a área protegida; o tenant não pode ser trocado pelo input.
- CA-13 · O excesso de tentativas retorna orientação para tentar novamente em 15 minutos.
- CA-14 · Após sair, a sessão perde acesso à área protegida.
- CA-15 · A migration e o seed funcionam em PostgreSQL local vazio, com isolamento, RLS e auditoria verificados.
- CA-16 · Clicar no ícone ou nome EmpresTI, ou acionar o link por teclado, abre a landing.

## Fora de escopo

- Autocadastro; proposta 003 cancelada.
- Tela administrativa de convites, cadastro de equipamentos, catálogo completo e fluxos de empréstimo/devolução.
- Recuperação de senha, SSO, MFA, login social e “lembrar de mim”.
- Reserva futura, notificação de empréstimo por e-mail e importação de planilha.
- Design específico de login para celular/tablet.

## Contrato afetado

- `/login`, destino protegido `/catalogo` e procedimentos `auth.login`, `auth.me`, `auth.logout`.
- Perfis e vínculos existentes mantêm suas permissões.
- Mensagens e validação de login são compartilhadas entre cliente e servidor.
- O health não substitui a verificação de autorização.

## Evidências e pendências

- Login ADMIN real, cookies protegidos, persistência e logout foram conferidos no domínio de produção.
- Banco, migration, seed, RLS e policies existem; não se aplica mais a descrição antiga de projeto sem código.
- Seis testes de banco descartável, 11 testes unitários e dois E2E passaram na última verificação.
- Os E2E de credenciais inválidas interceptam a resposta e provam a interface; não são evidência de autenticação real.
- CA-05 atendido: sem ação de autocadastro na interface e cadastro público fechado pelo usuário no Supabase; `/auth/v1/settings` conferido em 05/nov/2026 com HTTP 200 e `disable_signup: true`.
- Falta completar o mapeamento de todos os critérios aos testes; não declarar todos como automatizados.
