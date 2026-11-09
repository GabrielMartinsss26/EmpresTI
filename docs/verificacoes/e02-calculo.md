# E02 — Cálculo TypeScript de 14 dias úteis

Em 09/nov/2026 o responsável autorizou expressamente a E02. TypeScript strict já está decidido no ADR-001; calendário nos ADRs 004/008/009. Não surgiram requisitos ambíguos ou decisões estruturais novas.

## Arquivos e comportamento

`src/server/services/loan-due-date.ts` contém `calculateLoanDueAt(Date)`, cálculo puro sem mutar a entrada, e `createLoanPeriod(clock)`, que captura uma única vez o relógio do servidor e devolve início/vencimento. O relógio é injetável para testes. Nenhum horário do cliente é recebido por API nesta tarefa; integração transacional continua em E05.

O dia inicial não conta. São contados 14 dias de segunda a sexta, sem descontar feriados, mantendo os campos de horário de America/Sao_Paulo. Intl consulta o fuso, sem offset UTC−3 fixo ou soma de 14 períodos de 24 horas. A conversão considera offsets próximos de possíveis transições; em sobreposição escolhe o instante posterior e em salto usa o offset anterior, seguindo a conversão SQL. Nenhuma dependência foi adicionada.

Date trabalha em milissegundos: a concordância SQL é testada para entradas representáveis nessa precisão. Isso não promete preservar microssegundos de timestamps históricos do PostgreSQL; E01 preserva esses registros e seus testes permanecem intactos. O helper não atualiza empréstimos existentes, schema ou migrations.

## Evidências CA-E07

- `tests/unit/loan-due-date.test.ts`: 15 testes novos. Expectativas fixas para segunda/sexta/sábado/domingo, virada de mês/ano, Natal/Ano Novo sem desconto, diferença entre data UTC/local, ano bissexto, milissegundos, início/fim histórico de horário de verão, entrada inválida, entrada imutável e relógio capturado uma vez. Processo em UTC/Tokyo/São Paulo conserva o resultado; relógio padrão também testado com hora controlada.
- `tests/db/loan-due-calculation.test.ts`: três testes novos, cada um comparando dez instantes entre TypeScript e a função SQL E01 em sessões UTC/Tokyo/São Paulo. Usa apenas PostgreSQL descartável via Testcontainers e Prisma Migrate; sem consulta ao Supabase.

## Checks executados

`npm test`: 28 testes em sete arquivos; `npm run test:db`: 129 testes em seis arquivos (95,36 s); `npm run test:imagens`: dez; `npm run test:verificador`: sete. `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` e `git diff --check` passaram. Os 15 unitários e três testes de banco novos somam-se às suítes anteriores. Build emite o aviso já existente de depreciação da configuração Prisma em package.json, sem falha.

Servidor local reiniciado após o build; login sem sessão conferido por HTTP 200. Nenhuma interface foi alterada.

## Limites

E02 fornece o cálculo; não implementa APIs, limite de três, aprovação ou telas. Spec 005 inteira continua NÃO PRONTA. Próximo passo E03; verificador integral apenas na E10 após as demais tarefas. Sem push, deploy ou mudança remota. E2E de interface não se aplica a este helper isolado.
