# E01 — Prazo versionado em PostgreSQL descartável

## Aprovação e escopo

Em 09/nov/2026 o responsável aprovou explicitamente implementar/testar o desenho apresentado em `86d8127`. ADR-009 registrado antes do código. Não houve consulta ou escrita no Supabase, publicação, push ou implementação da E02 nesta etapa.

Foram adicionados enum `LoanDueRule`, campo `Loan.due_rule` e migration `202611090001_loan_due_rules`. O SQL executável corresponde ao bloco aprovado em proposta-e01.md; o teste normaliza somente quebras CRLF/LF, sem flexibilizar o conteúdo do SQL. Ambas as migrations anteriores permaneceram intactas.

## Implementação e compatibilidade

- Adição do campo com default legado para as linhas existentes e default final útil para as novas, sem UPDATE/reinterpretação dos demais valores.
- Cálculo SQL v1 em São Paulo, exclusão do dia inicial, segunda a sexta sem descontar feriados; sem depender do fuso da conexão.
- CHECK por versão; trigger impede escolher legado em uma inserção nova ou alterar início/vencimento/regra depois da criação. Solicitação/confirmação de devolução continuam atualizáveis com as proteções anteriores.
- Funções invoker, privilégios públicos revogados; RLS, índices, relações e trigger de vínculo com solicitação aprovada preservados.
- Fixtures D05/D06 montam novos empréstimos com o vencimento útil calculado no container. Seus objetivos continuam sendo conflito de importação/conta; as expectativas independentes de calendário estão na suíte E01.
- A reexecução histórica D04 passou a indicar seu `--schema` temporário, impedindo aplicar a E01 acidentalmente no teste de uma versão anterior. A prova D04 continua sobre as duas migrations originais; a suíte geral e E01 cobrem o banco atual.

Não foi necessário corrigir o SQL aprovado após executá-lo. O Prisma exibiu avisos de configuração legada/versão disponível; não foi atualizado nem recebeu dependência nova.

## Provas de banco

`tests/db/loan-due-rules.test.ts` tem 28 testes. Usa container próprio, fixtures Auth/Storage explícitas e bancos adicionais dentro desse mesmo container para falhas controladas. URLs sempre geradas localmente; nenhum destino remoto é aceito pelo helper de testes.

- Upgrade real por Prisma Migrate: dois empréstimos anteriores, ativo e devolvido, preservaram todos os campos e microssegundos; somente a regra legada foi acrescentada.
- Devolução do legado funciona após upgrade. Mudança de datas/regra em legado ou novo falha e não altera os registros.
- Novo empréstimo rejeita prazo corrido e regra legada explícita; aceita prazo útil pelo default. Continua exigindo a solicitação aprovada correspondente.
- Calendário usa expectativas fixas para segunda/sexta/fins de semana, mudança de mês/ano e diferença de data UTC/local. Natal e Ano Novo contam quando caem em dia de semana, conforme a decisão de não descontar feriados.
- Sessões UTC, Tokyo e São Paulo produzem o mesmo instante, preservando microssegundos. Instantes infinitos são rejeitados; NULL não contorna campos obrigatórios.
- Roles anon/authenticated não executam funções; catálogo real confirma invoker, imutabilidade/strict, RLS e objetos de integridade preservados.
- Controle negativo desativa somente o guard em transação de teste, comprova o bypass, força rollback e confirma que a proteção voltou. Nunca executado em dados reais.
- Colisão tardia de função e lock indisponível reprovam a migration sem deixar enum/coluna/cálculo parcialmente criado, sem alterar o legado e preservando a constraint antiga. As falhas de migration nessas bases são intencionais e os containers são descartados.
- Deploy repetido não reaplica SQL. A suíte geral aplica as três migrations desde banco vazio, sem passos SQL externos.

Diretórios temporários próprios têm prefixo `empresti-e01-`; a limpeza recursiva verifica pai e prefixo antes da remoção. O seed original e o publicador D08 não foram alterados. Este último continuará recusando uma terceira migration, conforme o escopo pontual de produção já definido.

## Checks e limites

Execução direcionada: 28 testes passaram. Suíte completa: 126 testes de banco em cinco arquivos passaram; inclui as provas históricas D04 e cenário vazio atual. Também passaram 13 unitários, dez de imagens, sete do verificador, lint, tipos, formatação e build. Comandos executados: `npm run test:db -- tests/db/loan-due-rules.test.ts`, `npm run test:db`, `npm test`, `npm run test:imagens`, `npm run test:verificador`, `npm run lint`, `npm run typecheck`, `npm run format:check` e `npm run build`.

CA-E12 corresponde à migration local/upgrade; os testes SQL também fornecem base para CA-E07, mas não implementam o cálculo TypeScript da E02 nem a aprovação transacional da E05. A spec 005 inteira permanece NÃO PRONTA e o verificador integral continua previsto na E10. Nenhuma interface foi alterada; E2E de interface não foi repetido.

Artefatos locais ignorados: `.local/e01-schema-before.prisma`, `.local/e01-generated.sql`, `.local/e01-target.log` e `.local/e01-test-db.log`. Recibo de hashes/contagens em `e01-prazo.json`. Produção continua com a migration inicial e D04; aplicar a nova depende de autorização própria futura, fora desta tarefa.
