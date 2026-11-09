# Tarefas 005 — Catálogo, solicitação e aprovação

Em 09/nov/2026 o responsável restabeleceu três ativos (ADR-008), aprovou os contratos E00 e autorizou o próximo passo. Proposta SQL da E01 apresentada em proposta-e01.md; aprovação estrutural ainda pendente. Nenhuma API/tela/migration nova implementada.

- [x] E00 · Contratos/rotas/erros/desenho mínimo de proposta-e00.md aprovados expressamente pelo responsável em 09/nov/2026. Crédito reaproveita ADR-005; preservação de datas históricas mantida. Desenho/SQL exato da migration depende de aprovação em E01. Pré-requisito documental CA-E01–E13, sem evidência de implementação.
- [ ] E01 · Proposta SQL preparada em 09/nov/2026: proposta-e01.md, com enum/campo/default, cálculo versionado, CHECK/trigger, preservação e testes previstos. Aguardar aprovação antes de registrar ADR-009, alterar schema ou criar/testar a migration. CA-E12 ainda sem prova de execução.
- [ ] E02 · Implementar cálculo de 14 dias úteis com relógio controlável e casos de fronteira. CA-E07.
- [ ] E03 · Implementar consultas autorizadas de catálogo e dados próprios. CA-E01/E09.
- [ ] E04 · Implementar pedido pendente com limite/atraso e concorrência por equipamento. CA-E02/E03.
- [ ] E05 · Implementar aprovação transacional com revalidação, autorização, concorrência por pessoa/equipamento e auditoria. CA-E04/E05/E06.
- [ ] E06 · Implementar rejeição com motivo e testes de autorização/liberação. CA-E04/E08.
- [ ] E07 · Construir catálogo e Meus empréstimos, separando pedido de empréstimo e exibindo erros. CA-E01/E02/E03/E09.
- [ ] E08 · Construir tela mínima de decisão para Operações/Admin com estados de envio/erro. CA-E04/E10.
- [ ] E09 · Sincronizar textos/indicadores e specs de apresentação com regras revisadas. CA-E11.
- [ ] E10 · Rodar checks aplicáveis e verificador; registrar falhas e prova local com erro plantado/restaurado em dois commits. CA-E13.
- [ ] E11 · Operador publica versão validada; conferir fluxo com conta própria, preservar conta do professor e registrar evidências reais no ENTREGA.md. CA-E01/E05/E09/E10/E13.
