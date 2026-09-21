# EmpresTI — Empréstimo de Equipamentos Internos

Sistema web interno para controlar o empréstimo e a devolução de equipamentos.
O documento de negócio está em `docs/PRD.md` e a stack aprovada está em
`docs/adr/001-stack.md`.

## Onde olhar

- `docs/PRD.md` — descreve o problema, os usuários e o escopo do produto; não é uma spec.
- `docs/adr/` — contém as decisões técnicas já tomadas e suas justificativas.
- `docs/layout.md` — descreve a referência visual e os fluxos das telas.
- `rules/restrictions.md` — deve ser lido antes de qualquer tarefa.
- `docs/specs/<NNN-funcionalidade>/` — local previsto para spec, plano e tarefas de cada funcionalidade.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec vence o código.
- Se uma spec e um ADR discordarem, pare e informe o conflito.
- Se algo necessário não estiver definido nos documentos, pergunte; não invente a decisão.

## Processo

- Leia `rules/restrictions.md` antes de começar qualquer tarefa.
- Leia `docs/adr/` antes de propor qualquer alteração estrutural ou dependência.
- Antes de implementar, liste os requisitos ambíguos encontrados.
- Uma decisão estrutural nova precisa ser aprovada e registrada em ADR antes do código.
- Execute somente uma tarefa aprovada por vez e pare após verificá-la.
- Não execute `git commit` nem `git push`. Todos os commits e pushes são feitos pelo usuário.
- Não configure, publique ou altere recursos externos do Supabase, GitHub ou Vercel sem pedido explícito do usuário.

## Estado atual do projeto

O repositório ainda não possui código da aplicação. Não existem comandos de build,
teste ou execução que possam ser documentados e verificados hoje. Esta seção deve
ser substituída por comandos e um mapa das pastas reais depois da conclusão do
andar zero.
