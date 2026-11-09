Spec: `tests/verificador/spec.md`. Revisão da **árvore local atual**; recibo baseline identifica `819f0ad6f1d5eaa050fb379cac9343f47757cb58`. Instância delegada: `/root/verificacao_e10`.

| Critério | Estado | Evidência | Motivo |
|---|---|---|---|
| CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor. | ATENDE | `tests/verificador/contrato.json:2`; `tests/verificador/fixture.test.mjs:9–10`; `docs/verificacoes/verificador/e10-baseline.json:5–14` | Valor numérico 5 e asserção estrita correspondente. Recibo do principal registra saída 0, dois testes aprovados e hashes compatíveis com os arquivos atuais. |
| CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência. | ATENDE | `tests/verificador/contrato.json:3`; `tests/verificador/fixture.test.mjs:13–14`; `docs/verificacoes/verificador/e10-baseline.json:5–14` | Aprovação definida como `true` e exercitada pela asserção estrita. Resultado compatível com os hashes atuais. |

Veredito da instância: **PRONTA**. Nenhuma correção nesta baseline.

Hashes conferidos pelo MCP e coincidentes com o recibo:

- Spec: `a949d63fb1707fbcb203b665f3d3a4744dabc15c14ba5aed6eb531b4f96d2911`
- Contrato: `a040b678347ae47877e2e3d5628f5362e73a175e519b3110e380d0e89453f3bd`
- Teste: `b98b6565c52c874d9e1de27e03cfa3081fd3ac8af8237e2f4c0970e42273d3c8`
- Recibo: `f3f3c1702ae0990dc7b830a2f45eea29b7fa664f27829e7eba0add72221420da`

Limitações informadas: inspeção exclusivamente pelo MCP; testes não executados pelo verificador. O resultado cobre somente os dois critérios da fixture. Não comprova conclusão da E10, demonstração plantada/restaurada, specs 004/005 ou produção. O limite cinco da fixture é expressamente preservado pelo `ADR-008:29`.
