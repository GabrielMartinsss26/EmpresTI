# Spec 005 — Catálogo, solicitação e aprovação

Status: contratos da E00 aprovados expressamente em 09/nov/2026, registrados em proposta-e00.md, ainda sem implementação. Limite de três confirmado pelo ADR-008; aprovação e prazo do ADR-004 preservados. Desenho/SQL exato da migration precisa de aprovação em E01 antes do código correspondente.

## Objetivo

Permitir ao colaborador consultar equipamentos, solicitar um disponível e acompanhar pedidos/empréstimos. Operações ou Admin decide a solicitação em uma tela mínima; apenas a aprovação cria o empréstimo.

## Vínculo

PRD revisado, ADR-001, ADR-002, ADR-003 parcialmente substituído pelos ADRs 004 e 008; spec 004 (dados e fotos) e 001 (identidade). Briefing de solicitar empréstimo adaptado por decisão explícita do responsável.

## Regras

1. Perfil, vínculo e tenant ativos são obrigatórios. Tenant, solicitante e aprovador vêm da sessão, nunca do input do cliente.
2. Catálogo apresenta imagem, nome, categoria e situação dos equipamentos ativos do tenant. Manutenção continua visível, sem ação permitida. Empréstimo ativo e pedido pendente impedem oferecer o item a outra pessoa; estado pendente deve ser distinguido de emprestado.
3. Solicitar um equipamento disponível cria somente `LoanRequest` PENDING. Não cria Loan nem inicia prazo. No máximo um pedido pendente por equipamento, sem fila.
4. Uma pessoa com três ou mais empréstimos ativos ou com qualquer empréstimo em atraso não pode solicitar nem ter novo pedido aprovado. Pedidos pendentes não contam como empréstimos; a aprovação revalida o limite.
5. Operações/Admin do mesmo tenant vê solicitações pendentes e pode aprovar ou rejeitar em uma tela mínima. COLLABORATOR não pode decidir, nem contornar a restrição chamando a API.
6. Aprovação revalida estado, desativação, tenant, limite, atraso e estado PENDING. Pedido aprovado, criação do empréstimo e auditoria acontecem na mesma transação.
7. Vencimento: 14 dias úteis a partir da aprovação, segunda a sexta, sem feriados. Não contar o dia da aprovação; avançar até o 14º dia útil e manter horário local em America/Sao_Paulo. Guardar o instante final em `due_at`.
8. Rejeição exige motivo, preenche autor/data e não cria empréstimo; libera a exclusividade do pedido pendente se o equipamento continuar operacionalmente disponível.
9. Concorrência não pode criar dois pedidos pendentes por equipamento nem dois empréstimos ativos. Aprovações simultâneas de equipamentos diferentes para a mesma pessoa também respeitam o teto de três.
10. Colaborador consulta somente os próprios pedidos e empréstimos. Meus empréstimos apresenta itens ativos e vencimento; solicitação pendente é exibida como pedido, sem vencimento inventado.
11. Recusas mostram motivo compreensível (limite, atraso, indisponibilidade ou decisão sem permissão), sem dados de outro usuário/tenant. Mensagens e contratos aceitos estão em proposta-e00.md, seção de estados/mensagens.
12. Preservar aprovação, relações compostas, índice parcial de empréstimo ativo e histórico. Nova regra não autoriza editar migration inicial nem recalcular empréstimos históricos.
13. Reutilizar design system desktop, atualizando textos e indicadores para três itens e 14 dias úteis, inclusive login e landing. Decisões visuais conflitantes ficam registradas antes do código.

## Critérios de aceitação

