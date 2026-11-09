# Plano 005 — Solicitação com aprovação

Status: E00 aprovada e E01 aprovada/implementada/testada localmente em 09/nov/2026. Decisão estrutural ADR-009, migration 202611090001_loan_due_rules, provas em docs/verificacoes/e01-prazo.md. Próxima tarefa E02; limite três permanece. APIs/telas e publicação da migration ainda pendentes; executar/verificar uma tarefa por vez.

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
