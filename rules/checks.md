---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa

> leitor: agente

## Quando

Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento

1. Releia o escopo da tarefa atual e identifique o critério atendido:
   `AZ-xx` para o andar zero ou `CA-xx` para uma funcionalidade com spec.
2. Confira os arquivos alterados. Nenhum arquivo fora do escopo da tarefa
   pode ter sido modificado pelo agente.
3. Rode somente os comandos de verificação que existirem e estiverem
   documentados no `AGENTS.md`. Informe cada comando executado e seu resultado.
4. Se a tarefa alterar código, rode todos os checks aplicáveis documentados no
   `AGENTS.md`, incluindo teste, lint, checagem de tipos e build quando existirem.
5. Se a tarefa alterar o schema, confirme com o fluxo local de Prisma Migrate
   documentado no `AGENTS.md` que todas as migrations podem ser aplicadas desde
   um banco vazio. Nunca faça essa verificação no banco remoto.
6. Rode `git diff --check` para verificar problemas de whitespace nos arquivos
   rastreados alterados.
7. Rode `git status --short` e confira se aparecem somente arquivos pertencentes
   ao escopo atual ou alterações anteriores que já eram do usuário.
8. Compare o resultado com o critério identificado no passo 1 e relate as
   evidências. Se a tarefa não tiver um critério formal, cite exatamente o pedido
   do usuário que foi atendido.

## Enquanto o projeto não tem código

- Não invente comandos de teste, build, lint, execução ou migration.
- Em tarefas apenas documentais, verifique conteúdo, caminhos citados,
  consistência com o PRD, os ADRs e `rules/restrictions.md`, além dos passos 6 e 7.
- A ausência de um comando necessário não conta como check aprovado. Informe a
  lacuna e não declare a parte correspondente como verificada.

## Verificação

Uma tarefa só está pronta quando todos os checks aplicáveis terminarem sem falha,
o critério correspondente estiver atendido e o `git status` não trouxer alterações
inesperadas. Sucesso parcial não é conclusão.

## Não faça

- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não repita a mesma tentativa de correção depois de uma falha sem antes mostrar
  o erro e explicar o que será alterado na próxima tentativa.
- Não rode teste contra o banco remoto.
- Não execute `git commit`, `git push`, crie tags ou altere o histórico.
- Não esconda, resuma como sucesso ou ignore a saída de um check que falhou.
