Instância filha: `/root/verificacao_d02` — agente customizado `verificador-spec`, com contexto limpo.

Resposta do agente:

Spec: `docs/specs/004-dados-iniciais/skill.md` — D02. Revisão recebida: árvore local atual, sem commit identificado.

Hashes conferidos:
- Spec: `a3452c3b87b034a7aafae6dffae3a8faf22904993c07f558a9d5237f91eec21f`.
- Recibo `d02.json`: `dc80a2ab7168cf3b1b1ffd3a598c1c03c5e8c3206ee990553ec87d70514dfe04`.
- Pipeline: `134420ab7d041e0a1b3109a495cbee36276a2e6535c31927cbfd7e257d7d2d71`.
- Testes: `7a5d7f32aa6405276bb0f8e51ae2e771f5c872c1918cdc5372920850bce9cb4c`.

Os hashes das fontes da skill e da auditoria conferidos coincidem com o recibo.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-I01 | ATENDE | `AGENTS.md:46`; `skills/imagens-equipamentos/SKILL.md:1`; `scripts/auditar-skill-imagens.mjs:13`; `docs/verificacoes/imagens/d02.json:5` | Descoberta, nome, referências e scripts presentes. Validação de formato e auditoria relatadas com saída zero. Listagem permitida contém uma única skill. |
| CA-I02 | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:88`; `tests/imagens/pipeline.test.mjs:42`; `tests/imagens/pipeline.test.mjs:64`; `docs/verificacoes/imagens/d02.json:16` | Testes simulados exercitam ausência da chave antes da rede, GET, filtros, expiração em 24 horas e sanitização. Busca real relatada separadamente em `d02.json:26`. |
| CA-I03 | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:172`; `skills/imagens-equipamentos/scripts/pipeline.mjs:217`; `tests/imagens/pipeline.test.mjs:114`; `tests/imagens/pipeline.test.mjs:152`; resultado em `d02.json:18` | Seleção vinculada ao patrimônio e à candidata consultada. Testes verificam origem externa, redirecionamento, tamanho, revisão pendente e reutilização sem novo download/revisão. |
| CA-I04 | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:294`; `tests/imagens/pipeline.test.mjs:187`; resultado em `d02.json:18` | Teste decodifica WebP, confere 800×600, centro e bordas em retrato/paisagem, e rejeita conteúdo inválido. Evidência explicitamente sintética. |
| CA-I05 | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:326`; `tests/imagens/pipeline.test.mjs:255`; `tests/imagens/pipeline.test.mjs:277`; `tests/imagens/pipeline.test.mjs:295`; `tests/imagens/pipeline.test.mjs:313`; resultado em `d02.json:18` | Exercitados conjunto incompleto, revisão obrigatória e identificada, original alterado, repetição por conteúdo, repetição de ID na seleção, reexecução com 12 arquivos e invalidação por reprovação posterior. |
| CA-I06 | ATENDE | `skills/imagens-equipamentos/scripts/pipeline.mjs:385`; `skills/imagens-equipamentos/scripts/cli.mjs:18`; `tests/imagens/pipeline.test.mjs:313`; resultado em `d02.json:18` | Manifesto contém patrimônio, hashes, autoria, ID, página, licença e destino fixo. Inspeção dos dois scripts confirma ausência de upload/cliente Supabase e rede restrita aos GETs do Pixabay. |
| CA-I07 | ATENDE | `.gitignore:1`; `.gitignore:12`; `.vercelignore:1`; `.vercelignore:11`; `tests/imagens/pipeline.test.mjs:42`; `docs/verificacoes/imagens/auditoria.json:13`; `docs/verificacoes/imagens/auditoria.json:20` | Testes verificam erros/cache sem chave fictícia. Consulta exclusiva de metadados confirmou uma ocorrência vazia no exemplo público, com hash igual ao da auditoria. Fontes de `src` conferidas contra os hashes da auditoria, sem referência à skill. |
| CA-I08 | ATENDE | `docs/verificacoes/imagens/d02.json:2`; `docs/verificacoes/imagens/d02.json:26`; `skills/imagens-equipamentos/SKILL.md:18`; `docs/specs/004-dados-iniciais/tasks.md:3` | Evidências separam testes sintéticos, busca real relatada, revisão visual pendente e upload não executado. Não afirmam conclusão da spec 004 nem publicação de fotos, equipamentos ou conta. |

Veredito: **PRONTA**, exclusivamente para o contrato D02.

Tarefas a devolver ao principal: nenhuma correção exigida pelos critérios deste contrato. Seleção e revisão das fotos reais permanecem em D03.

Limitações: inspeção independente por MCP, sem execução de testes. Os resultados locais pertencem ao principal: nove testes sintéticos e cinco testes de segurança relatados como aprovados. A busca real é um relato separado; não foram acessados cache privado, ambientes reais ou produção. O validador instalado no host foi identificado pelo hash fornecido, sem leitura independente de seu arquivo externo.
