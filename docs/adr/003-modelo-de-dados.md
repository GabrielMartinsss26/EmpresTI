# ADR-003: Modelo de dados

## Contexto

O sistema precisa controlar usuários, equipamentos, solicitações, empréstimos e devoluções por tenant. As regras do PRD exigem limite de três empréstimos ativos, prazo de 14 dias corridos, bloqueio de novas solicitações para quem estiver em atraso e indisponibilidade de equipamentos em manutenção.

## Decisões

| Item | Escolha |
|---|---|
| Aprovação da solicitação | A equipe de Operações aprova ou rejeita a solicitação |
| Início do empréstimo | A aprovação cria o empréstimo e inicia o prazo de 14 dias corridos |
| Devolução pelo colaborador | O colaborador apenas solicita a devolução |
| Confirmação da devolução | Operações confirma a devolução, inclusive no balcão sem solicitação anterior |
| Papéis | `COLLABORATOR`, `OPERATIONS` e `ADMIN` |
| Perfil | Tabela própria, separada do usuário do Supabase Auth |
| Departamento | Campo opcional no perfil |
| Categorias | Tabela cadastrável por tenant |
| Estado operacional | `AVAILABLE`, `MAINTENANCE` ou `OUT_OF_SERVICE` |
| Emprestado | Estado derivado da existência de empréstimo ativo |
| Patrimônio | Obrigatório e único dentro do tenant |
| Número de série | Opcional e único dentro do tenant quando informado |
| Solicitação pendente | No máximo uma por equipamento |
| Rejeição | Permitida para Operações, com motivo obrigatório |
| Exclusão | Registros são desativados; não há exclusão física no fluxo da aplicação |
| Catálogo | Equipamento em manutenção continua visível como manutenção, sem poder ser solicitado |
| Isolamento | Toda tabela de domínio tem `tenant_id` e referências entre registros respeitam o mesmo tenant |
| RLS | Habilitado com deny by default e policies explícitas |
| Auditoria | Registro append-only de ator, tenant, ação e recurso |

## Modelo aprovado

### `tenants`

Tabela raiz da separação entre organizações. Não recebe `tenant_id` porque ela própria representa o tenant.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `slug` | texto | Obrigatório e único |
| `name` | texto | Obrigatório |
| `deactivated_at` | data e hora | Opcional; preenchido quando o tenant é desativado |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

O seed inicial cria somente o tenant `suporte_ti` e pode ser executado novamente sem duplicá-lo.

### `profiles`

Tabela global de perfil vinculada ao usuário do Supabase Auth. Não recebe `tenant_id` porque a associação com cada tenant e o papel correspondente ficam em `memberships`.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária e referência a `auth.users.id` |
| `full_name` | texto | Obrigatório |
| `department` | texto | Opcional |
| `deactivated_at` | data e hora | Opcional; preenchido quando o perfil é desativado |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

### `memberships`

Vínculo do perfil com um tenant e com seu papel naquele tenant.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `user_id` | UUID | Obrigatório; referência a `profiles.id`, mantendo o nome definido no ADR-001 |
| `role` | enum | `COLLABORATOR`, `OPERATIONS` ou `ADMIN` |
| `deactivated_at` | data e hora | Opcional; preenchido quando o vínculo é desativado |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

O par `tenant_id` e `user_id` é único. Há índices para busca por `user_id` e por `tenant_id` com `role`.

### `equipment_categories`

Categorias cadastráveis dentro de cada tenant.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `name` | texto | Obrigatório e único dentro do tenant |
| `description` | texto | Opcional |
| `deactivated_at` | data e hora | Opcional; preenchido quando a categoria é desativada |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

### `equipment`

Cadastro de equipamentos do tenant.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `category_id` | UUID | Obrigatório; referência a uma categoria do mesmo tenant |
| `name` | texto | Obrigatório |
| `asset_tag` | texto | Obrigatório e único dentro do tenant |
| `serial_number` | texto | Opcional e único dentro do tenant quando informado |
| `pickup_location` | texto | Obrigatório |
| `description` | texto | Opcional |
| `operational_status` | enum | `AVAILABLE`, `MAINTENANCE` ou `OUT_OF_SERVICE` |
| `deactivated_at` | data e hora | Opcional; preenchido quando o equipamento é desativado |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

