# Fixture de demonstração do verificador

Esta spec testa somente a conferência independente, não o produto nem as specs 004/005. Escopo: `tests/verificador/contrato.json` e `tests/verificador/fixture.test.mjs`. Não ler HTML de aulas ou ambientes reais.

## Critérios de aceitação

- CA-V01 · O contrato contém limite numérico igual a cinco; um teste executável confirma esse valor.
- CA-V02 · O contrato exige aprovação; um teste executável confirma essa exigência.

Use resultado fornecido pelo principal como evidência de execução, conferindo SHA-256 dos arquivos com o recibo quando disponível. Sem execução identificada, não inventar teste passado. Esta fixture não tem banco, publicação, login ou interface.