- CA-E01 · Catálogo do tenant apresenta os 12 itens iniciais com suas fotos; TI-0004, TI-0007 e TI-0010 aparecem em manutenção e não aceitam pedido, inclusive por chamada direta.
- CA-E02 · Solicitar disponível cria um pedido PENDING e nenhuma linha Loan. Nova tentativa concorrente para o mesmo item não cria segundo pedido; item fica identificado como pendente.
- CA-E03 · Pessoa com três ou mais empréstimos ativos ou com atraso tem solicitação recusada com motivo. Dois ativos sem atraso podem receber aprovação do terceiro, nunca do quarto.
- CA-E04 · COLLABORATOR não aprova/rejeita via tela ou API; Operações/Admin de outro tenant não vê nem decide o pedido.
- CA-E05 · Aprovar PENDING válido cria exatamente um empréstimo, resolve o pedido e grava auditoria atomicamente; falha desfaz todos os efeitos. Repetir a decisão não duplica empréstimo.
- CA-E06 · Aprovação revalida limite, atraso, disponibilidade e registros ativos. Duas aprovações concorrentes para pessoa com dois ativos resultam em no máximo três ativos; equipamento não tem dois empréstimos ativos.
- CA-E07 · Cálculo de vencimento ignora fins de semana, mantém horário local e conta do dia útil seguinte, sem feriados. Casos fixos incluem: aprovação segunda 09/nov/2026 10h vence sexta 27/nov/2026 10h; aprovação sexta 06/nov/2026 10h vence quinta 26/nov/2026 10h, em São Paulo; testar também virada de mês/ano e aprovação em fim de semana.
- CA-E08 · Rejeitar sem motivo falha; rejeição válida registra motivo/ator/data, não cria empréstimo e permite novo pedido se o item estiver disponível.
- CA-E09 · Meus empréstimos exibe somente os ativos da pessoa e o vencimento correto; pedidos pendentes aparecem separados, sem prazo. Isolamento comprovado em API e banco, não apenas escondendo controles.
- CA-E10 · Tela mínima de decisão permite Operações/Admin aprovar/rejeitar e mostra o resultado/erro; clique repetido não gera duplicação. Sem sessão, rotas protegidas retornam ao login.
- CA-E11 · Login, landing e catálogo anunciam três itens e 14 dias úteis; não apresentam cinco ativos nem 14 dias corridos como regra vigente. Componentes preservam tokens do ADR-002; crédito discreto já aprovado no ADR-005.
- CA-E12 · Migration de prazo funciona desde banco vazio e sobre fixture da versão anterior conforme política histórica aprovada, sem perda de dados. Suíte usa PostgreSQL descartável, nunca Supabase do deploy.
- CA-E13 · Verificador independente confere todos os critérios com evidências e registra reprovações reais e prova com erro plantado/restaurado. Itens sem prova ficam pendentes; não aprovar empréstimo na conta do professor.

## Diferenças deliberadas em relação ao briefing

Aprovação mantida após avaliação pelo responsável: o empréstimo não é criado na hora. Por isso a prática inclui tela mínima de decisão e diferencia pedido de empréstimo. Em 06/nov foram aceitos cinco ativos e 14 dias úteis; em 09/nov o responsável reconsiderou o volume/risco e voltou a três ativos (ADR-008), mantendo o prazo. Três itens em manutenção foram confirmados. Não simular autoaprovação nem usar a conta do colaborador como aprovador para esconder a diferença.

## Fora de escopo

Devolução, tela completa de Operações, cadastro de equipamentos por interface, fila/reserva futura, e-mail, renovação, convites e autocadastro. A tela mínima de aprovação/rejeição é exceção explícita ao recorte do briefing, aprovada pelo responsável.

## Contrato afetado e pendências

Catálogo protegido, nova tela mínima de aprovação/rejeição, Meus empréstimos e routers/services tRPC correspondentes, mantendo Router → Service → Prisma. Procedimentos, rotas e mensagens aprovados em proposta-e00.md. DDL exato ainda depende de apresentação e aprovação em E01.

O banco atual exige `loan_due_14_days` com 14 dias corridos: nova migration é necessária. Não recalcular datas históricas já está definido; mecanismo da migration e desenho detalhado seguem para aprovação. Crédito discreto está aprovado no ADR-005 e metadados/Storage foram implementados nos ADRs 006/007/spec 004. Nenhum critério desta spec tem evidência de implementação ainda.
