Instância filha retornada: `/root/verificacao_spec` — agente `verificador-spec`, com contexto limpo.

Spec: `tests/verificador/spec.md`. Revisão: **árvore local atual**; recibo informa base `f26262e29fec5553d681698c6ce48b54e7bd4658`.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor. | ATENDE | `tests/verificador/contrato.json:2`; `tests/verificador/fixture.test.mjs:9–10`; `docs/verificacoes/verificador/restaurado.json:5–11` | Contrato contém `5`; teste usa igualdade estrita. Recibo identifica execução pelo principal, saída de sucesso e hashes correspondentes aos arquivos atuais. |
| CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência. | ATENDE | `tests/verificador/contrato.json:3`; `tests/verificador/fixture.test.mjs:13–14`; `docs/verificacoes/verificador/restaurado.json:5–11` | Aprovação obrigatória é `true`; teste verifica esse valor estritamente. Recibo registra dois testes aprovados, sem falhas. |

Veredito: **PRONTA**.

Tarefas a devolver ao principal: nenhuma para esta fixture.

SHA-256 conferidos entre MCP e recibo:

- Spec: `a949d63fb1707fbcb203b665f3d3a4744dabc15c14ba5aed6eb531b4f96d2911`
- Contrato: `a040b678347ae47877e2e3d5628f5362e73a175e519b3110e380d0e89453f3bd`
- Teste: `b98b6565c52c874d9e1de27e03cfa3081fd3ac8af8237e2f4c0970e42273d3c8`

Limitações: testes inspecionados, sem execução pelo verificador. A execução local foi informada pelo principal no recibo. Aprovação restrita à fixture de demonstração; não comprova funcionalidades do produto, integração ou produção.
