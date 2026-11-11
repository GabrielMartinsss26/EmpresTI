Instância filha retornada: `/root/verificacao_d07_plantado` — agente customizado `verificador-spec`, com contexto limpo.

Resposta do verificador:

Spec: `tests/verificador/spec.md`. Revisão: **árvore local atual**, com recibo que identifica base `5b4d030128adf2ae2934a36e0c24776a5a2c7d3d`.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor. | NÃO ATENDE | `tests/verificador/contrato.json:2`; `tests/verificador/fixture.test.mjs:9–10`; `docs/verificacoes/verificador/d07-plantado.json:5–8` | O contrato contém `4`. A execução local identificada pelo principal terminou com código 1 e falha `4 !== 5`. |
| CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência. | SEM TESTE | `tests/verificador/contrato.json:3`; `tests/verificador/fixture.test.mjs:1–13`; recibo:8 | O contrato exige aprovação, mas o único teste verifica o limite. Não há teste da exigência de aprovação. |

Veredito: **NÃO PRONTA**.

Tarefas a devolver ao principal: restaurar o limite cinco, incluir teste de aprovação obrigatória e fornecer nova execução com recibo compatível.

Hashes atuais conferidos e iguais aos registrados no recibo:

- Spec: `a949d63fb1707fbcb203b665f3d3a4744dabc15c14ba5aed6eb531b4f96d2911`
- Contrato: `cf181e980e8fd026035e849e63ec32ce67f8959410638c51d03797eef2ef8b17`
- Teste: `95921334b97c24414fe519636f142f7cb852e0908574b056446e5b2357fe3ab9`
- Recibo lido: `f2ac9c34b2c37f51bb7208c5097c596272c25fe387a0bd187fe1a0e51fcf4414`

Limitações: inspeção independente por MCP; testes não executados pelo verificador. Resultado de execução fornecido pelo principal, restrito à fixture local; não comprova funcionalidades do produto ou produção.
