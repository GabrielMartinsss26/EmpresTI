# EmpresTI — Empréstimo de Equipamentos Internos

Sistema web interno para controlar o empréstimo e a devolução de equipamentos.
O documento de negócio está em `docs/PRD.md` e a stack aprovada está em
`docs/adr/001-stack.md`.

## Onde olhar

- `docs/PRD.md` — descreve o problema, os usuários e o escopo do produto; não é uma spec.
- `docs/adr/` — contém as decisões técnicas já tomadas e suas justificativas.
- `docs/layout.md` — descreve a referência visual e os fluxos das telas.
- `rules/restrictions.md` — deve ser lido antes de qualquer tarefa.
- `docs/specs/<NNN-funcionalidade>/` — local previsto para spec, plano e tarefas de cada funcionalidade.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec vence o código.
- Se uma spec e um ADR discordarem, pare e informe o conflito.
- Se algo necessário não estiver definido nos documentos, pergunte; não invente a decisão.

## Processo

- Leia `rules/restrictions.md` antes de começar qualquer tarefa.
- Leia `docs/adr/` antes de propor qualquer alteração estrutural ou dependência.
- Antes de implementar, liste os requisitos ambíguos encontrados.
- Uma decisão estrutural nova precisa ser aprovada e registrada em ADR antes do código.
- Execute somente uma tarefa aprovada por vez e pare após verificá-la.
- Não execute `git commit` nem `git push`. Todos os commits e pushes são feitos pelo usuário.
- Não configure, publique ou altere recursos externos do Supabase, GitHub ou Vercel sem pedido explícito do usuário.

## Estado atual do projeto

O pedido de seguir com todas as pendências autoriza executar as etapas de
`docs/specs/001-login/plan.md` em sequência, verificando cada uma antes da próxima.
Commit e push continuam sendo responsabilidade do usuário.

## Estrutura

- `src/app` — rotas Next e endpoint tRPC.
- `src/components` — interface e componentes locais.
- `src/server` — configuração, identidade, contexto tRPC e services.
- `prisma` — schema, migrations e seed.
- `tests/unit`, `tests/db`, `tests/e2e` — validação, PostgreSQL real e navegador.

## Comandos do plano autorizado

- `npm install` — dependências; depois do lockfile, `npm ci`.
- `npm run dev` — execução local.
- `npm run db:generate` — geração do cliente Prisma.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202610190001_initial/migration.sql` — geração inicial; SQL de segurança complementado na mesma migration.
- `npm run db:deploy` — aplicação de migrations no destino configurado.
- `npm run db:seed` — seed idempotente.
- `npm run test:db` — banco local descartável via Testcontainers; nunca usa o banco remoto.
- `npm test` — testes unitários.
- `npm run lint`, `npm run typecheck`, `npm run build` — verificação da aplicação.
- `npm run format:check` — formatação; `npx prettier --write` para formatar os arquivos de implementação.
- `npx playwright install chromium`, `npm run test:e2e` — instalação do navegador e E2E local.
- `npm run start` — execução do build de produção.

O deploy remoto depende das verificações locais. Credenciais nunca são impressas.
