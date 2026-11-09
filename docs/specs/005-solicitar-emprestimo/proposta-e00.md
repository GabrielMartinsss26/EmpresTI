# E00 — Proposta de contratos e desenho mínimo

Data: 09/nov/2026. Status: contratos da E00 aprovados expressamente pelo responsável após apresentação no chat. Não é evidência de API/tela/migration pronta. O desenho/SQL exato de versionamento do prazo permanece sujeito à aprovação própria em E01. Regras confirmadas: três ativos (ADR-008), aprovação mantida, 14 dias úteis (ADR-004), fotos/créditos já aprovados (ADRs 005/006/007).

## Estado e escopo

Os 12 equipamentos e fotos estão no Supabase; `/catalogo` ainda é placeholder e o router atual só expõe autenticação. O limite de empréstimos não tem implementação a trocar de cinco para três. O rate limit de login continua com cinco tentativas e a fixture do verificador continua com sua constante própria; nenhum deles representa o limite do domínio.

Implementar catálogo, pedido pendente, decisão mínima e Meus empréstimos nas tarefas E01–E09. Conta do professor continua adiada. Não incluir CPF, autocadastro, convites, cadastro de equipamento, devolução ou notificações.

## Rotas propostas

| Rota | Acesso e conteúdo |
|---|---|
| `/catalogo` | Vínculo ativo; cards, fotos, busca/categorias, filtro de disponíveis e indicador de três itens |
| `/meus-emprestimos` | Vínculo ativo; empréstimos ativos/vencimento e pedidos próprios separados, incluindo resultado das decisões |
| `/operacoes/solicitacoes` | OPERATIONS/ADMIN do tenant; lista pendente com aprovar/rejeitar e motivo |

Reutilizar `/`, `/login` e o logout existentes. Página de detalhe, tela completa de Operações e cadastro não entram agora: o pedido é confirmado em diálogo no card. Sem sessão, redirecionar ao login; sessão sem papel de Operações não recebe dados da lista de decisões, inclusive pela API.

## Procedimentos propostos

Todos em tRPC → service → Prisma, com Zod no input e tipos inferidos do AppRouter. Tenant/pessoa/papel sempre da sessão. UUIDs de recursos servem somente para busca dentro do tenant, nunca para selecionar tenant ou solicitante.

| Procedimento | Entrada | Saída/efeito |
|---|---|---|
| `catalogue.list` | Cursor opcional, limite padrão 12/máximo 48, busca opcional até 80 caracteres, categoria opcional e `onlyAvailable` | Página ordenada por patrimônio/ID; dados ativos, situação operacional e disponibilidade derivada; sem identidade de quem pediu/pegou |
| `catalogue.categories` | Sem parâmetros | Categorias ativas do tenant para filtros |
| `loans.summary` | Sem parâmetros | Ativos próprios, limite três e existência de atraso; sem contagem de outras pessoas |
| `loans.mine` | Cursor/limite | Empréstimos ativos próprios, equipamento e `due_at` real |
| `requests.mine` | Cursor/limite | Pedidos próprios, status, data e eventual motivo de rejeição; nenhum vencimento inventado |
| `requests.create` | `equipmentId` | Somente pedido PENDING; valida disponibilidade, limite e atraso |
| `requests.pending` | Cursor/limite | Somente OPERATIONS/ADMIN; pendentes do tenant com dados necessários à decisão |
| `requests.approve` | `requestId` | Decisão, empréstimo e auditoria na mesma transação; horário do servidor |
| `requests.reject` | `requestId`, motivo obrigatório após trim, até 500 caracteres | Rejeição, autor/data e auditoria; não cria Loan |

O limite é aplicado à pessoa/vínculo do tenant da sessão, preservando o isolamento. Não criar identificação/consulta por CPF. Proposta técnica de paginação e tamanhos é revisável; não representa novo limite de negócio.

## Estados e mensagens propostas

| Situação | Código tRPC | Mensagem |
|---|---|---|
| Limite atingido | FORBIDDEN | Você já está com 3 equipamentos. Aguarde uma devolução para solicitar outro. |
| Empréstimo em atraso | FORBIDDEN | Você tem equipamento em atraso. Regularize a devolução antes de solicitar outro. |
| Item/pedido alterado ou ocupado | CONFLICT | A disponibilidade mudou. Atualize a lista e tente novamente. |
| Decisão já registrada | CONFLICT | Esta solicitação já foi decidida. Atualize a lista. |
| Motivo ausente/inválido | BAD_REQUEST | Informe o motivo da rejeição. |
| Papel sem permissão | FORBIDDEN | Você não tem permissão para decidir solicitações. |
| Recurso inexistente/fora do tenant | NOT_FOUND | Solicitação ou equipamento não encontrado. |
| Falha inesperada do domínio | INTERNAL_SERVER_ERROR | Não foi possível concluir agora. Tente novamente. |

