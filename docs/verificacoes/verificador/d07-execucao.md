# D07 — Checks e verificação independente

## Autorização e registro

Em 07/nov/2026 o responsável autorizou D07 e pediu registro contínuo de mudanças, criações e decisões. O recorte foi registrado no plano da spec 004 antes da execução. Nenhuma regra de negócio, ADR, dependência, schema, migration ou interface foi alterada. A demonstração fica restrita à fixture `tests/verificador/`, conforme `docs/verificador.md`.

## Sequência realizada

1. Fixture íntegra: teste local de dois critérios aprovado, recibo `d07-baseline.json` e parecer independente `d07-baseline.md`, PRONTA somente para a fixture.
2. Principal executou novamente os checks documentados, validação do pacote D03 e executores descartáveis D05/D06. Comandos, saídas, códigos e hashes estão em `d07-evidencias.json`.
3. Commit `4e3c16b`: limite da fixture alterado de cinco para quatro e teste de aprovação removido, preservando a spec. Teste executado falhou com `4 !== 5`, como exigido pela demonstração. Recibo `d07-plantado.json` conserva a execução e os hashes da árvore plantada.
4. Verificador independente reprovou CA-V01 como NÃO ATENDE e CA-V02 como SEM TESTE; parecer original em `d07-plantado.md`. O verificador não corrigiu nada.
5. Principal restaurou os bytes originais e executou os sete testes de segurança/fixture, todos aprovados. Commit separado `80ddf07`; recibo `d07-restaurado.json` confirma igualdade com baseline.
6. Nova instância independente aprovou os dois critérios da fixture restaurada, em `d07-restaurado.md`. Isso prova o mecanismo, não a conclusão do produto.
7. Revisão integral da spec 004 solicitada ao lançador com `d07-evidencias.json`, sem conversa de implementação ou conclusão desejada. Parecer e limitações são preservados separadamente em `d07-integral.md`.

## Desvio de processo preservado

Na fase plantada, `git diff --check` apontou uma linha em branco adicional no fim do teste. O principal criou o commit da demonstração antes de tratar esse aviso. A falha de whitespace não era uma condição intencional da prova; fica registrada aqui, sem reescrever o histórico. A restauração removeu a linha extra e devolveu os arquivos aos mesmos hashes anteriores. Checks finais de whitespace devem estar limpos.

## Verificações e limites

- `npm test`: 11 testes; `npm run test:db`: 96 testes em PostgreSQL descartável.
- `npm run test:imagens`: dez testes; `npm run test:verificador`: sete testes antes da prova e sete depois da restauração.
- `npm run imagens -- verificar`: 12 arquivos reais do pacote local D03 conferidos contra seleções/revisões/manifesto.
- `npm run dados:local` e `npm run conta:local`: reexecução sem duplicação, containers encerrados; Auth/Storage são fixtures explícitas.
- Lint, tipos, formatação e build passaram; permanece o aviso preexistente de depreciação `package.json#prisma`.
- E2E não foi repetido: não houve mudança de UI/rotas. Servidor local foi reiniciado após build.

Os testes falhos da fase plantada são prova negativa intencional, não um check final aprovado. A spec inteira permanece NÃO PRONTA enquanto houver critério sem evidência suficiente, inclusive a parte de publicação/login real de D08. Nenhum dado, imagem ou conta foi publicado nesta etapa; sem push.

## Resultado integral e pendências devolvidas

O parecer independente `d07-integral.md` classificou CA-D01/D02/D03/D04/D08 como ATENDE; CA-D05/D06 como SEM TESTE por ausência de publicação/login real; CA-D07 como BLOQUEADO por falta de prova de histórico/logs e isolamento global da sessão principal. Veredito: **NÃO PRONTA**. A tabela original foi preservada integralmente, com os oito critérios e limitações.

O principal complementou a auditoria, sem alterar código ou reclassificar critérios: `d07-auditoria.json` registra busca heurística em 267 blobs textuais alcançáveis no histórico local e quatro logs dedicados D07. Nenhum padrão pesquisado ou caminho de ambiente real versionado foi encontrado. Não cobre todo segredo possível, referências remotas não obtidas, objetos inalcançáveis ou outros logs, nem prova isolamento de execução. CA-D07 continua BLOQUEADO; não foi solicitada nova rodada com a mesma limitação estrutural.

O próximo passo antes de declarar a spec pronta é decidir/provar o isolamento efetivo, conforme `docs/specs/004-dados-iniciais/proposta-isolamento-d07.md`, e depois obter as evidências de D08 com o operador. Nenhuma exceção ao critério foi aprovada; não foi escrito ADR por iniciativa do agente.

Após receber o parecer, cabeçalhos de estado, tarefas, plano e continuidade foram atualizados. Os critérios da spec não foram alterados. `d07-spec-revisada.md` preserva os bytes da spec no momento da revisão, conferidos contra o SHA-256 do recibo original; o recibo e o parecer não foram reescritos para parecerem posteriores às atualizações documentais.

## Isolamento e artefatos

Cada rodada usa o lançador existente, sessão separada, papel `verificador-spec`, `fork_turns=none`, sandbox read-only e aprovação never. O principal conferiu metadados de delegação e chamadas de leitura das sessões dedicadas. Recibos `d07-delegacao-*.json` guardam somente IDs, hashes, nomes das ferramentas e permissões; não copiam prompts, autenticação, configuração pessoal ou ambientes reais.

Pareceres Markdown são as respostas finais reais do lançador, preservadas sem reclassificar critérios. Eventos brutos ficam ignorados em `test-results/verificador/d07-*-events.log`. Auxiliares transitórios de coleta, backup da fixture e checks ficam em `.local/d07-*`; não fazem parte de um comando remoto de publicação. As três aulas não rastreadas são arquivos do usuário e não entram nos commits.
