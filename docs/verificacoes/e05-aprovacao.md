# E05 — Aprovação e criação transacional do empréstimo

Em 09/nov/2026 o responsável autorizou o próximo passo após E04. Plano/arquivos/ordem dos locks/auditoria registrados antes do código no plano 005. Reutiliza contratos E00, calendário E02 e regra versionada E01; sem DDL, biblioteca nova ou decisão estrutural pendente.

## Implementação

Router requests expõe approve com objeto estrito requestId UUID e pending com paginação 12/48. operationsProcedure aceita somente OPERATIONS/ADMIN; services também reconsultam papel e vínculo/perfil/tenant ativos. Tenant e ator vêm da sessão; papel forjado/antigo no contexto não autoriza quem está sem permissão no banco.

Pendentes são somente do tenant e trazem dados mínimos do equipamento e nome/situação ativa do solicitante para decidir, sem e-mail/user_id/dados de outro tenant. Cursor é validado no mesmo escopo PENDING, ordenado por data ascendente/ID, com comparação nativa SQL das datas.

Aprovação localiza o pedido no tenant e abre transação ReadCommitted. Bloqueia vínculos de solicitante e ator em ordem UUID, antes do equipamento e pedido; perfil/tenant/categoria com locks compartilhados. Isso mantém vínculo→equipamento da E04, serializa aprovações por solicitante e evita ciclos entre vínculos adicionais de aprovadores. Revalida IDs previamente lidos, papel atual, ativos, PENDING, equipamento disponível, ausência de empréstimo ativo, limite três e atraso do solicitante.

Relógio do servidor capturado uma vez depois dos locks. createLoanPeriod calcula 14 úteis seg–sex sem feriados em São Paulo, mantendo horário. Update do pedido exige requested_at <= relógio no SQL, inclusive microssegundos, e usa o mesmo instante para decided_at/checked_out_at. Cria Loan com BUSINESS_14_SP e auditoria loan_request.approved, recurso loan_request, ID do pedido, ator/tenant da sessão, metadata equipment_id/loan_id. Tudo na mesma transação. Retorno de decisão/empréstimo no plano; não recalcula datas históricas.

Índices e triggers existentes continuam protegendo relações/exclusividade/prazo. Unicidade/serialização/deadlock/timeout de lock viram CONFLICT sem retry cego; lock_timeout 3s, transação 10s. Repetição informa decisão já registrada; tenant externo/ID ausente NOT_FOUND. Falha na criação do Loan ou auditoria desfaz a decisão e demais efeitos. Mensagens E00 preservadas.

## Provas locais

`tests/db/request-approval.test.ts`: 30 testes novos com PostgreSQL descartável e todas as migrations Prisma. Dados/identidades e contexto/Auth são simulados; prova HTTP executa adaptador tRPC real com esse contexto e banco local. Não comprova login real ou operação no Supabase.

- OPERATIONS e ADMIN aprovam com ator correto e prazo fixo esperado 09/nov/2026 → 27/nov/2026, preservando horário/milissegundos; relógio chamado uma vez, Loan e decisão relacionados e auditoria com IDs corretos.
- Colaborador não lista/decide; sessão/vínculo ausentes, contexto incompatível, papel forjado ou demovido recusados. Isolamento de tenant em consulta/cursor/decisão.
- Revalidação de desativação de ator/solicitante/perfis/tenant/equipamento/categoria, manutenção/fora de uso e empréstimo ativo surgido no item.
- Três/quatro ativos surgidos após o pedido impedem aprovação; dois permitem terceiro. Devolvido/outros solicitantes não contam; devolução apenas solicitada continua ativa. Atraso bloqueia abaixo do teto; igualdade de vencimento não é atraso.
- Dois aprovadores para um pedido: um empréstimo/evento. Duas aprovações de itens distintos para quem tem dois ativos: uma aprova, outra FORBIDDEN, máximo três e um pedido continua pendente.
- Decisão repetida/rejeitada não aprova/duplica. Clock regressivo e fração de microssegundos não aprovam antes de requested_at.
- Triggers sintéticos de falha de INSERT em loans e audit_logs, somente no container, provam rollback integral e reexecução depois da remoção. Nenhuma proteção do domínio foi desabilitada.
- Lock de equipamento ocupado provoca CONFLICT sem decisão parcial e libera tentativa posterior. HTTP 403 para colaborador, 200 de aprovação e 409 na repetição com corpo/código conferidos.

## Limites

Checks: `npm run test:db -- tests/db/request-approval.test.ts` passou com os 28 casos iniciais (11,20 s); depois foram incluídas fronteira de microssegundos e lock ocupado. `npm run test:db` passou com 210 testes em nove arquivos, incluindo os 30 desta etapa (124,02 s). `npm test`: 28; `npm run test:imagens`: dez; `npm run test:verificador`: sete. Lint, typecheck, format:check, build e git diff --check passaram. Build conserva aviso pré-existente de depreciação da configuração Prisma em package.json.

Servidor local reiniciado depois do build na porta 3000; login sem sessão conferido HTTP 200. Não foi feita aprovação real no Supabase como teste.

CA-E03/E04/E05/E06/E07 têm provas locais nesta parcela de API; rejeição E06 e tela de decisões E08 ainda pendentes. Spec 005 inteira NÃO PRONTA; verificador integral continua E10. Nenhuma UI alterada/E2E visual repetido. Nenhum push, deploy, consulta ou escrita remota; E01 segue somente local e publicação futura E11 exige autorização. Conta do professor permanece adiada. Próximo E06: rejeição com motivo.
