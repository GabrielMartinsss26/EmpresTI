# D05 — População local do inventário

## Autorização e decisão

Em 07/nov/2026 o responsável autorizou a próxima tarefa e confirmou a política apresentada: **parar o lote inteiro em conflito**. A regra 7 da spec 004 foi atualizada antes do código. Criar ausentes; reutilizar ativos idênticos; preservar IDs, timestamps, série e descrições existentes não informadas pela prática. Dados divergentes/inativos, pedido pendente ou empréstimo ativo impedem a população, sem correção ou reativação automática.

O plano D05 registra os arquivos e o isolamento. Não houve alteração de schema, migration, dependência ou seed original. O conteúdo da auditoria de população na aplicação continua não decidido no ADR-006; este documento e o recibo são evidências técnicas locais.

## Implementação

- `prisma/dados-pratica.ts`: inventário da spec, validação completa antes de abrir a transação e criação apenas dos registros ausentes. Compara os campos definidos, desativação e uso dos equipamentos; confere também colisão do destino da imagem. Acumula conflitos encontrados antes das escritas.
- Valida os 12 patrimônios, caminhos, origens/hashes distintos, créditos/licença/revisão, tipo aprovado, tamanho medido e WebP estático realmente decodificável em 800×600. Somente TI-0007 admite a ilustração 313011. Não reavalia visualmente as fotos nem afirma que representam o equipamento físico; reutiliza a revisão D03.
- Transação serializável engloba tenant, categorias, equipamentos e referências. Falhas de banco/concorrência abortam a transação; não há retry nem sobrescrita silenciosa. Um conflito informado não é corrigido pelo script.
- `tests/db/d05-local.ts`: único comando novo, cria seu próprio PostgreSQL 16 por Testcontainers e aplica migrations com URLs geradas no container. Não aceita argumentos de conexão; não importa o cliente da aplicação nem lê credenciais. Confere a igualdade entre manifesto local e D03 versionado e valida os arquivos preparados contra manifesto e prova D03.
- `prisma/seed.ts` continua criando somente o tenant. Não executar esse seed esperando os 12 equipamentos.

## Reprodução local

Com Docker disponível e os arquivos D03 preservados em `.local/imagens-equipamentos/`, executar `npm run dados:local`. Ele valida o pacote, popula duas vezes, confere IDs/timestamps e quantidades e grava `.local/d05-local.json`, encerrando o container mesmo em falha. Não fornece um catálogo persistente: os dados somem ao encerrar o container. Não aceita uma URL do Supabase como destino.

Para a suíte reprodutível sem os arquivos ignorados: `npm run test:db`. A suíte D05 gera imagens sintéticas em diretório temporário; créditos e revisão usados como fixtures não constituem nova revisão visual. Auth e Storage são infraestrutura simulada no PostgreSQL, sem serviço HTTP real.

## Evidências e limites

O pacote real produziu quatro categorias, 12 equipamentos, 12 referências, nove disponíveis e três em manutenção. Segunda execução criou zero registros e preservou todos os IDs/timestamps. Nenhum perfil, membership, pedido ou empréstimo foi criado. Resultado em `d05-recibo.json`.

Os 25 testes D05 cobrem inventário exato, reexecução, cadastros anteriores sem imagem, série/descrições preservadas, outros tenants, conflitos de cadastro/desativação/uso/imagem/destino, múltiplos conflitos, rollback de falha no último equipamento e pacotes inválidos. A fixture de empréstimo usa os 14 dias corridos ainda exigidos pela migration inicial; a alteração para dias úteis pertence à spec 005.

A primeira checagem de tipos encontrou inferência incompatível entre listas de IDs numéricos e hashes textuais na criação de `Set`; corrigida explicitando a união `string | number`, sem alterar o comportamento.

| Comando | Resultado final |
|---|---|
| `npm run dados:local` | Pacote real D03 importado duas vezes; quantidades e IDs/timestamps conferidos; container encerrado |
| `npm run test:db -- tests/db/dados-pratica.test.ts` | 25 testes passaram |
| `npm run test:db` | 73 testes passaram em três arquivos; PostgreSQL descartável |
| `npm test` | 11 testes passaram |
| `npm run test:imagens` | Dez testes passaram |
| `npm run test:verificador` | Sete testes passaram; não é a rodada independente integral D07 |
| `npm run lint` | Passou |
| `npm run typecheck` | Passou após a correção citada |
| `npm run format:check` | Passou |
| `npm run build` | Passou; aviso preexistente de depreciação `package.json#prisma` |

Não houve alteração de UI/rotas; E2E de login não foi repetido nesta tarefa de importação local. O servidor do projeto foi pausado para a geração do Prisma e reiniciado após o build. `git diff --check` integra a revisão final. Nenhuma escrita no Supabase ou upload foi executado.

CA-D01/CA-D02 são atendidos localmente pelo recorte D05. As referências não provam existência dos objetos no Storage. Publicação, URLs públicas e login da conta de correção dependem de D06–D08; spec 004 inteira NÃO PRONTA. O verificador independente integral continua em D07, após as demais tarefas locais.
