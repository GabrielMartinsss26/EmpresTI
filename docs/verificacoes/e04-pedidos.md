# E04 — Solicitação pendente transacional

Em 09/nov/2026 o responsável autorizou a próxima tarefa após E03. Plano/arquivos/locks/auditoria registrados antes do código no plano 005, reutilizando E00 e ADRs 001/003/004/008/009. Não houve nova decisão estrutural, ambiguidade de negócio, dependência ou DDL.

## Implementação e contratos

`requests.create` valida objeto estrito com somente equipmentId UUID. Router injeta pessoa, vínculo, tenant e Prisma do contexto. `createRequest` no service de pedidos abre transação ReadCommitted; bloqueia vínculo do solicitante antes do equipamento. Perfil/tenant/categoria recebem locks compartilhados, impedindo desativação concorrente durante a criação. Registros ativos e vínculos são conferidos novamente no banco, sem confiar em valores antigos do contexto.

Depois dos locks, captura uma vez o relógio do servidor e consulta contagem/atraso dos empréstimos ativos próprios no tenant. Três ou mais ativos bloqueiam; abaixo disso, atraso também bloqueia. Devolução solicitada sem confirmação continua ativa; devolvidos e empréstimos de outra pessoa não contam. Pedidos pendentes não consomem o limite de empréstimos. Igualdade entre vencimento e relógio não é atraso; comparação ocorre no SQL com a precisão armazenada.

Equipamento/categoria desativados, ID inexistente ou de outro tenant recebem o mesmo NOT_FOUND. Manutenção, fora de uso, empréstimo ativo e pedido pendente recebem CONFLICT genérico sem identidade de terceiros. Item liberado após rejeição/devolução pode receber outro pedido, mantendo o histórico.

Criação grava somente LoanRequest PENDING, sem decisão, Loan ou due_at. Retorno mínimo id/equipment_id/status/requested_at. Auditoria na mesma transação: loan_request.created, recurso loan_request, ID do pedido, ator/tenant do contexto e metadata equipment_id. Falha de auditoria desfaz a inserção. Não é criada aprovação automática.

Lock timeout local de três segundos e transação de dez segundos. Índice parcial existente continua protegendo duplicação. Conflitos de unicidade/lock/deadlock/serialização são tratados como CONFLICT, sem retry automático. Nenhuma migration foi alterada; E05 precisa seguir a mesma ordem por solicitante/equipamento ao aprovar.

## Provas CA-E02/E03

`tests/db/request-create.test.ts`: 27 testes novos em PostgreSQL descartável com todas as migrations via Prisma Migrate. Contexto/Auth simulados, identidades/dados sintéticos; nenhum teste no Supabase. Prova HTTP usa adaptador tRPC real com contexto simulado e banco local, não autenticação real. E03 já exercita o Route Handler existente e a proteção de origem; E04 não altera esse handler.

- Criação pendente/auditoria e ausência de empréstimo/prazo; reflexo imediato nas consultas E03.
- Zero/um/dois ativos permitem; três/quatro recusam sem efeitos; atraso/igualdade de vencimento, devolução solicitada, devolvidos e empréstimos de outras pessoas.
- Quatro pedidos pendentes não são quatro empréstimos e não impedem pedir outro item disponível.
- Manutenção, fora de uso, item ocupado, repetição, desativação, rejeição prévia e isolamento de tenant; autoria/papel/tenant não aceitos pelo input.
- Sessão/vínculo ausentes, contexto incompatível e perfil/vínculo/tenant desativados depois da sessão.
- Duas chamadas concorrentes da mesma pessoa ou de pessoas diferentes para o mesmo equipamento: um pedido, uma auditoria, nenhum Loan, outra chamada CONFLICT.
- Trigger de falha criado somente no container impede inserir auditoria; prova rollback integral e nova tentativa válida depois de remover a fixture. Não relaxa triggers do domínio.
- Transação concorrente segura lock de equipamento; timeout real produz CONFLICT sem pedido/auditoria, solta os locks e permite tentar novamente depois.
- HTTP tRPC 200/PENDING e 409/CONFLICT na repetição, sem stack ou vencimento inventado.

## Limites

Checks: `npm run test:db -- tests/db/request-create.test.ts` passou com os 26 casos iniciais (12,51 s); depois foi acrescida prova HTTP e `npm run test:db` passou com 180 testes em oito arquivos, incluindo os 27 desta etapa (108,59 s). `npm test`: 28; `npm run test:imagens`: dez; `npm run test:verificador`: sete. `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` e `git diff --check` passaram. Build conserva aviso pré-existente de depreciação da configuração Prisma em package.json.

Servidor local reiniciado após build na porta 3000; login sem sessão HTTP 200. Não foi executado pedido real no Supabase para comprovar a etapa.

E04 conclui criação de pedido na API; não implementa aprovação/rejeição, limite na aprovação, novas telas ou prazo de empréstimo em execução. CA-E03 completo ainda exige revalidação na aprovação E05. Spec 005 inteira NÃO PRONTA; verificador integral permanece E10. Próximo E05, aguardando autorização própria. Sem publicação, push ou acesso remoto. E01 permanece local, não aplicada no Supabase. Nenhuma interface foi alterada, E2E visual não repetido.
