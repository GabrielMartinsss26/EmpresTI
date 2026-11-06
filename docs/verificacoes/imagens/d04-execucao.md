# D04 — Implementação e verificação local

Data: 06/nov/2026. Relato do principal, não uma verificação independente da spec 004 inteira.

## Passos reais

1. A proposta foi criada/apresentada no commit `c2f4b28`, com DDL e impactos; schema e banco ainda não haviam sido alterados.
2. O responsável aprovou explicitamente a implementação e os testes locais nesta conversa.
3. O ADR-006 e a aprovação/comando de geração no AGENTS foram registrados antes de editar o schema.
4. O schema anterior foi copiado para `.local/d04-schema-before.prisma`; o diff de dois datamodels gerou a nova migration, sem introspecção remota. Checks, RLS e trigger foram complementados nessa mesma migration.
5. A migration inicial permaneceu intacta. As duas migrations foram aplicadas por Prisma Migrate em PostgreSQL 16 descartável; um teste aplicou primeiro a inicial, criou equipamento e só depois aplicou D04, conferindo preservação dos campos.
6. Falhas e ajustes abaixo foram corrigidos pelo principal; depois os checks passaram. Nenhuma proposta ou aprovação foi omitida do histórico para aparentar execução direta.

## Resultado local

- Modelo `EquipmentImage` e relação opcional `Equipment.image`, com tenant e FK composta ao equipamento do mesmo tenant.
- Nova migration: `prisma/migrations/202611060001_equipment_images/migration.sql`. Dez tabelas públicas da aplicação após aplicar a sequência, sem contar `_prisma_migrations`.
- Constraints de destino, origem/licença, tipo/formato/dimensões/tamanho, hashes e revisão; unicidade por equipamento e por destino físico. Índice de tenant e unicidade composta adicional exigida pelo Prisma para representar a relação um-para-um.
- Metadados negados a clientes diretos por REVOKE/RLS; trigger preserva referências contra DELETE físico, permitindo desativação.
- Guard restritivo em `storage.objects` para `anon`/`authenticated`: bloqueia o bucket `equipamentos` mesmo diante de uma policy permissiva ampla instalada somente no teste; preserva o acesso ao outro bucket da fixture.
- Reaplicar `migrate deploy` não cria objetos duplicados; colunas/tipos/nulabilidade do novo modelo foram comparados ao catálogo SQL real e os índices esperados foram conferidos.

## Provas e checks

| Comando | Resultado |
|---|---|
| Geração offline pelo comando D04 do AGENTS | Passou após adicionar a unicidade composta exigida pelo Prisma |
| `npm run db:generate` | Passou após parar a instância deste projeto na porta 3000 que segurava a DLL |
| `npx prisma format` | Passou |
| `npm run test:db` | 48 testes passaram, em dois arquivos, PostgreSQL 16 por Testcontainers |
| `npm test` | 11 testes passaram |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm run format:check` | Passou |
| `npm run test:verificador` | Sete testes passaram; não equivale à delegação/verificação integral da spec |
| `npm run test:imagens` | Dez testes passaram |
| `npm run build` | Passou, com cliente Prisma gerado e rotas Next compiladas |

Após o build, a suíte de banco foi repetida com o cliente final: 48 testes passaram em 41,81 segundos. Recibo com hashes dos arquivos e do log local em `d04-recibo.json`. A aplicação foi reiniciada com `npm run start -- --hostname 127.0.0.1`; `/login` respondeu HTTP 200. Isso não é uma nova prova de login autenticado ou de Storage remoto.

O teste de banco cobre zero/uma imagem, segunda imagem recusada, destino repetido recusado, FK cruzada recusada, 28 variantes de metadados inválidos, tipo `illustration` registrado, limite de tamanho, NOT NULL, desativação e DELETE físico. Papéis `anon` e `authenticated` são conferidos como não-owner e sem bypass; grants temporários exercitam RLS separadamente de REVOKE.

Para Storage, a fixture contém apenas `storage.objects` e policies SQL; não há API HTTP do serviço. Foram testados SELECT/listagem, INSERT, UPDATE, DELETE, movimentação para o bucket e cópia a partir de objeto invisível. O controle negativo remove o guard dentro de uma transação, demonstra leitura/escrita que passariam sem ele e força rollback; a proteção é conferida novamente após o rollback. Isso não substitui a prova em commits de D07.

Ausência de Storage ou RLS desabilitado fazem a migration falhar sem deixar `equipment_images` criada. Nenhum SQL da aplicação cria tabelas do serviço: somente o harness descartável prepara fixtures de Auth/Storage, como já fazia para Auth.

## Falhas encontradas e correções

- Prisma P1012: o relacionamento composto um-para-um exigiu `UNIQUE (equipment_id, tenant_id)` adicional, redundante com a unicidade simples; cardinalidade aprovada preservada.
- Prisma EPERM no Windows: processo deste projeto, dono da porta 3000 e com a DLL carregada, foi identificado e parado; geração refeita com sucesso. Não foram encerrados processos Node indiscriminadamente.
- Primeira execução: o rótulo `%j` de um teste tentou serializar `BigInt`, interrompendo a suíte nova antes dos casos; alterado somente o rótulo, com as mesmas entradas inválidas.
- Segunda execução: 44 de 48 passaram. O diff global da CLI retornou P4002 pela FK manual já existente `profiles -> auth.users`; essa FK não foi retirada nem remodelada. A conferência local do modelo novo passou a usar catálogo real, tipos/nulabilidade do Prisma, índices e provas de FK/comportamento; o teste também confirma a FK de Auth preservada. Não é alegada uma comparação global por CLI que não ocorreu.
- A asserção de NOT NULL passou a verificar SQLSTATE `23502` em vez de um texto de erro que o driver não devolvia com o nome da coluna.
- O `BEGIN/COMMIT` externo do rascunho mantinha a conexão abortada quando Prisma tentava registrar falha, ocultando a mensagem da pré-condição. O SQL final é uma única instrução `DO`, atômica; os testes confirmaram rollback e mensagem original sem relaxar a exigência.

## Limites e próximo passo

D04 concluída somente no recorte local autorizado. Não houve leitura do conteúdo completo de ambiente, migration remota, criação/configuração de bucket, upload, população dos 12 itens ou conta do professor, push ou deploy. O backend atual ainda não exibe catálogo completo; D04 não cria essa interface.

D05 precisa decidir o tratamento de equipamentos/imagens existentes alterados ou inativos antes de implementar a população. D06 precisa decidir contas existentes/inativas. D07 continua responsável pela verificação independente integral e D08 pela publicação/evidências reais do operador. A spec 004 permanece NÃO PRONTA.
