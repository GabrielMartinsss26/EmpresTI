# E10 — Verificação integral local

Em 09/nov/2026 o responsável autorizou a próxima tarefa após E09. Base: `819f0ad`. Escopo: checks, verificador isolado e demonstração negativa/restauração na fixture; publicação E11 e conta do professor não fazem parte desta execução.

## Falhas preservadas e correção

A primeira tentativa de banco terminou por timeout do executor, sem resultado utilizável: `verificador/e10-checks-timeout.json`. O diagnóstico `npm run test:db -- tests/db/loan-due-calculation.test.ts` passou três testes; Docker respondeu. Não se alteraram timeouts ou testes para obter aprovação.

Na tentativa seguinte, 32 unitários, 241 de banco, dez de imagens, sete do verificador e lint/tipos/formatação passaram. O navegador passou 16 cenários e falhou na revogação de papel: dois alertas idênticos violavam o seletor estrito; quatro cenários ficaram sem execução. Saída original em `verificador/e10-checks-browser-falha.json`.

Corrigido `src/components/operations-requests.tsx`: omitir o aviso de decisão quando a consulta já apresenta o mesmo erro, preservando alerta, retry, autorização e remoção das linhas antigas. Nenhum teste de produto foi alterado. Build anterior preservado em `verificador/e10-build-anterior.json`; nova rodada executada após a correção.

## Prova independente

Baseline da fixture aprovada realmente em `verificador/e10-baseline.md`; recibo e delegação próprios. A fixture tem limite cinco por contrato exclusivo de demonstração; o produto continua com três ativos e aprovação obrigatória.

Erro plantado em `611129b`: limite quatro e teste de aprovação removido. Execução saiu com código 1. Parecer independente `verificador/e10-plantado.md`: CA-V01 NÃO ATENDE e CA-V02 SEM TESTE.

Houve um erro real do principal ao montar o comando PowerShell de restauração: falha de quoting impediu a cópia e o shell prosseguiu com os comandos seguintes. `ef0de08` tem mensagem que menciona restauração, mas contém somente o plano e a correção do alerta. Não reescrever esse histórico nem tratá-lo como restauração. O teste continuou falhando e a revisão independente recusou o recibo chamado restaurado, corretamente: `verificador/e10-restauracao-falha.md`, JSON e delegação preservados, sem alterar seu conteúdo. O nome original do recibo nos logs é e10-restaurado.json; os artefatos dessa tentativa foram renomeados juntos para evitar sobrescrita.

Restauração efetiva em `2a943cf`, em commit separado: cópia dos backups, igualdade byte a byte e hashes idênticos à baseline. Ambos os testes passaram novamente, e `npm run test:verificador` passou sete testes. Nova revisão da fixture solicitada com recibo `verificador/e10-restaurado.json`. Não se alteraram os testes do produto nem se plantou erro na aplicação/banco/conta real.

## Checks finais

Build, 32 unitários, 241 testes de banco, dez de imagens, sete do verificador, lint, tipos e formatação passaram após a correção. Navegador: 21 cenários catálogo/Operações, dois de login e um showcase passaram. Sete testes do verificador repetidos depois da restauração. Comandos, horários, códigos, saídas e hashes serão reunidos em `verificador/e10-evidencias.json`; falhas anteriores preservadas em arquivos próprios.

## Revisão integral e complemento de imagens

Primeira revisão integral preservada em `verificador/e10-integral.md`: CA-E02/E03/E04/E06/E07/E08/E11/E12/E13 ATENDE; CA-E01/E05/E09/E10 SEM TESTE, veredito NÃO PRONTA. São nove critérios atendidos e quatro pendentes. As lacunas publicadas pertencem à E11; CA-E01 também tinha lacuna local porque a fixture aceitava fallback sintético sem identificar bytes recebidos.

O principal fortaleceu somente o primeiro cenário em tests/e2e/catalogue.spec.ts: coleta os corpos das respostas de imagem efetivamente recebidas pelo navegador, registra SHA-256/quantidade/proveniência em anexo e compara com o manifesto D03. Em E10_VERIFY_APPROVED_IMAGES=true exige as 12 correspondências. Sem a flag, CI continua portátil e o anexo distingue fallback de imagem aprovada; não se alega que imagem sintética prova fotografia real. Fixture e código de produto preservados.

Nova execução local estrita: nove cenários de catálogo aprovados; 12 respostas, 12 hashes distintos e idênticos aos aprovados no manifesto. Lint/tipos/formatação passaram novamente. Nenhum download, troca de imagem, upload ou publicação. Não repetir banco/build/unitários/Operações/login/showcase, pois seus arquivos e código de produto não mudaram nesta complementação. Recibo separado `verificador/e10-evidencias-r2.json` inclui saídas e proveniência; primeira rodada e snapshots originais não são sobrescritos. Nova revisão integral solicitada, sem conclusão presumida.

## Resultado final da E10

Parecer R2 original em `verificador/e10-integral-r2.md`: CA-E02/E03/E04/E06/E07/E08/E11/E12/E13 ATENDE; CA-E01/E05/E09/E10 SEM TESTE, exclusivamente por falta de verificação publicada E11. O parecer reconhece resolvida a lacuna local das 12 imagens. Veredito da spec inteira: **NÃO PRONTA**. Não executar E11 com a autorização desta tarefa.

E10 concluída pelo processo de verificação e CA-E13, sem marcar os outros critérios como atendidos. Todos os 13 critérios permanecem na ordem, sem edição para obter aprovação. A próxima tarefa é preparar/executar a publicação autorizada E11 e produzir provas do catálogo/fotos, aprovação, Meus empréstimos e tela de decisões com conta própria.

Os metadados das seis revisões reais (baseline, plantado, restauração falha, restaurado, integral e integral-r2) comprovam delegação para verificador-spec, fork_turns=none, sandbox read-only/aprovação never e chamadas de leitura do filho. Não foram copiadas conversas/configurações pessoais. O principal gravou as respostas originais; logs brutos dedicados permanecem ignorados em test-results/verificador.

Após as revisões foram atualizados somente estados/continuidade da spec, plano, tarefas, AGENTS e handoff. Snapshots `e10-spec/plan/tasks-revisada.md` e `e10-spec/plan/tasks-revisada-r2.md` preservam as versões conferidas. Recibos/hashes/pareceres históricos não foram reescritos como se cobrissem estas atualizações finais. Build e todos os checks de código aplicáveis já estavam aprovados; encerramento documental confere caminhos, snapshots, JSON, whitespace e seleção explícita de arquivos, sem incluir as três aulas do usuário.

## Limites

Checks pertencem ao principal; o verificador só inspeciona fontes e recibos via MCP. Autenticação/Storage de navegador são simulados; Next e PostgreSQL descartável são reais. Aprovação local não comprova Supabase nem publicação. Migration E01 ainda exige E11 autorizada; não houve push/deploy ou uso da conta do professor. Spec 004 permanece NÃO PRONTA e isolamento global não é alegado.
