# E08 — Tela mínima de decisão

Em 09/nov/2026 o responsável autorizou E08 depois de E07 e pediu continuidade da mesma tarefa. Plano e arquivos registrados antes do código. Sem DDL, dependência, nova API de domínio, publicação ou alteração remota.

## Implementação

/operacoes/solicitacoes exige sessão/vínculo ativo no servidor. Sem sessão vai ao login; colaborador retorna ao catálogo sem receber a lista. Sidebar mostra Operações/Solicitações somente para OPERATIONS/ADMIN; APIs mantêm autorização independente. Na revogação de papel, erro de consulta oculta linhas antigas e auth.me é atualizado.

Lista paginada requests.pending, nomes/equipamentos/datas reais e contagem somente do que foi carregado. Estados carregando/vazio/erro/retry e aviso de registro desativado/indisponibilidade. Não cria painel completo, cadastro, devolução ou novos números fictícios.

Confirmação de aprovação informa início do empréstimo/prazo/revalidação. Rejeição pede motivo trimado 1–500 e não cria empréstimo. Modal nativo compartilhado com E07 mantém foco, Tab/Shift+Tab, Escape e restauração de foco. Validação vazia foca o campo e informa erro. Ações ficam bloqueadas até terminar mutação/invalidação; trava síncrona impede clique repetido.

Sucesso só aparece após API confirmar; aprovação usa due_at retornado, rejeição não inventa prazo. Resultado recebe foco e pendentes/catálogo/resumo/próprios são invalidados, com auth.me atualizado. Conflitos/permissão/limite/falha inesperada mostram erro sem falso sucesso ou retry automático da decisão. Servidor continua fonte da regra/auditoria/transação.

## Provas locais CA-E04/E10

Doze testes novos operations.spec.ts com Next/tRPC/services e PostgreSQL reais em container descartável, Auth/Storage simulados e dados sintéticos. Não é prova de autenticação/publicação no Supabase. Fixture E07 foi estendida para OPERATIONS e limpeza de registros de teste limitada ao tenant; equipamentos extras são desativados, sem apagar histórico. Nenhum bypass de papel/autenticação foi criado na aplicação.

- ADMIN e OPERATIONS acessam lista/link; colaborador não vê link, página redireciona e API recusa com 403/corpo FORBIDDEN; sessão ausente vai ao login.
- Aprovação acessível com cancelamento sem efeito, envio repetido resulta em um Loan BUSINESS_14_SP e um evento de aprovação; prazo real exibido e item sai da lista.
- Motivo vazio rejeitado/focado, limite 500 no campo, texto normalizado persistido, sem Loan; colaborador vê motivo e consegue novo pedido no item liberado.
- Decisão concorrente dá conflito sem falso sucesso; limite três adquirido após pedido impede aprovação; papel revogado oculta tabela/link sem decidir.
- Outra organização não aparece na tabela; chamada direta com origem correta responde 404/NOT_FOUND e preserva pedido externo.
- Carregamento/vazio/rede/retry; 13 pedidos paginados sem duplicação ou overflow horizontal.
- Falha real de INSERT em auditoria via trigger sintético somente no container deixa pedido PENDING e nenhum Loan; UI apresenta erro. Trigger removido em finally, sem desabilitar proteção do domínio.

Capturas test-results/e08-operations.png, e08-approve.png e e08-reject.png conferidas visualmente; dados sintéticos/ambiente local. Captura longa reposiciona a página no topo para não deslocar a sidebar sticky no arquivo.

## Ocorrências corrigidas

Inferência do contexto a partir de beforeEach sobrecarregado gerou erro de tipos; corrigido exportando o tipo já inferido da fixture, sem any. Primeiro teste de tenant externo recebeu 403 porque faltava Origin na requisição sintética: cabeçalho corrigido e corpo tRPC passou a ser verificado, sem relaxar proteção de origem ou expectativa 404. Também fortalecido o teste de colaborador para verificar FORBIDDEN do domínio, não apenas o status da proteção de origem. Contador foi ajustado para funcionar com uma ou várias solicitações; captura longa reposicionada e rodada final repetida após esse ajuste visual.

## Limites

Checks: `npm run test:e2e -- tests/e2e/operations.spec.ts --workers=1 --max-failures=1`: 12 passaram na rodada final (24,9 s). Regressões: catálogo nove (18,6 s), login dois (3,4 s), showcase um (3,9 s), total 24 cenários de navegador distintos. `npm run test:db`: 241/dez arquivos (162,65 s); `npm test`: 32/oito arquivos. Imagens dez/verificador sete. Lint, typecheck, format:check, build e git diff --check passaram. Build conserva aviso pré-existente de depreciação da configuração Prisma em package.json. Servidor principal reiniciado na porta 3000; login sem sessão conferido HTTP 200.

E08 implementada/testada localmente, sem alegar a spec inteira pronta. E09 ainda sincroniza apresentação completa, E10 faz verificação integral independente e E11 depende de autorização de publicação. A migration E01 não foi aplicada ao Supabase; não afirmar funcionamento do fluxo novo nesse banco antes da publicação. Conta do professor segue adiada, nenhuma decisão foi feita na conta real. Próximo E09, aguardando autorização própria.
