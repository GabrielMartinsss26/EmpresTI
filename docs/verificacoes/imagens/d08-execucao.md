# D08 — Publicação delegada: dados e imagens

## Autorização e recorte

Em 07/nov/2026 o responsável pediu que o agente também executasse a D08 e os controles de segurança possíveis. ADR-007 registra essa delegação antes do código e da escrita remota. Depois, o responsável escolheu explicitamente adiar a conta do professor. Esta execução não cria contas, envia convites, redefine senha ou testa login da conta de correção.

O bloqueio de isolamento global de CA-D07 permanece verdadeiro. Autorizar uma publicação é diferente de impedir tecnicamente todas as ferramentas da sessão de acessar produção. A exceção de execução foi registrada na spec/plano e nas regras de migration, sem reclassificar o parecer D07 ou alegar aprovação integral da prática.

## Preparação e controles

- Pré-consulta de leitura confirmou projeto `gverauqgerwjwwjkoybl`, tenant ativo, somente a migration inicial aplicada, nenhum bucket e nenhum dos 12 equipamentos. Chaves e senhas não foram exibidas.
- `prisma/dados-pratica.ts` ganhou simulação transacional sem criação/atualização, com testes de ausência e conflito em PostgreSQL descartável. A população existente preserva seus critérios; não houve alteração de schema ou migration.
- `scripts/publicar-pratica.ts` é executor de servidor separado da aplicação. Exige argumentos explícitos e o destino aprovado; confere API e os dois URLs de banco pelo projeto, valida configuração com Zod, força TLS no banco e não retorna credenciais em erro.
- Antes da primeira conexão remota, confere manifesto local/versão D03, decodificação, hashes, dimensões e os 12 arquivos. Confere nomes/checksums da linha de migrations e usa Prisma Migrate; não executa DDL avulso ou adapta schema no destino.
- Após migration, verifica RLS, privilégios negados e o guard restritivo no catálogo real do PostgreSQL. Confere o lote e objetos existentes antes dos uploads. Objetos diferentes e bucket com configuração divergente causam parada, sem overwrite.
- Bucket limitado a WebP, 1 MiB, leitura pública. Upload anônimo é testado num caminho aleatório de prova, nunca num patrimônio existente. Se houver sucesso indevido, limpa somente a prova criada pela execução e interrompe.
- Downloads públicos sem cookie/chave são conferidos por hash/dimensões; listagem e acesso direto aos metadados são verificados separadamente. Reexecução compara registros completos e reutiliza objetos idênticos.
- `.local/` foi excluída do lint para não analisar auxiliares/artefatos ignorados; `scripts/` entrou no check de formatação. Nenhuma dependência nova.

## Checks locais anteriores à publicação

| Comando | Resultado |
|---|---|
| `npm run test:db` | 98 testes em PostgreSQL descartável, incluindo dois novos de simulação |
| `npm test` | 13 testes, incluindo dois novos de configuração/destino |
| `npm run test:imagens` | Dez testes passaram |
| `npm run test:verificador` | Sete testes passaram |
| `npm run lint` | Passou; auxiliares ignorados deixaram de produzir warnings após exclusão de `.local/` |
| `npm run typecheck` | Passou após corrigir a tipagem do ambiente do processo de migration |
| `npm run format:check` | Passou, incluindo scripts |
| `npm run build` | Passou; aviso preexistente de depreciação `package.json#prisma` |

Nenhuma suíte de testes foi executada no Supabase. A publicação e as verificações reais são integração explicitamente autorizada e serão registradas com recibos separados. O schema/migrations aprovados permanecem intactos. Não houve mudança de UI ou deploy Vercel; E2E de interface não foi repetido.

## Resultados de integração

Primeira execução real em 07/nov/2026: Prisma Migrate aplicou `202611060001_equipment_images` com saída 0; a migration inicial permaneceu com seu checksum. Bucket `equipamentos` criado público, limitado a `image/webp` e 1.048.576 bytes. Foram publicados 12 objetos e criadas quatro categorias, 12 equipamentos e 12 referências, sem criar tenant duplicado.

