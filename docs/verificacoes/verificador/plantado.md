Instância filha retornada por `spawn_agent`: `/root/verificacao_spec` — agente `verificador-spec`, com contexto limpo.

Spec: `tests/verificador/spec.md`. Revisão da **árvore local atual**; recibo `docs/verificacoes/verificador/plantado.json`, fase `erro-plantado`, base declarada `e56b9ad19676ef94203117d4e662363360ba1d3d`.

| Critério | Estado | Evidência | Motivo |
|---|---|---|---|
| CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor. | NÃO ATENDE | `tests/verificador/contrato.json:2`; `tests/verificador/fixture.test.mjs:9–10`; `docs/verificacoes/verificador/plantado.json:5–7` | O contrato contém `4`. O teste exige `5`; a execução fornecida registra `exitCode: 1`, zero testes aprovados e falha `4 !== 5`. |
| CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência. | SEM TESTE | `tests/verificador/contrato.json:3`; `tests/verificador/fixture.test.mjs:1–11`; `docs/verificacoes/verificador/plantado.json:7` | `aprovacaoObrigatoria` é `true`, mas o único teste verifica o limite. Não há teste nem resultado que exercite a exigência de aprovação. |

Veredito: **NÃO PRONTA**.

Tarefas apontadas pelo verificador:

- Corrigir a divergência do limite em CA-V01.
- Acrescentar teste executável para CA-V02.
- Fornecer nova execução e recibo correspondentes aos arquivos corrigidos.

Os SHA-256 retornados pelo MCP coincidem integralmente com os três hashes do recibo:

- Spec: `a949d63fb1707fbcb203b665f3d3a4744dabc15c14ba5aed6eb531b4f96d2911`
- Contrato: `cf181e980e8fd026035e849e63ec32ce67f8959410638c51d03797eef2ef8b17`
- Teste: `15ce0b6d8e0082f414288348304b05b06d18da61a04e00e7d318bf4f84c7e18d`

Limitações informadas: inspeção somente pelo MCP autorizado; nenhum teste executado pelo verificador. O resultado registrado é uma execução local declarada pelo principal, consistente com os arquivos atuais. A avaliação respeita o escopo da fixture, sem exigir funcionalidades do produto.
