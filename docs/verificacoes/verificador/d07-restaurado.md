Instância filha retornada: `/root/verificacao_d07` — agente customizado `verificador-spec`, com contexto limpo.

Resposta do verificador:

Spec: `tests/verificador/spec.md`. Revisão: **árvore local atual**, comparada ao recibo `docs/verificacoes/verificador/d07-restaurado.json`, cuja revisão-base declarada é `4e3c16ba90d7dab091b6903939fd0494d7e0faab`.

| Critério | Estado | Evidência | Motivo |
|---|---|---|---|
| CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor. | ATENDE | `tests/verificador/contrato.json:2`; `tests/verificador/fixture.test.mjs:9–10`; recibo:5–11 | Contrato contém o número 5; teste usa igualdade estrita. Recibo identifica execução pelo principal, saída 0 e teste aprovado; hashes conferem com os arquivos atuais. |
| CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência. | ATENDE | `tests/verificador/contrato.json:3`; `tests/verificador/fixture.test.mjs:13–14`; recibo:5–11 | Contrato exige `true`; teste verifica igualdade estrita. Execução identificada aprovada e hashes compatíveis. |

**Veredito: PRONTA**

Tarefas a devolver ao principal: nenhuma para os dois critérios desta fixture.

Hashes SHA-256 conferidos:

- Spec: `a949d63fb1707fbcb203b665f3d3a4744dabc15c14ba5aed6eb531b4f96d2911`
- Contrato: `a040b678347ae47877e2e3d5628f5362e73a175e519b3110e380d0e89453f3bd`
- Teste: `b98b6565c52c874d9e1de27e03cfa3081fd3ac8af8237e2f4c0970e42273d3c8`
- Recibo recebido: `0db7d3260f71589dcf20afd0c04876aab89a532a813b8998d676f846d9eb2dfd`

Limitações: inspeção somente por MCP; testes não executados pelo verificador. Execução local atribuída ao principal pelo recibo. Aprovação restrita à fixture; não comprova produto, specs 004/005, produção ou a sequência completa da demonstração D07.
