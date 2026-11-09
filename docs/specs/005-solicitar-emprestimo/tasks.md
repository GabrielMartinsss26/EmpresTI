# Tarefas 005 — Catálogo, solicitação e aprovação

Em 09/nov/2026 o responsável restabeleceu três ativos, aprovou E00 e depois a proposta SQL E01 de 86d8127. E01 implementada/testada somente em PostgreSQL descartável, conforme ADR-009. E02 também autorizada e implementada/testada localmente; provas em docs/verificacoes/e02-calculo.md. E03 também autorizada e implementada/testada localmente: cinco consultas. E04 autorizada e implementada/testada localmente: pedido PENDING com limite/atraso, concorrência e auditoria; sem telas/publicação; próxima tarefa E05.

- [x] E00 · Contratos/rotas/erros/desenho mínimo de proposta-e00.md aprovados expressamente pelo responsável em 09/nov/2026. Crédito reaproveita ADR-005; preservação de datas históricas mantida. Desenho/SQL exato da migration depende de aprovação em E01. Pré-requisito documental CA-E01–E13, sem evidência de implementação.
- [x] E01 · Proposta 86d8127 aprovada; ADR-009 registrado antes do código. Migration 202611090001_loan_due_rules e campo de versão implementados/testados em PostgreSQL descartável: 28 testes novos/126 totais, upgrade e banco vazio, preservação de microssegundos/histórico, devolução legada, guard, funções/privilégios, falhas atômicas e controle negativo com rollback. Checks gerais/build passaram. CA-E12 local; recibo/execução em docs/verificacoes/e01-prazo.*. Nenhuma aplicação remota; naquele encerramento E02/E05 ainda não estavam implementadas.
- [x] E02 · Cálculo TypeScript puro e relógio controlável, sem dependências novas. Casos fixos de calendário, feriados não descontados, precisão em milissegundos e fuso/DST histórico; comparação com SQL em PostgreSQL descartável. CA-E07 local; evidências em docs/verificacoes/e02-calculo.md. Integração à aprovação permanece em E05.
- [x] E03 · Cinco consultas tRPC/service/Prisma, filtros/paginação e revalidação de acesso implementados/testados em PostgreSQL descartável: 24 testes novos/153 de banco totais. Parcela de leitura/API de CA-E01/E09, sem telas/mutações ou acesso remoto; evidências em docs/verificacoes/e03-consultas.md.
- [x] E04 · requests.create transacional com limite/atraso, isolamento, locks e auditoria atômica. 27 testes novos/180 de banco totais; CA-E02 e parcela de solicitação de CA-E03 locais, sem UI/aprovação/remoto; evidências docs/verificacoes/e04-pedidos.md.
- [ ] E05 · Implementar aprovação transacional com revalidação, autorização, concorrência por pessoa/equipamento e auditoria. CA-E04/E05/E06.
- [ ] E06 · Implementar rejeição com motivo e testes de autorização/liberação. CA-E04/E08.
- [ ] E07 · Construir catálogo e Meus empréstimos, separando pedido de empréstimo e exibindo erros. CA-E01/E02/E03/E09.
- [ ] E08 · Construir tela mínima de decisão para Operações/Admin com estados de envio/erro. CA-E04/E10.
- [ ] E09 · Sincronizar textos/indicadores e specs de apresentação com regras revisadas. CA-E11.
- [ ] E10 · Rodar checks aplicáveis e verificador; registrar falhas e prova local com erro plantado/restaurado em dois commits. CA-E13.
- [ ] E11 · Operador publica versão validada; conferir fluxo com conta própria, preservar conta do professor e registrar evidências reais no ENTREGA.md. CA-E01/E05/E09/E10/E13.
