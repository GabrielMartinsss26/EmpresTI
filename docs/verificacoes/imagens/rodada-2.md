Spec: `docs/specs/004-dados-iniciais/skill.md`, tarefa D02. Revisão da **árvore local atual**, sem commit informado. Instância filha: `/root/verificacao_d02`.

Hashes SHA-256 conferidos pelo agente:

- Spec: `a3452c3b87b034a7aafae6dffae3a8faf22904993c07f558a9d5237f91eec21f`
- Evidência `d02.json`: `5fe5971d7d2e1f573093d32f66fe3b336fb991672d099b6671d2a742ccff0484`
- Pipeline: `134420ab7d041e0a1b3109a495cbee36276a2e6535c31927cbfd7e257d7d2d71`
- Testes: `b3c3445ba97ab8cfb39b1c9a1a86f6a097b9cd123767983f98e3f356f59a83f0`
- Auditoria: `491569247312a6872fff82b468a2f03c060f0b0c4717647dfcc6f6d728bdac81`

Os hashes atuais desses arquivos coincidem com o recibo.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-I01 · Skill única, descoberta por AGENTS, nome, referências, scripts e validação. | ATENDE | `AGENTS.md:46`; `skills/imagens-equipamentos/SKILL.md:1`; `scripts/auditar-skill-imagens.mjs:13`; `docs/verificacoes/imagens/d02.json:10`; `docs/verificacoes/imagens/auditoria.json:3`. | A listagem apresenta uma única skill; nome, referências e scripts conferem. Recibo identifica validação bem-sucedida e auditoria local inspecionável. |
| CA-I02 · API Pixabay por GET, filtros, chave privada e cache sanitizado de 24 horas. | SEM TESTE | `skills/imagens-equipamentos/scripts/pipeline.mjs:94`; `tests/imagens/pipeline.test.mjs:42` e `:64`; `docs/verificacoes/imagens/d02.json:6` e `:21`. | Implementação contém GET e mínimo 800×600. Os mocks comprovam chave ausente, cache e parte dos filtros, mas não verificam método GET nem `min_height=600`. O resultado de oito testes aprovados não comprova essas duas regras. |
| CA-I03 · Download seletivo, origem permitida, limites e reutilização. | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:22`, `:172` e `:217`; `tests/imagens/pipeline.test.mjs:112` e `:150`; `docs/verificacoes/imagens/d02.json:8`. | Seleção vinculada ao patrimônio e candidata consultada; testes simulados exercitam origem externa, redirecionamento, tamanho, revisão pendente e reutilização sem novo download/revisão. |
| CA-I04 · WebP 800×600, bordas sem corte e rejeição de arquivos inválidos. | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:294`; `tests/imagens/pipeline.test.mjs:185`; `docs/verificacoes/imagens/d02.json:8`. | Teste decodifica WebP, confere dimensões, centro e bordas em retrato/paisagem e rejeita arquivo falso. O escopo sintético está declarado. |
| CA-I05 · Pacote completo, revisão válida, integridade, duplicação e repetibilidade. | SEM TESTE | `skills/imagens-equipamentos/scripts/pipeline.mjs:326`; `tests/imagens/pipeline.test.mjs:253`, `:275` e `:293`; `docs/verificacoes/imagens/d02.json:8`. | Há evidência para conjunto incompleto, pendência, original alterado, duplicação de bytes, repetição e reprovação posterior. Não há casos negativos para aprovação com revisor vazio, data ausente/inválida ou motivo vazio, embora o código aparente bloquear essas situações. |
| CA-I06 · Manifesto, destinos fixos e ausência de upload/Supabase. | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:385`; `skills/imagens-equipamentos/scripts/cli.mjs:21`; `tests/imagens/pipeline.test.mjs:293`; `skills/imagens-equipamentos/SKILL.md:11`; `docs/verificacoes/imagens/d02.json:8`. | Manifesto e destinos conferidos no código, com teste de créditos e verificação do pacote. Entradas da CLI e chamadas de rede inspecionadas não oferecem upload nem Supabase. Revisão visual permanece obrigatória. |
| CA-I07 · Proteção da chave, exemplo vazio, exclusões e ausência de importação por Client Component. | BLOQUEADO | `tests/imagens/pipeline.test.mjs:42` e `:64`; `.gitignore:1`; `.vercelignore:1`; `scripts/auditar-skill-imagens.mjs:28`; `docs/verificacoes/imagens/auditoria.json:13` e `:20`; `docs/verificador.md:25`. | Testes cobrem erro/cache; regras de exclusão e hashes das fontes da auditoria conferem. Contudo, o MCP exclui `.env.example`: sua condição atual e seu hash não podem ser comparados ao recibo. A declaração indireta de exemplo vazio não elimina essa limitação de acesso. |
| CA-I08 · Evidências distinguem testes sintéticos, busca real, revisão pendente e ausência de publicação. | ATENDE | `docs/verificacoes/imagens/d02.json:2`, `:21` e `:27`; `skills/imagens-equipamentos/SKILL.md:18`; `docs/specs/004-dados-iniciais/tasks.md:3`. | Evidências separam testes sintéticos da busca real relatada, mantêm revisão pendente e informam ausência de upload. Não declaram conclusão da spec 004. |

**Veredito do agente: NÃO PRONTA.**

Tarefas devolvidas pelo verificador, sem execução nesta solicitação:

- Complementar testes de CA-I02 para conferir GET e `min_height=600`.
- Complementar testes de CA-I05 para revisões aprovadas com identificação, data ou motivo inválidos; executar e atualizar o recibo.
- Resolver a verificabilidade do exemplo público em CA-I07 por mecanismo permitido, sem expor configuração real nem contornar o bloqueio do MCP.

Limitações declaradas pelo agente: não executou testes, comandos ou acesso remoto. A execução local é atribuída ao principal pelo recibo compatível com os hashes inspecionados. A busca real permanece relato do principal; fotos reais, revisão visual, população e publicação estão fora desta aprovação.