O estado de emprestado não é salvo nesta tabela. Ele é derivado da existência de um empréstimo sem `returned_at`. Equipamentos em manutenção continuam no catálogo com esse estado, mas não podem receber solicitação.

### `loan_requests`

Solicitações de empréstimo feitas por colaboradores.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `equipment_id` | UUID | Obrigatório; referência a um equipamento do mesmo tenant |
| `requester_membership_id` | UUID | Obrigatório; referência a um vínculo do mesmo tenant |
| `status` | enum | `PENDING`, `APPROVED` ou `REJECTED` |
| `requested_at` | data e hora | Obrigatório |
| `decided_at` | data e hora | Obrigatório quando aprovada ou rejeitada |
| `decided_by_membership_id` | UUID | Obrigatório quando aprovada ou rejeitada; Operações ou Admin do mesmo tenant |
| `rejection_reason` | texto | Obrigatório quando rejeitada e vazio nos demais estados |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

Um índice único parcial permite somente uma solicitação `PENDING` por equipamento. A decisão e a criação do empréstimo ocorrem na mesma transação. Antes de aprovar, o sistema verifica novamente disponibilidade, estado operacional, limite de três empréstimos ativos e atraso do solicitante.

### `loans`

Empréstimos criados a partir de solicitações aprovadas.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `loan_request_id` | UUID | Obrigatório e único; referência à solicitação aprovada do mesmo tenant |
| `equipment_id` | UUID | Obrigatório; referência ao equipamento do mesmo tenant |
| `borrower_membership_id` | UUID | Obrigatório; referência ao solicitante do mesmo tenant |
| `approved_by_membership_id` | UUID | Obrigatório; Operações ou Admin do mesmo tenant |
| `checked_out_at` | data e hora | Momento da aprovação |
| `due_at` | data e hora | `checked_out_at` mais 14 dias corridos |
| `return_requested_at` | data e hora | Opcional; pedido de devolução feito pelo colaborador |
| `returned_at` | data e hora | Opcional; preenchido quando Operações confirma a devolução |
| `returned_by_membership_id` | UUID | Obrigatório quando `returned_at` estiver preenchido; Operações ou Admin do mesmo tenant |
| `created_at` | data e hora | Obrigatório |
| `updated_at` | data e hora | Obrigatório |

Um índice único parcial permite somente um empréstimo ativo por equipamento. A devolução pode ser confirmada por Operações mesmo sem `return_requested_at`. O atraso é derivado de `due_at` vencido com `returned_at` vazio.

### `audit_logs`

Histórico das ações relevantes do sistema.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `tenant_id` | UUID | Obrigatório; referência a `tenants.id` |
| `actor_membership_id` | UUID | Opcional; referência a um vínculo do mesmo tenant |
| `action` | texto | Obrigatório |
| `resource_type` | texto | Obrigatório |
| `resource_id` | UUID | Opcional |
| `metadata` | JSONB | Obrigatório |
| `created_at` | data e hora | Obrigatório |

Uma trigger impede `UPDATE` e `DELETE`. Novas ações são registradas com uma nova linha.

### `rate_limit_buckets`

Contadores técnicos de limite de requisições. Não recebem `tenant_id` porque o limite por IP também precisa funcionar antes do login e da resolução do tenant.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | UUID | Chave primária |
| `scope` | texto | Obrigatório; identifica o limite aplicado |
| `subject_hash` | texto | Obrigatório; hash do IP ou identificador do usuário, sem guardar IP bruto |
| `window_start` | data e hora | Obrigatório |
| `count` | inteiro | Obrigatório e não negativo |
| `expires_at` | data e hora | Obrigatório |

O conjunto `scope`, `subject_hash` e `window_start` é único. Há índice em `expires_at` para limpeza dos contadores vencidos.

## Integridade e acesso