Não expor nome/dados de outro solicitante nas recusas. O formatter atual usa mensagem de login para qualquer erro interno: ajustar de forma contextual, preservando a mensagem do login e seus testes. Não substituir todas as mensagens de autenticação por texto do novo domínio.

## Interface conforme o layout existente

- Desktop escuro, sidebar 236px, tipografia/tokens/botões contornados do ADR-002. Catálogo em três colunas no desktop de referência, fotos 4:3 sem recortar equipamento e crédito discreto com autor/link da origem Pixabay.
- Manutenção permanece visível, com ação indisponível; fora de uso também não é solicitável. Pedido pendente e emprestado são distinguíveis, sem revelar a pessoa no catálogo. Não usar os números fictícios do layout como dados reais.
- Diálogo mostra retirada, limite três e “o prazo de 14 dias úteis começa após a aprovação”. Não mostrar data de devolução como se o pedido já estivesse aprovado; pedidos pendentes não ocupam os três segmentos de empréstimos ativos.
- Meus empréstimos separa pedidos e empréstimos, usa datas reais e estado vazio/carregamento/erro. Sem botão funcional de devolver ou tabela completa de histórico nesta spec, pois devolução está fora do recorte.
- Sidebar de Operações aparece só para OPERATIONS/ADMIN; tela mínima exibe ações de decisão. Não expor botões de cadastro, notificações ou páginas sem implementação. Proteção continua no servidor.
- Durante mutação, desabilitar clique repetido; depois invalidar consultas relacionadas. Em conflito, atualizar o estado e mostrar o motivo; não simular sucesso nem autoaprovar.

## Concorrência e auditoria propostas

Transações revalidam registros ativos, estado, disponibilidade, atraso e limite. Serializar por vínculo do solicitante antes de bloquear equipamento/pedido, sempre na mesma ordem; índices parciais existentes continuam como proteção de duplicação. Aprovações diferentes para quem tem dois ativos terminam com no máximo três. Sem retry cego: conflito/serialização informa atualização necessária e não duplica a decisão.

Auditoria append-only do pedido/criação e decisões, com ator do contexto, tenant, ação, recurso e IDs necessários; motivo de rejeição fica no pedido. Não registrar segredo, token, CPF ou dados de outro tenant. Em aprovação/rejeição, falha de auditoria desfaz a decisão. Nomes de ações/metadata serão fixados com E04–E06 antes do código correspondente.

## Prazo e histórico — proposta para E01

Não recalcular nenhum vencimento existente já é requisito confirmado. Proposta técnica: versionar a regra no registro Loan, marcando existentes como legado de 14 dias corridos e novos como 14 dias úteis em São Paulo. Preservar a validação do legado inclusive nas futuras atualizações de devolução, para que uma constraint nova não bloqueie atualizar empréstimos antigos.

E01 deve apresentar campo/tipo/default, função/constraint e SQL exato para aprovação, com testes desde banco vazio e upgrade da versão anterior. Não usar somente `CHECK ... NOT VALID` como se isso resolvesse o histórico: a regra nova também afetaria atualizações das linhas antigas. Não mudar a migration inicial nem executar DDL remoto nesta proposta. Se esse desenho estrutural for aprovado, registrar ADR antes da implementação.

## Arquivos previstos e sequência

Rotas sob `src/app/`, componentes sob `src/components/`, routers em `src/server/api/routers/`, services em `src/server/services/`, testes nas pastas existentes `tests/unit`, `tests/db` e `tests/e2e`. Sem dependência nova ou segundo caminho de API. A lista exata dos arquivos de cada tarefa será registrada no plano antes da respectiva implementação.

1. Contratos da E00 aprovados em 09/nov/2026; este documento registra a versão aceita.
2. E01: apresentar/aprovar DDL versionado do prazo e executar somente em banco descartável; E02: implementar/testar calendário.
3. E03–E06: consultas, pedido e decisões com três ativos, isolamento e concorrência.
4. E07/E08: telas; E09: sincronizar prazo nas apresentações, mantendo três itens.
5. E10: checks/verificador e prova isolada; E11: publicação depende de autorização própria. Delegação D08 não é autorização permanente para outras migrations ou deploy.

Pendência após a aprovação dos contratos: apresentar e aprovar o desenho/SQL exato do prazo em E01. Nenhuma nova decisão de negócio sobre aprovação, limite, fotos ou feriados é solicitada; as respostas existentes foram reaproveitadas. Implementação dos procedimentos e telas permanece nas tarefas próprias do plano.
