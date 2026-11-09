# Plano 005 — Solicitação com aprovação

Status: E00 aprovada e E01 aprovada/implementada/testada localmente em 09/nov/2026. Decisão estrutural ADR-009, migration 202611090001_loan_due_rules, provas em docs/verificacoes/e01-prazo.md. E02 autorizada e implementada/testada localmente; provas em docs/verificacoes/e02-calculo.md. E03 implementada/testada localmente: cinco consultas, provas em docs/verificacoes/e03-consultas.md. Próxima tarefa E04; limite três permanece. Mutações/telas e publicação da migration ainda pendentes; executar/verificar uma tarefa por vez.

1. Fechar rotas, procedimentos, mensagens, crédito das fotos e política de empréstimos existentes. Dependências: skill/verificador e dados da spec 004.
2. Apresentar mudança da constraint de prazo e eventuais funções/índices adicionais; manter relações de aprovação, tenant, unicidade e auditoria do ADR-003. Criar nova migration depois de aprovada, sem editar a inicial.
3. Implementar e testar cálculo puro de dias úteis conforme ADR-004, incluindo fins de semana, ano/mês e fuso. Prisma mantém timestamps; critério funcional é horário de São Paulo.
4. Implementar leitura autorizada do catálogo, pedidos e empréstimos próprios via tRPC/service, com tipo inferido conforme ADR-001.
5. Implementar pedido pendente, validação e exclusividade; rejeição com motivo; aprovação com locks/transação suficientes para concorrência por equipamento e por solicitante. Mecanismo exato será apresentado com DDL/plano detalhado.
6. Criar catálogo, Meus empréstimos e tela mínima de aprovação no design system; sincronizar textos do login/landing para três itens e 14 dias úteis; manter indicadores com três segmentos. Não construir tela completa de Operações.
7. Testar regras positivas/negativas, autenticação, isolamento, concorrência e rollback em banco descartável; E2E confirma interface e transições. Rodar checks e verificador sem acesso remoto de escrita.
8. Preparar publicação pelo operador, registrar evidências com conta própria e manter conta do professor sem empréstimos. Atualizar ENTREGA.md sem afirmar conclusão local como produção.

## E01 — proposta apresentada

`proposta-e01.md` preserva a versão apresentada em 86d8127 e aprovada posteriormente. Comando offline executado, schema alterado e SQL aprovado aplicado somente em containers. 28 testes novos e 126 de banco totais passaram; migrações anteriores intactas. O comando executado está no AGENTS, com snapshots/resultados locais ignorados e recibo versionado.

Aprovação recebida foi somente para implementação/testes em PostgreSQL descartável; ADR-009 foi registrado antes do código. Não inclui Supabase, publicação, push ou E02. Reusar os contratos E00 e as respostas sobre limite/calendário; não reabrir essas decisões.

## E03 — arquivos e execução autorizada

Próximo passo autorizado pelo responsável após E02. Sem novas ambiguidades de negócio: implementar somente as cinco consultas aprovadas na E00. Antes do código: novos routers `src/server/api/routers/catalogue.ts`, `loans.ts`, `requests.ts`; services `src/server/services/catalogue.ts`, `loans.ts`, `requests.ts`, `read-access.ts` e `read-input.ts`; alterar `src/server/api/root.ts` e `trpc.ts` para registro/contexto Prisma e erro interno contextual. Testes em `tests/db/domain-reads.test.ts`, com alias de src em `vitest.db.config.ts`; evidências em `docs/verificacoes/e03-consultas.md` e continuidade neste plano/spec/tasks/AGENTS/handoff.

Detalhes técnicos dentro dos contratos E00: cursor UUID opaco, resolvido sob o mesmo escopo/filtros; cursor ausente/inacessível gera BAD_REQUEST genérico. Catálogo por patrimônio/ID crescente; empréstimos por início decrescente/ID crescente; pedidos por solicitação decrescente/ID crescente. Retorno `{items, nextCursor}`; limite padrão 12, máximo 48. Inputs de objeto estritos impedem selecionar pessoa/tenant. Consultas revalidam vínculo/perfil/tenant ativos no banco. Catálogo inclui equipamentos/categorias ativos e imagem ativa, sem identidade do solicitante/tomador; empréstimos próprios permanecem visíveis mesmo se equipamento for desativado posteriormente. Sem mudança de schema, dependência, UI, mutação ou publicação externa.

Formato implementado: catálogo retorna `operational_status` e `availability` (`AVAILABLE`, `MAINTENANCE`, `OUT_OF_SERVICE`, `LOANED`, `PENDING`), categoria e metadados públicos da imagem/crédito. Resumo retorna `activeCount`, `maxActive: 3`, `hasOverdue`; igualdade entre relógio e vencimento ainda não é atraso. Empréstimos retornam datas armazenadas, versão de prazo e equipamento; pedidos retornam status/datas/motivo/equipamento, sem prazo. Paginação de timestamps usa cursor nativo Prisma para comparar a precisão completa no SQL, sem transformar Date truncado em fronteira de consulta. DTOs de cliente continuam inferidos do AppRouter. Evidências de execução em docs/verificacoes/e03-consultas.md.