- Referências entre tabelas de domínio usam chaves compostas com `tenant_id` para impedir vínculo entre tenants diferentes.
- RLS nasce habilitado com deny by default e policies explícitas em todas as tabelas da aplicação.
- O tenant vem da sessão e não é aceito como entrada do cliente.
- O backend continua responsável pela autorização principal; RLS é defesa em profundidade.
- As restrições de unicidade que dependem de estado usam índices únicos parciais no PostgreSQL.
- Não há remoção física no fluxo da aplicação. Perfis, vínculos, categorias, equipamentos e tenants são desativados; solicitações, empréstimos e auditorias preservam o histórico.
- A validação para solicitar e aprovar considera apenas registros ativos do mesmo tenant.

## Alternativas descartadas

- **Criar o empréstimo no momento da solicitação** — a operação precisa aprovar antes de iniciar o prazo e entregar o equipamento.
- **Permitir mais de uma solicitação pendente para o mesmo equipamento** — isso criaria uma fila que o escopo atual não define e permitiria aprovações concorrentes para o mesmo item.
- **Colaborador confirmar a própria devolução** — o colaborador apenas solicita; Operações confirma o recebimento físico.
- **Exigir solicitação digital antes de toda devolução** — Operações precisa confirmar uma devolução recebida diretamente no balcão.
- **Guardar `BORROWED` como estado do equipamento** — o mesmo fato ficaria duplicado no equipamento e no empréstimo ativo, com risco de divergência.
- **Categoria como texto livre no equipamento** — a categoria precisa ser cadastrável e reutilizada dentro do tenant.
- **Guardar perfil e papel somente no Supabase Auth** — o papel varia por tenant e o perfil precisa existir separado da identidade.
- **Excluir fisicamente os cadastros** — a exclusão apagaria referências e histórico de solicitação, empréstimo e auditoria.
- **Número de série obrigatório** — há equipamentos sem número de série informado; quando houver, ele continua único no tenant.
- **Ocultar equipamentos em manutenção do catálogo** — o estado precisa aparecer para quem consulta o catálogo, embora impeça nova solicitação.

## Consequências

### Fica mais fácil

- Saber se um equipamento está emprestado consultando um único empréstimo ativo.
- Impedir duas solicitações pendentes ou dois empréstimos ativos para o mesmo equipamento no próprio banco.
- Rastrear quem solicitou, quem decidiu e quem confirmou a devolução.
- Manter patrimônio, número de série e categorias isolados por tenant.
- Preservar o histórico quando um cadastro deixa de ser usado.

### Fica mais difícil

- Toda leitura de disponibilidade precisa considerar estado operacional, desativação, solicitação pendente e empréstimo ativo.
- Aprovar uma solicitação exige transação e nova validação das regras que já foram verificadas ao solicitar.
- Confirmar devolução exige atualizar o empréstimo e registrar auditoria na mesma operação.
- Referências com `tenant_id` deixam as chaves estrangeiras e as migrations mais extensas.
- Desativação exige filtros explícitos para não oferecer registros inativos em novos fluxos.

### O que isso impede de fazer depois sem custo

- Trocar o prazo global de 14 dias por prazos históricos diferentes sem guardar a regra aplicada em cada empréstimo.
- Criar fila de espera para o mesmo equipamento sem substituir a restrição de uma solicitação pendente e definir prioridade.
- Permitir autoatendimento de devolução sem mudar a responsabilidade e a auditoria do fluxo.
- Remover o modelo multi-tenant sem alterar chaves, índices, policies e todas as consultas de domínio.
- Transformar categoria em texto livre sem migrar referências existentes.
- Reaproveitar o mesmo patrimônio ou número de série dentro do mesmo tenant sem retirar as restrições de unicidade.

## O que este ADR NÃO decide

- O texto, a ordem e o visual das telas.
- As permissões detalhadas de cada ação para `OPERATIONS` e `ADMIN` além das decisões registradas aqui.
- Como convites criam o perfil e o primeiro vínculo do usuário.
- Quais ações entram na auditoria e o conteúdo exato de `metadata`.
- Os limites, janelas e mensagens do rate limit.
- A normalização de maiúsculas, minúsculas e espaços em patrimônio, número de série e nome de categoria.
- O fluxo de manutenção e a volta de um equipamento para disponível.
- Relatórios, notificações e exportação de dados.
- Retenção, anonimização ou exclusão exigida por política de dados.
