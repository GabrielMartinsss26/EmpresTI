# E06 — Rejeição com motivo e auditoria

Em 09/nov/2026 o responsável autorizou o próximo passo após E05. Arquivos, locks, retorno e evento de auditoria registrados antes do código no plano 005. Reutiliza E00 e a política de ativos/ordem de bloqueios da E05. Sem nova dependência, DDL, interface ou decisão estrutural.

## Implementação

requests.reject usa operationsProcedure e objeto estrito `{requestId, reason}`. Motivo recebe trim e exige 1–500 caracteres; o mesmo schema é aplicado no router e no service. Ator/tenant vêm da sessão. Service reutiliza assertDecisionMaker da E05 e revalida papel OPERATIONS/ADMIN e registros ativos sob lock.

Transação ReadCommitted bloqueia vínculos solicitante/ator por UUID antes de equipamento e pedido, com perfil/tenant/categoria compartilhados, igual à aprovação. Mantém política de registros ativos já utilizada; manutenção/fora de uso não impedem rejeitar. Não exige limite/ausência de atraso para encerrar por rejeição, pois não cria empréstimo. Revalida IDs, PENDING e requested_at <= relógio do servidor no SQL, incluindo precisão de microssegundos.

Grava status REJECTED, motivo normalizado, decided_at e ator. Na mesma transação grava loan_request.rejected, recurso loan_request, ID do pedido, ator/tenant do contexto e metadata somente equipment_id. Motivo fica no pedido, sem cópia desnecessária no log. Retorno id/status/decided_at/rejection_reason. Falha da auditoria desfaz a decisão. Timeouts/conflitos seguem E05: lock 3s, transação 10s, sem retry automático.

Não cria ou altera Loan, estado operacional ou cadastro do equipamento. O índice de exclusividade deixa de bloquear novo pedido porque o anterior não é mais PENDING; disponibilidade continua derivada de operação/empréstimo/pedidos. Item em manutenção ou já emprestado permanece indisponível. Repetição não altera motivo/decisão anterior; aprovação/rejeição concorrentes compartilham locks e apenas uma vence.

## Provas CA-E04/E08

`tests/db/request-rejection.test.ts`: 31 testes novos, PostgreSQL real descartável com todas as migrations Prisma, identidades/contexto/Auth simulados. HTTP usa adaptador tRPC real com esse contexto e banco local, sem login ou escrita real no Supabase.

- OPERATIONS/ADMIN rejeitam com motivo trimado, data/ator corretos e relógio capturado uma vez, sem Loan; consultas próprias exibem motivo e lista de pendentes remove o pedido.
- Motivo vazio/whitespace/ausente/tipo inválido/mais de 500 recusado; fronteiras um e 500 aceitas após trim. Inputs não aceitam autoria ou tenant do cliente.
- Colaborador, papel forjado/revogado, sessão/vínculo ausentes, contexto incompatível e tenant externo não decidem; UUID inexistente responde como externo.
- Registros desativados de ator/solicitante/perfis/tenant/equipamento/categoria revalidados, mantendo política ativa da E05.
- Novo requests.create no item disponível comprova liberação e preservação integral do pedido rejeitado anterior. Manutenção/fora de uso e empréstimo ativo não são desfeitos pela rejeição; Loan existente permanece idêntico. Teto/atraso do solicitante não bloqueiam rejeitar.
- Repetição/rejeição após aprovação não alteram decisão, motivo ou Loan. Duas rejeições resultam em um evento. Aprovar versus rejeitar resulta em uma decisão/evento e Loan somente se APPROVED.
- Trigger sintético de falha em audit_logs somente no container comprova rollback integral e HTTP 500 sem detalhe interno; remoção da fixture permite tentar novamente, sem desabilitar proteção do domínio.
- Relógio anterior ao pedido/microssegundos e lock ocupado não deixam decisão parcial; timeout libera tentativa posterior.
- HTTP 400 para motivo inválido, 403 para colaborador, 200/REJECTED e 409/CONFLICT na repetição, com código/corpo verificados.

## Limites

Checks: `npm run test:db -- tests/db/request-rejection.test.ts`: 31 passaram (14,10 s). `npm run test:db`: 241 passaram em dez arquivos (135,56 s). `npm test`: 28; `npm run test:imagens`: dez; `npm run test:verificador`: sete. `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` e `git diff --check` passaram. Build conserva aviso pré-existente de depreciação da configuração Prisma em package.json.

Servidor local reiniciado após build na porta 3000; login sem sessão conferido HTTP 200. Nenhuma rejeição real no Supabase foi executada para comprovar esta etapa.

CA-E04/E08 possuem provas de API locais, sem tela de decisão (E08). Spec 005 inteira NÃO PRONTA; verificador integral E10 depois das demais tarefas. Nenhum push, deploy ou acesso remoto; E01 permanece local, publicação futura E11 exige autorização própria. Professor adiado. Nenhuma UI mudou, E2E visual não repetido. Próximo E07: catálogo e Meus empréstimos conforme design system e contratos já aprovados.
