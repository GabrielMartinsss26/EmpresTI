# Plano 005 — Solicitação com aprovação

Status: contratos E00 aprovados em 09/nov/2026; limite três vigente no ADR-008. Próximo passo solicitado produziu proposta-e01.md com SQL exato e efeitos; aguardar aprovação estrutural antes de schema/migration. APIs/telas ainda não implementadas; executar e verificar uma tarefa por vez.

1. Fechar rotas, procedimentos, mensagens, crédito das fotos e política de empréstimos existentes. Dependências: skill/verificador e dados da spec 004.
2. Apresentar mudança da constraint de prazo e eventuais funções/índices adicionais; manter relações de aprovação, tenant, unicidade e auditoria do ADR-003. Criar nova migration depois de aprovada, sem editar a inicial.
3. Implementar e testar cálculo puro de dias úteis conforme ADR-004, incluindo fins de semana, ano/mês e fuso. Prisma mantém timestamps; critério funcional é horário de São Paulo.
4. Implementar leitura autorizada do catálogo, pedidos e empréstimos próprios via tRPC/service, com tipo inferido conforme ADR-001.
5. Implementar pedido pendente, validação e exclusividade; rejeição com motivo; aprovação com locks/transação suficientes para concorrência por equipamento e por solicitante. Mecanismo exato será apresentado com DDL/plano detalhado.
6. Criar catálogo, Meus empréstimos e tela mínima de aprovação no design system; sincronizar textos do login/landing para três itens e 14 dias úteis; manter indicadores com três segmentos. Não construir tela completa de Operações.
7. Testar regras positivas/negativas, autenticação, isolamento, concorrência e rollback em banco descartável; E2E confirma interface e transições. Rodar checks e verificador sem acesso remoto de escrita.
8. Preparar publicação pelo operador, registrar evidências com conta própria e manter conta do professor sem empréstimos. Atualizar ENTREGA.md sem afirmar conclusão local como produção.

## E01 — proposta apresentada

`proposta-e01.md` detalha o enum/campo de versão do prazo, defaults de corte, função/CHECK/trigger, impacto em registros/atualizações, lock e plano de testes. Comando offline de geração proposto no documento, ainda não executado. SQL somente em Markdown: não há nova migration nem mudança no schema atual.

Aprovação solicitada é para implementação/testes em PostgreSQL descartável; não inclui Supabase, publicação, push ou E02. Se aprovada, registrar a decisão estrutural em ADR antes do código, conforme regras existentes. Reusar os contratos E00 e as respostas sobre limite/calendário; não reabrir essas decisões.
