# Fluxo de funcionalidade

> leitor: agente

## Quando

Ao iniciar ou alterar comportamento de uma funcionalidade.

## Procedimento

1. Leia PRD, ADRs e a spec existente; liste somente ambiguidades ainda não respondidas.
2. Mantenha comportamento e critérios `CA-xx` em `docs/specs/<NNN-nome>/spec.md`.
3. Derive `plan.md` da spec e tarefas verificáveis em `tasks.md`.
4. Siga as autorizações e limites de `restrictions.md`; verifique cada tarefa com `checks.md`.
5. Ao mudar comportamento vigente, atualize a spec antes do código.
6. Registre critérios sem evidência como pendentes. O verificador por subagente ainda não está configurado neste repositório.

## Verificação

Cada tarefa aponta para seu critério ou pré-requisito, e o relato contém evidências e pendências.

## Não faça

- Não declare a funcionalidade inteira pronta por existir apenas sua interface.