O cadastro ficou com nove disponíveis e três em manutenção. Consulta posterior em transação READ ONLY confirmou as duas migrations aplicadas, 12 objetos, 12 origens/hashes distintos, zero pedidos e zero empréstimos para esses equipamentos.

As 12 URLs públicas responderam HTTP 200 sem cookie/chave e os bytes/dimensões corresponderam ao manifesto. A tentativa anônima de upload no caminho de prova foi negada: transporte HTTP 400 com código Storage `403`, sem criação do objeto. Listagem anônima retornou zero objetos; consulta direta aos metadados foi negada com HTTP 401. O catálogo real confirmou RLS nas duas tabelas, privilégios de metadados revogados de `anon`/`authenticated` e guard restritivo de Storage para ambos os papéis. Não houve teste HTTP com JWT de colaborador; não apresentar essa parte como executada.

Segunda execução completa: migration já aplicada, zero uploads, zero novos cadastros/referências. Comparação dos registros completos preservou IDs e timestamps; objetos existentes foram baixados e comparados por hash antes de serem reutilizados. Os 12 GETs públicos foram novamente conferidos.

Recibo de ambas as execuções, estado remoto e hashes das fontes em `d08-recibo.json`. Registros brutos sanitizados permanecem em `.local/d08-publicacao-*.json`; saídas em `.local/d08-primeira-execucao.log` e `.local/d08-reexecucao.log`. Não houve interrupção na publicação real ou necessidade de reparo de schema no destino. Conta/login do professor seguem adiados, e a spec inteira continua NÃO PRONTA.

## Revisão independente após publicação

A primeira rodada `docs/verificacoes/verificador/d08-integral.md` foi preservada: o lançador usava a expressão “apenas estes caminhos”, interpretada nesta rodada como proibição de ler fontes além da spec e do recibo. Por isso o verificador não conseguiu comparar a implementação/testes ou ler ADRs. Não foi uma reprovação da integração executada, e não foi convertida em aprovação pelo principal.

O principal esclareceu o texto de delegação em `scripts/verificar-spec.mjs` e a instrução correspondente do papel: caminhos de entrada não são uma lista exclusiva de leitura. A lista permitida pelo MCP, o sandbox read-only, o ambiente mínimo e o bloqueio de shell/apps/segredos permaneceram intactos. É correção da comunicação do escopo, não ampliação de ferramentas/permissões. Nova rodada usa recibo `d08-recibo-r2.json`; não reexecuta publicação nem altera os recibos originais.

Foi aplicada a skill OpenAI Docs para esta correção e consultada a [documentação oficial de subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents), que distingue instruções do papel das permissões herdadas. A execução real e os metadados de delegação continuam sendo a prova local, não o texto da documentação.

A segunda rodada `docs/verificacoes/verificador/d08-integral-r2.md` comparou os 92 hashes do recibo sem divergências e reconheceu CA-D01/D02/D03/D04/D05/D08 como ATENDE. CA-D06 ficou SEM TESTE por conta/login reais adiados; CA-D07 ficou NÃO ATENDE, pois existe executor real de produção e recibo de uso, mesmo com autorização. Essa classificação nova não substitui os bloqueios dos pareceres anteriores. Veredito integral: **NÃO PRONTA**.

Pareceres e metadados das duas delegações foram preservados, com instância filha, contexto limpo, permissões read-only/never e chamadas de leitura. `docs/verificacoes/verificador/d08-spec-revisada.md` guarda os bytes da spec avaliados; os cabeçalhos de estado/continuidade foram atualizados depois do parecer. Nenhum critério foi reduzido para aprovar a publicação.

Na apresentação Markdown da primeira rodada foram removidos apenas espaços finais de quebra de linha para atender `git diff --check`. Conteúdo/classificações não foram alterados; o log bruto e seu hash continuam preservados na delegação. Esse ajuste documental não reexecuta ou muda a revisão.

## Referências consultadas

Documentação oficial consultada em 07/nov/2026 para o SDK já instalado: [createBucket](https://supabase.com/docs/reference/javascript/file-buckets-createbucket), [criação/configuração de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets), [API administrativa](https://supabase.com/docs/reference/javascript/admin-api). A consulta da API administrativa serviu à pré-leitura; nenhuma criação de usuário faz parte desta execução.
