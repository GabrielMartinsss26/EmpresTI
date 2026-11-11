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
6. Depois dos checks de todas as tarefas e antes de declarar uma spec pronta, executar o verificador independente pelo lançador de `docs/verificador.md`; não depender de pedido do usuário. Fornecer caminhos e revisão, sem herdar a conversa de implementação.
7. Guardar a tabela real de critérios e evidências. Qualquer critério NÃO ATENDE, SEM TESTE ou BLOQUEADO mantém a spec NÃO PRONTA. O principal corrige e solicita nova rodada; o verificador nunca corrige nem ajusta teste para obter aprovação.

## Verificação

Cada tarefa aponta para seu critério ou pré-requisito, e o relato contém evidências e pendências.

## Não faça

- Não declare a funcionalidade inteira pronta por existir apenas sua interface.
