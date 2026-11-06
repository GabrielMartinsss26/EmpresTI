# EmpresTI — Empréstimo de Equipamentos Internos

Sistema web interno para controlar o empréstimo e a devolução de equipamentos.
O documento de negócio está em `docs/PRD.md` e a stack aprovada está em
`docs/adr/001-stack.md`.

## Onde olhar

- `docs/PRD.md` — descreve o problema, os usuários e o escopo do produto; não é uma spec.
- `docs/adr/` — contém as decisões técnicas já tomadas e suas justificativas.
- `docs/layout.md` — descreve a referência visual e os fluxos das telas.
- `docs/pratica.md` — planejamento da prática, entregas, lacunas e restrição de escrita em produção; decisões revisadas no ADR-004 e specs 004/005.
- `docs/verificador.md` — execução isolada e provas do verificador; papel em `.codex/agents/verificador-spec.toml`.
- `rules/restrictions.md` — deve ser lido antes de qualquer tarefa.
- `docs/specs/<NNN-funcionalidade>/` — local previsto para spec, plano e tarefas de cada funcionalidade.
- `rules/operacao.md`, `rules/tests.md`, `rules/handoff.md` e `rules/spec-flow.md` — contrato, testes, continuidade e ciclo de funcionalidades; carregar conforme o gatilho de cada arquivo.

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
- Commit e push seguem `rules/operacao.md`; commits locais de tarefas autorizadas são permitidos.
- Não configure, publique ou altere recursos externos do Supabase, GitHub ou Vercel sem pedido explícito do usuário.

## Estado atual do projeto

O pedido de seguir com todas as pendências autoriza executar as etapas de
`docs/specs/001-login/plan.md` em sequência, verificando cada uma antes da próxima.
As permissões vigentes de Git estão em `rules/operacao.md`.

Em 06/nov/2026 foram solicitadas as specs e a documentação da prática. As regras de negócio confirmadas estão no ADR-004. Os planos 004/005 são propostas para revisão; essa solicitação documental não autoriza implementação, migration ou escrita externa. Pendências e sequência em `docs/pratica.md`.

Depois foi autorizada a primeira etapa: D01, infraestrutura do verificador. Sua demonstração local está em `docs/verificacoes/verificador/`; não autoriza as demais tarefas das specs 004/005. O verificador não usa terminal; os checks e recibos pertencem ao principal.

## Subagentes

Para conferir uma spec, usar `npm run verify:spec -- <caminho-da-spec> [caminho-das-evidencias]`, conforme `docs/verificador.md`. O lançador exige delegação real para `verificador-spec` em sessão separada com ferramentas de leitura. Não lançar este papel por herança da sessão de implementação irrestrita. Se o CLI/papel não estiver disponível, reportar BLOQUEADO e não simular verificação independente. Correções e gravação de relatórios pertencem ao principal; gatilho obrigatório em `rules/spec-flow.md`.

## Estrutura do código

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
- `npm run test:verificador` — testes locais de bloqueio do MCP e fixture do verificador, sem banco ou rede.
- `npm run verify:spec -- <spec.md> [evidencias.json]` — delegação independente de leitura; não executa a implementação.
- `npm run lint`, `npm run typecheck`, `npm run build` — verificação da aplicação.
- `npm run format:check` — formatação; `npx prettier --write` para formatar os arquivos de implementação.
- `npx playwright install chromium`, `npm run test:e2e` — instalação do navegador e E2E local.
- `npm run start` — execução do build de produção.

O deploy remoto depende das verificações locais. Credenciais nunca são impressas.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
