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

D02 também foi autorizada e verificada: skill local de imagens conforme ADR-005, sem upload. Evidências em `docs/verificacoes/imagens/`. Selecionar/revisar fotos reais, popular dados e criar conta seguem nas tarefas seguintes; não confundir a aprovação da ferramenta com a spec 004 pronta.

D03 concluída localmente: 12 imagens distintas 800×600, preparar/verificar e reexecução passaram. Evidências em docs/verificacoes/imagens/d03-final.md e d03-manifesto.json. TI-0003/TI-0004 substituídos; responsável confirmou foto de câmera de ação para TI-0012 e ilustração exclusivamente para TI-0007 (ADR-005/spec 004). D04 e escritas externas não fazem parte dessa autorização.

O pedido seguinte produziu a proposta D04 no commit c2f4b28. Depois o responsável aprovou explicitamente a implementação e os testes locais; decisões no ADR-006. Está autorizada somente D04: modelo/relações, nova migration e provas em PostgreSQL descartável. Nenhuma autorização de produção, D05/D06 ou push. Registrar a sequência real, sem afirmar execução anterior à proposta.

D04 implementada e testada localmente: `202611060001_equipment_images`, 48 testes de banco; recibo e ajustes técnicos em docs/verificacoes/imagens/d04-execucao.md. A migration exige infraestrutura Storage/roles já provisionada; testes simulam apenas essas tabelas no container e não provam Storage HTTP real. Tarefas posteriores/publicação continuam pendentes.

Em 07/nov/2026 o responsável autorizou D05 e confirmou interrupção do lote inteiro por conflito, antes do código. D05 implementada/testada somente em containers: quatro categorias, 12 equipamentos e 12 referências; reexecução sem alterações; 25 testes D05/73 de banco totais e checks gerais/build passaram. Regra 7 da spec 004 e docs/verificacoes/imagens/d05-execucao.md registram política/evidências. Seed atual permanece tenant-only. D06, produção e push não autorizados por esta etapa.

D06 autorizada depois, em 07/nov/2026, após esclarecer e aprovar reutilização de conta ativa compatível sem trocar senha. Implementada/testada localmente com identidade simulada e domínio em PostgreSQL real: 23 testes D06/96 de banco totais; checks gerais/build passaram. Regra 9 e plano da spec 004; evidências em docs/verificacoes/imagens/d06-execucao.md. Não há adaptador HTTP de administração remoto; não foi provado login real. Próximo: D07, com verificador independente e erro plantado/restaurado; D08 continua com operador. Não publicar nem executar push com base nesta etapa.

D07 autorizada/executada em 07/nov/2026, com registro contínuo pedido pelo responsável. Checks passaram; prova isolada plantada em 4e3c16b e restaurada em 80ddf07, com reprovação/aprovação independentes. Parecer integral docs/verificacoes/verificador/d07-integral.md: CA-D01/D02/D03/D04/D08 ATENDE; CA-D05/D06 SEM TESTE no destino real; CA-D07 BLOQUEADO por isolamento global não comprovado. Auditoria limitada não elimina esse bloqueio. Spec NÃO PRONTA; proposta-isolamento-d07.md aguarda decisão estrutural antes de configuração/ADR. Não afirmar que limitar os executores ou o verificador isola toda a sessão principal; nenhuma autorização de produção/push.

Depois, o responsável delegou expressamente ao agente a D08 no Supabase existente; ADR-007 registrado antes da execução. Conta do professor adiada por resposta explícita. Dados/imagens publicados: migration D04 aplicada, quatro categorias/12 equipamentos/referências, 12 GETs públicos verificados e escrita anônima negada; segunda execução zero uploads/novos registros. 98 testes de banco/13 unitários e checks gerais/build passaram. Parecer D08-R2: CA-D01/D02/D03/D04/D05/D08 ATENDE; CA-D06 SEM TESTE e CA-D07 NÃO ATENDE pela capacidade/uso de escrita real, mesmo autorizado. Spec NÃO PRONTA. Primeira rodada D08 bloqueada por escopo textual ambíguo foi preservada; lançador esclarecido sem mudar whitelist/permissões. Evidências docs/verificacoes/imagens/d08-* e verificador/d08-*. Não criar conta adiada, fazer push/deploy Vercel ou alegar isolamento global com base nesta exceção.

