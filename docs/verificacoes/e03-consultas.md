# E03 — Consultas autorizadas

Em 09/nov/2026 o responsável autorizou a próxima tarefa após E02. Escopo: parcela de leitura/API de CA-E01 e CA-E09, conforme contratos E00. Arquivos foram listados no plano antes do código. Não surgiu nova decisão estrutural ou ambiguidade de negócio; sem nova dependência, migration ou ADR.

## Implementação

- Routers `catalogue`, `loans`, `requests` registrados no AppRouter; cinco procedimentos `catalogue.list/categories`, `loans.summary/mine`, `requests.mine`, todos com Zod e tenantProcedure.
- Contexto recebe Prisma, conforme ADR-001. Services recebem IDs da sessão e revalidam no banco usuário/vínculo/tenant/perfil ativos. Inputs estritos não aceitam troca de tenant/pessoa/vínculo.
- Catálogo filtra equipamentos/categorias ativos; metadados somente de imagem ativa, com autor/link e bucket/caminho para uso futuro na interface. Disponibilidade distingue manutenção, fora de uso, empréstimo ativo e pedido pendente; devolvido/rejeitado não ocupa item. Nenhum ID ou nome de outro solicitante/tomador é retornado.
- Busca por nome/patrimônio, categoria, filtro de disponíveis e paginação 12/48. Cursor validado sob o mesmo escopo/filtros; cursor inexistente ou inacessível recebe o mesmo BAD_REQUEST genérico. Ordenações/DTOs no plano.
- Resumo só conta ativos próprios, inclusive devolução solicitada ainda não confirmada; informa teto três e atraso pelo relógio do servidor. Não implementa a imposição do limite, prevista em E04/E05.
- Listas próprias retornam datas reais; pedidos incluem decisões/motivo sem vencimento. Empréstimo ativo não desaparece se o equipamento for desativado depois. Cursor de datas usa comparação SQL sem perda de microssegundos; Date de saída conserva a precisão em milissegundos já documentada na E02.
- Formatter usa mensagem genérica do domínio para erros internos dessas consultas e preserva mensagem do login. Stack/detalhe interno não são expostos. Endpoint existente mantém cache privado/no-store.

## Provas locais e limites

`tests/db/domain-reads.test.ts` contém 24 testes novos com PostgreSQL real descartável, usando todas as migrations via Prisma Migrate. Dados, imagens (somente metadados), usuários e organizações são sintéticos. Auth/sessão são simulados; a prova HTTP executa o Route Handler real com sessão simulada e banco local, sem comprovar login ou Storage HTTP reais no Supabase. Login é substituído somente no teste específico do formatter, sem chamada ao provedor externo.

Cobertura: 12 itens/fotos, TI-0004/0007/0010 em manutenção, derivação de disponibilidade, filtro/paginação, leitura entre duas organizações, duas pessoas por organização, cursor externo/próprio/inexistente, datas empatadas e microssegundos distintos em pedidos. As cinco consultas rejeitam sessão/vínculo ausentes, contexto incompatível e desativação de vínculo/perfil/tenant depois da sessão. Também há leitura RLS negada em cinco tabelas sob authenticated sem owner (com grants para exercitar policies), HTTP 200/cache, 401, 500 sanitizado e mensagem de login preservada.

Ocorrências durante desenvolvimento, corrigidas antes da conclusão: tipagem explícita faltante na lista da fixture; fixture com aprovação/início divergentes barrada pelo trigger; decisão sintética anterior à solicitação e assert sem desserializar SuperJSON; cabeçalho Host ausente na requisição de teste barrado por proteção de origem; formatação dos routers. Nenhuma constraint, proteção de origem ou expectativa de isolamento foi relaxada para passar.

## Checks executados

`npm run test:db -- tests/db/domain-reads.test.ts`: 24 passaram (8,61 s). `npm run test:db`: 153 passaram em sete arquivos (95,32 s). `npm test`: 28 passaram; `npm run test:imagens`: dez; `npm run test:verificador`: sete. `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` e `git diff --check` passaram após as correções registradas acima. Build conserva aviso pré-existente de depreciação da configuração Prisma em package.json.

Servidor local reiniciado após build na porta 3000; login sem sessão verificado HTTP 200. Não foi usado usuário real ou chamada ao Supabase para comprovar as consultas.

E03 não cria UI ou mutações. CA-E01/CA-E09 completos ainda dependem das tarefas de interface/fluxo; spec 005 inteira permanece NÃO PRONTA. Próximo E04 (pedido pendente); verificador integral E10 após todas as tarefas. Nenhuma publicação, push, consulta ou escrita remota. A migration E01 continua somente local; publicação futura E11 precisa autorização própria. E2E visual não se aplica a esta etapa de API.
