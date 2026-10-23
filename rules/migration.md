---
description: Procedimento para qualquer mudança de schema
globs: ["prisma/schema.prisma", "prisma/migrations/**", "prisma/seed.ts"]
alwaysApply: false
---

# Mudança de schema

> leitor: agente

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso — inclusive quando a mudança
parecer trivial.

## Procedimento

1. Confirme que a mudança pertence a uma tarefa aprovada e identifique o
   critério `AZ-xx` ou `CA-xx` atendido por ela.
2. Antes de alterar o schema, apresente as entidades, campos, tipos,
   relacionamentos, constraints, índices e efeitos esperados. Pare e aguarde
   aprovação.
3. Use Prisma Migrate como único dono do schema. Alterações declarativas ficam
   em `prisma/schema.prisma`; RLS, policies e triggers ficam como SQL dentro da
   mesma linha do tempo de migrations do Prisma.
4. Crie uma migration por tarefa aprovada. Use somente o comando que tiver sido
   executado e documentado no `AGENTS.md`; enquanto ele não existir, proponha o
   comando e espere aprovação.
5. Toda tabela de domínio deve nascer com `tenant_id`. A migration também deve
   habilitar RLS com comportamento deny by default e incluir policies explícitas.
6. Se a tabela já contiver dados, documente o efeito sobre as linhas existentes.
   Campo obrigatório novo exige estratégia aprovada de default, preenchimento ou
   migração em etapas.
7. Verifique a migration desde um banco local ou de teste vazio, usando o fluxo
   documentado no `AGENTS.md`, e depois execute `rules/checks.md`.
8. Informe os arquivos alterados, a migration criada e a evidência de que aplicar
   todas as migrations desde zero terminou sem passos manuais.

## Verificação

Pronto significa que o fluxo local de Prisma Migrate aplica todas as migrations
desde um banco vazio, o schema resultante corresponde ao aprovado, as proteções de
tenant e RLS foram verificadas e todos os checks aplicáveis passaram.

## Não faça

- Não use Supabase CLI, Studio ou SQL avulso como um segundo dono do schema.
- Não aplique, teste ou corrija migration diretamente no Supabase remoto.
- Não edite uma migration que já tenha sido aplicada fora da sua máquina ou
  compartilhada com o time. Crie a próxima migration.
- Não remova tabela, coluna ou dado sem aprovação explícita e uma estratégia de
  preservação, migração ou recuperação.
- Não crie tabela de domínio sem `tenant_id`, RLS e policies explícitas.
- Não declare a mudança pronta se a migration só funcionar sobre um banco já
  preparado manualmente.