Em 09/nov/2026 o responsável restabeleceu três empréstimos ativos por pessoa, por volume/risco de não devolução ou prejuízo, e autorizou o próximo passo da spec 005. ADR-008 substitui somente o limite do ADR-004; aprovação e 14 dias úteis permanecem. PRD/specs/apresentação documental sincronizados; limite ainda não implementado no servidor. Rate limit de login e fixture isolada continuam com cinco, por serem contratos distintos. Contratos da E00 em docs/specs/005-solicitar-emprestimo/proposta-e00.md aprovados expressamente depois da apresentação no chat; próximo E01 deve apresentar/aprovar o SQL exato antes de implementação. Não tratar contratos/DDL como implementados ou republicar dados. Conta do professor permanece adiada; sem nova autorização de produção/push.

Após a proposta E01 do commit 86d8127, o responsável aprovou expressamente implementar/testar em 09/nov/2026. ADR-009 registrado antes do código; enum/campo due_rule e migration 202611090001_loan_due_rules implementados somente em containers. 28 testes novos/126 de banco totais e checks gerais/build passaram; evidências docs/verificacoes/e01-prazo.md e .json. Preserva legado/datas, exige úteis para novos e impede mudar datas/regra. SQL coincide com a aprovação; migrations anteriores intactas. Próximo E02, cálculo TypeScript; nenhuma API/tela nova ou aplicação no Supabase. O publicador D08 permanece com duas migrations na whitelist, sem autorização para publicar E01.

Em 09/nov/2026 o responsável autorizou E02 explicitamente. Cálculo TypeScript strict e relógio controlável implementados sem dependências novas em src/server/services/loan-due-date.ts. CA-E07 local: 15 testes novos unitários e três de comparação SQL (dez instantes em três fusos), incluindo DST histórico. Checks: 28 unitários/129 de banco, imagens/verificador, lint/tipos/formatação/build passaram; evidências docs/verificacoes/e02-calculo.md. Precisão Date em milissegundos; não recalcula legado. Próximo E03; integração à aprovação em E05, spec inteira NÃO PRONTA. Nenhuma alteração remota, push ou publicação autorizada por E02.

## Skills

Skills do projeto ficam em `skills/<nome>/SKILL.md`. Para descobrir capacidades, ler apenas name/description do frontmatter; carregar o corpo somente quando a tarefa casar e referências somente quando indicadas. `imagens-equipamentos` prepara fotos do inventário da prática pelo Pixabay; não altera logo/landing nem faz upload. Rules e ADRs prevalecem sobre a skill. Há uma única cópia versionada em `skills/imagens-equipamentos/`.

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
- `npx prisma format` — formatação do schema Prisma local; não aplica mudanças ao banco.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202610190001_initial/migration.sql` — geração inicial; SQL de segurança complementado na mesma migration.
- `npx prisma migrate diff --from-schema-datamodel .local/d04-schema-before.prisma --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202611060001_equipment_images/migration.sql` — geração offline da D04 aprovada; snapshot anterior à edição; complementar checks/policies/trigger na mesma migration. Sem introspecção remota.
- `npx prisma migrate diff --from-schema-datamodel .local/e01-schema-before.prisma --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202611090001_loan_due_rules/migration.sql` — E01 aprovada em 09/nov: geração offline executada, complementada pelo SQL aprovado; testar deploy somente no container descartável.
- `npm run db:deploy` — aplicação de migrations no destino configurado.
- `npm run db:seed` — seed idempotente.
- `npm run test:db` — banco local descartável via Testcontainers; nunca usa o banco remoto.
- `npm run dados:local` — D05: valida os arquivos reais D03 e popula duas vezes em container próprio descartável, sem aceitar URL de banco; recibo ignorado em `.local/d05-local.json`.
- `npm run conta:local` — D06: identidade simulada e perfil/vínculo em container próprio; reexecução sem alterar senha/IDs/timestamps, sem aceitar destino remoto; recibo `.local/d06-local.json`. Não comprova login real no Supabase.
- `npm run publicar:pratica -- --project=gverauqgerwjwwjkoybl --apply` — EXCEÇÃO D08/ADR-007, publicação real delegada, com validação de destino/conflitos; nunca é um comando de testes. Não cria conta do professor. Recibo sanitizado `.local/d08-publicacao-*.json`.
- `npm test` — testes unitários.
- `npm run test:verificador` — testes locais de bloqueio do MCP e fixture do verificador, sem banco ou rede.
- `node --test tests/verificador/fixture.test.mjs` — demonstração D07 isolada, com falha proposital/restauração e recibos distintos; não usar contra a aplicação ou produção.
- `npm run verify:spec -- <spec.md> [evidencias.json]` — delegação independente de leitura; não executa a implementação.
- `npm run imagens -- buscar|baixar|preparar|verificar` — pipeline local da skill; argumentos em `skills/imagens-equipamentos/references/pipeline.md`. Não tem upload.
- `npm run test:imagens` — imagens sintéticas e respostas de API simuladas, sem Supabase ou chave real.
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
