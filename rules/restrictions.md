# O que não fazer

## Autoridade

- Não escreva ou altere um ADR por iniciativa própria. Se encontrar uma decisão que precisa de ADR, descreva a decisão, as alternativas e as consequências, e pare. Quem decide é o time.
- Não contrarie o que está em `docs/adr/`. Se for necessário contrariar, pare e informe o conflito.
- Não responda por conta própria o que o PRD deixou ambíguo. Liste as perguntas e espere a resposta.
- Não escolha biblioteca que não esteja autorizada pelo ADR-001. Proponha a inclusão e espere aprovação.
- Não execute `git commit`, `git push`, crie tags ou altere o histórico. Essas ações pertencem ao usuário.
- Não crie, publique ou altere recursos externos sem solicitação explícita do usuário.

## Escopo

- Não altere arquivos fora do escopo da tarefa atual.
- Não crie uma estrutura de pastas nova que não esteja em um plano aprovado.
- Não gere scaffold automático sem mostrar antes quais arquivos e pastas serão criados.
- Não escreva código de funcionalidade sem uma spec correspondente em `docs/specs/`. O esqueleto do andar zero é a única exceção.
- Não inclua credenciais, tokens, chaves ou outros segredos em arquivos versionados, documentação, mensagens ou exemplos.

## Ritmo

- Não escreva código antes de existir um plano aprovado. Escreva o plano, apresente-o e espere a aprovação.
- “Pode implementar” autoriza somente uma tarefa do plano, não o plano inteiro.
- Depois de executar uma tarefa, rode os checks aplicáveis, mostre o resultado e pare.
- Não relate sucesso parcial como conclusão. Se algum check falhar, a tarefa ainda não terminou.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está correta até que uma pessoa altere a spec.
- Se uma spec e um ADR discordarem, pare e informe o conflito; não escolha um dos dois.
