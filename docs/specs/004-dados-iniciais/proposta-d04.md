# Proposta D04 — Referências de imagem e acesso ao Storage

Status: proposta para revisão, solicitada em 06/nov/2026. Nenhuma escolha nova deste documento está aprovada. Não é uma migration; o SQL abaixo não foi executado. D04 permanece aberta.

## Resultado proposto

Cada equipamento pode ter uma imagem principal, com arquivo no Storage e metadados no banco. Equipamentos que já existem continuam válidos sem imagem. Para os 12 itens da prática, a população posterior deverá vincular as 12 imagens preparadas em D03.

Recomendo uma tabela `equipment_images`, ligada a `equipment` pelo equipamento e pelo tenant. Ela guarda caminho, créditos, tipo da imagem, dimensões, hashes e revisão. O arquivo continua fora do PostgreSQL. A aplicação consulta os dados pelo backend tRPC/Prisma; usuários não escrevem diretamente nessa tabela nem no bucket durante a prática.

Critérios atendidos quando houver implementação e testes: estrutura para CA-D01/CA-D03 e proteção local de CA-D05. Downloads públicos reais e publicação pertencem a D08. Esta proposta não comprova esses critérios executados.

## Base já confirmada

- ADR-001: Prisma Migrate é o único dono do schema da aplicação e da linha do tempo de policies; autorização principal no backend, RLS como defesa adicional.
- ADR-003: referências respeitam o tenant; cadastros são desativados e o histórico é preservado.
- ADR-005: Pixabay, WebP 800×600, foto inteira com bordas, limite de 1 MiB por saída, destino previsto `equipamentos / suporte_ti/<patrimonio>.webp` e créditos no catálogo futuro.
- D03: 12 imagens locais distintas; 11 fotografias e uma ilustração autorizada somente para TI-0007. A foto da câmera de ação foi aceita para TI-0012. Manifesto em [d03-manifesto.json](../../verificacoes/imagens/d03-manifesto.json).
- Escritas de produção da prática pertencem ao operador, conforme [planejamento](../../pratica.md).

## Escolhas novas propostas, ainda não decididas

| Ponto | Recomendação para aprovação | Motivo |
|---|---|---|
| Local dos metadados | Tabela `equipment_images` | Não espalhar campos de licença e revisão no cadastro do equipamento |
| Quantidade | Zero ou uma imagem principal por equipamento | Atende a prática e preserva equipamentos existentes sem imagem |
| Substituição futura | Mesmo registro e mesmo caminho; revisão e hashes atualizados mediante operação autorizada | Preserva o destino estável; não implementa galeria ou histórico de arquivos |
| Origem da URL exibida | Compor a partir da URL pública do projeto, bucket e caminho; não gravar o domínio do ambiente na tabela | Evita trocar todas as linhas ao mudar de ambiente |
| Escrita de arquivos nesta prática | Somente operador; bloquear clientes `anon` e `authenticated`, inclusive usuários Admin da aplicação | Publicação não vira uma funcionalidade de upload por ter uma sessão autenticada |
| Conteúdo permitido no bucket | `image/webp`, até 1.048.576 bytes por objeto | Corresponde ao pacote local já preparado |
| Vínculo com Storage | Guardar bucket/caminho, sem FK para tabelas internas do Storage | O ciclo de vida dos objetos pertence à API do Storage |

As recomendações não substituem a aprovação. Depois dela, registrar a decisão estrutural em ADR antes de modificar o schema. Não foi criado um ADR novo por iniciativa do agente.

## Entidade, campos e relacionamentos

Proposta: `public.equipment_images`, modelo Prisma futuro `EquipmentImage`. Campos não marcados como opcionais são obrigatórios quando a linha de imagem existe.

| Campos | Tipo PostgreSQL | Uso/regra |
|---|---|---|
| `id` | `uuid` | PK; UUID gerado pelo Prisma, seguindo o padrão atual |
| `tenant_id` | `uuid` | FK para `tenants.id` |
| `equipment_id` | `uuid` | Único; FK composta com `tenant_id` para `equipment(id, tenant_id)` |
| `storage_bucket`, `object_path` | `text` | Bucket `equipamentos`; caminho relativo; par único no namespace físico do Storage |
| `source_provider`, `source_id` | `text`, `bigint` | Pixabay e ID positivo da origem |
| `source_author`, `source_author_id` | `text`, `bigint` | Autor público e seu ID no provedor |
| `source_page_url` | `text` | Página HTTPS no Pixabay, não URL de consulta autenticada ou download temporário |
| `license_name`, `license_url` | `text` | Nome e link da Pixabay Content License |
| `media_kind` | `text` | `photo` ou `illustration`; registra honestamente a exceção de TI-0007 |
| `mime_type`, `width`, `height` | `text`, `integer`, `integer` | `image/webp`, 800 e 600 |
| `size_bytes` | `integer` | Positivo e até 1 MiB; medido no arquivo preparado |
| `source_sha256`, `sha256` | `text` | SHA-256 hexadecimal do original inspecionado e da saída |
| `reviewed_at`, `reviewed_by`, `review_note` | `timestamptz(6)`, `text`, `text` | Revisão identificada e motivo, oriundos do manifesto/evidência de D03 |
| `deactivated_at` | `timestamptz(6)`, opcional | Desativação da referência; não apaga o objeto remoto |
| `created_at`, `updated_at` | `timestamptz(6)` | Criação com default do banco; atualização pelo Prisma `@updatedAt` |

Relacionamentos Prisma a acrescentar somente após aprovação: `Equipment.image` opcional, `Tenant.equipment_images` como coleção, e as relações inversas em `EquipmentImage`. Índice em `tenant_id` para consultas de imagens/créditos por tenant; índices únicos para equipamento e destino físico.

O banco impede associar a linha ao equipamento de outro tenant. Ele não prova que o objeto existe, que os bytes correspondem ao hash ou que o caminho foi montado para aquele patrimônio. A população de D05 deverá conferir o manifesto, o tenant e o patrimônio, e validar o destino `<tenant.slug>/<asset_tag>.webp`. Não aceitar caminho arbitrário do navegador. Nenhum conteúdo binário ou segredo fica nesta tabela.

Não proponho unicidade global de ID Pixabay/hash no banco: a ausência de repetição dos 12 itens é validada pelo pipeline e deverá ser conferida na importação. Isso evita proibir, por acidente, que outro tenant use a mesma imagem pública. Política de reutilização fora do conjunto inicial continua não decidida.

## DDL de referência para revisão

Este bloco é uma proposta legível do resultado pretendido. A migration definitiva será gerada a partir do schema Prisma aprovado e complementada com constraints, RLS e trigger na mesma migration. Não copiar este bloco para o SQL Editor de produção.

```sql
BEGIN;

-- Dependência do serviço: não criar ou recriar o schema interno do Storage.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'Storage deve estar provisionado antes desta migration';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'storage.objects'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS do Storage precisa estar habilitado pelo serviço';
  END IF;
END;
$$;

CREATE TABLE public.equipment_images (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  equipment_id uuid NOT NULL,
  storage_bucket text NOT NULL,
  object_path text NOT NULL,
  source_provider text NOT NULL,
  source_id bigint NOT NULL,
  source_author text NOT NULL,
  source_author_id bigint NOT NULL,
  source_page_url text NOT NULL,
  license_name text NOT NULL,
  license_url text NOT NULL,
  media_kind text NOT NULL,
  mime_type text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  size_bytes integer NOT NULL,
  source_sha256 text NOT NULL,
  sha256 text NOT NULL,
  reviewed_at timestamptz(6) NOT NULL,
  reviewed_by text NOT NULL,
  review_note text NOT NULL,
  deactivated_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT equipment_images_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_images_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT equipment_images_equipment_tenant_fkey
    FOREIGN KEY (equipment_id, tenant_id)
    REFERENCES public.equipment(id, tenant_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT equipment_images_equipment_key UNIQUE (equipment_id),
  CONSTRAINT equipment_images_object_key UNIQUE (storage_bucket, object_path),
  CONSTRAINT equipment_images_destination CHECK (
    storage_bucket = 'equipamentos'
    AND length(btrim(object_path)) > 0
    AND object_path NOT LIKE '/%'
    AND strpos(object_path, '?') = 0 AND strpos(object_path, '#') = 0
    AND object_path !~ '(^|/)[.]{1,2}(/|$)'
    AND strpos(object_path, chr(92)) = 0
    AND strpos(object_path, '//') = 0
    AND object_path LIKE '%.webp'
  ),
  CONSTRAINT equipment_images_source CHECK (
    source_provider = 'Pixabay'
    AND source_id > 0 AND source_author_id > 0
    AND length(btrim(source_author)) > 0
    AND source_page_url ~ '^https://pixabay[.]com/(photos|illustrations)/[^?#[:space:]]+$'
    AND license_name = 'Pixabay Content License'
    AND license_url = 'https://pixabay.com/service/license-summary/'
  ),
  CONSTRAINT equipment_images_format CHECK (
    media_kind IN ('photo', 'illustration')
    AND mime_type = 'image/webp'
    AND width = 800 AND height = 600
    AND size_bytes BETWEEN 1 AND 1048576
  ),
  CONSTRAINT equipment_images_hashes CHECK (
    source_sha256 ~ '^[0-9a-f]{64}$' AND sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT equipment_images_review CHECK (
    length(btrim(reviewed_by)) > 0 AND length(btrim(review_note)) > 0
  )
);

CREATE INDEX equipment_images_tenant_idx ON public.equipment_images(tenant_id);

ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_only ON public.equipment_images
  FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
REVOKE ALL ON TABLE public.equipment_images FROM PUBLIC, anon, authenticated;

CREATE TRIGGER preserve_history
  BEFORE DELETE ON public.equipment_images
  FOR EACH ROW EXECUTE FUNCTION public.prevent_physical_delete();

-- Guard restritivo: não concede acesso a outros buckets nem substitui policies deles.
CREATE POLICY equipment_objects_block_app_clients
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (bucket_id IS DISTINCT FROM 'equipamentos')
  WITH CHECK (bucket_id IS DISTINCT FROM 'equipamentos');

COMMIT;
```

O importador futuro deverá converter IDs do manifesto para `BigInt` no servidor. O catálogo deve devolver somente URL e créditos necessários ao cliente, sem retornar toda a linha ou um `BigInt` cru por conveniência.

O manifesto registra dimensões, hashes e créditos; o tamanho é medido no arquivo preparado e o tipo aprovado consta de `d03-final.json`. D05 deverá conferir as duas evidências e os bytes, sem classificar a ilustração como foto por falta de um campo no manifesto. Os checks de banco não substituem a revisão visual.

## Storage e permissões propostas

| Operação | Visitante / usuário da aplicação | Operador |
|---|---|---|
| Abrir URL pública de imagem conhecida | Permitido pelo bucket público | Permitido |
| Listar metadados de objetos do bucket via API autenticada | Negado para `anon`/`authenticated` pela policy proposta | Administração conforme os privilégios usados |
| Criar, substituir, mover, copiar ou remover objeto | Sem permissão de cliente neste bucket | Publicação administrativa pelo operador, via serviço Storage |
| Consultar metadados de domínio | Backend tRPC com sessão e filtro de tenant; acesso direto negado | Não muda o contrato do backend |

O [bucket público](https://supabase.com/docs/guides/storage/buckets/fundamentals) permite servir a imagem sem login; isso não concede upload. A [documentação de acesso](https://supabase.com/docs/guides/storage/security/access-control) distingue upload, sobrescrita e privilégios administrativos. A policy proposta bloqueia também a listagem de metadados por clientes, sem exigir uma policy de SELECT pública para servir arquivos.

No PostgreSQL, [policies permissivas se combinam por OR e restritivas por AND](https://www.postgresql.org/docs/16/sql-createpolicy.html). Por isso o guard é restritivo: uma policy permissiva ampla existente não deve liberar o bucket para esses dois papéis. Para outros buckets, ele não concede nem retira permissões existentes. Papéis com bypass de RLS, owners e credenciais administrativas continuam fora dessa proteção; o projeto não recebe uma garantia global de isolamento do agente só por existir essa policy.

Pré-condições da migration: os papéis `anon` e `authenticated` devem existir e o papel de migration precisa poder criar a policy em `storage.objects`. Se isso não for possível, interromper e revisar o caminho de execução; não contornar usando um segundo SQL avulso no painel. Não remover policies existentes de outros recursos.

Bucket a provisionar depois pelo operador: `equipamentos`, público, `allowedMimeTypes = ['image/webp']`, limite `fileSizeLimit = 1048576`. Configuração e upload pela interface/API do Storage; não inserir ou apagar linhas de `storage.buckets`/`storage.objects` na migration. O [schema interno do serviço](https://supabase.com/docs/guides/storage/schema/design) não é o armazenamento dos bytes. A migration versiona nossa policy, sem recriar tabelas do serviço. As [restrições de bucket](https://supabase.com/docs/guides/storage/buckets/creating-buckets) não validam por si só dimensões ou conteúdo visual.

Não haverá FK de `equipment_images` para `storage.objects` nem colunas do Storage modeladas no Prisma. A ausência do bucket não impede a criação da tabela de domínio/policy, desde que o serviço já exista; ela impede a publicação posterior. O agente não cria bucket nem envia arquivos nesta tarefa.

## Linhas existentes, publicação e consequências

- A migration cria uma décima tabela de domínio/técnica no schema público da aplicação e não altera os nove cadastros/tabelas existentes. A tabela nova começa vazia; não há campo obrigatório novo em `equipment`, backfill ou reset de status. Há locks de DDL/FKs durante a aplicação; duração real não foi medida.
- A ligação é opcional para equipamentos existentes. A interface da spec 005 deverá tratar ausência de imagem; o visual desse fallback será definido lá.
- Dados dos 12 equipamentos e suas referências serão preparados em D05, após decidir a política para registros já existentes. Nenhum upsert destrutivo está autorizado por esta proposta. A leitura dos créditos deve filtrar tenant e equipamentos/referências ativos.
- Para produção, o operador publica os objetos aprovados, confere URLs/bytes e depois executa a população de referências autorizada. PostgreSQL e Storage não participam de uma mesma transação: uma falha pode deixar objetos sem referência ou uma referência sem arquivo; conferir e corrigir explicitamente, sem apagar dados por conta própria.
- Desativar o registro esconde a referência no fluxo da aplicação, mas não revoga uma URL de bucket público. Não colocar documentos internos, pessoas ou dados privados nesse bucket.
- Uma imagem por equipamento simplifica o catálogo, mas várias imagens exigiriam mudar a unicidade e o contrato. Substituir no mesmo caminho também exige tratar cache pela nova hash na URL/na publicação; detalhes de implementação pertencem às etapas de publicação/catálogo.
- Mudar o domínio do ambiente exige somente recompor URLs; mudar bucket, formato, caminho/patrimônio ou slug pode exigir atualizar referências e objetos. A proposta não implementa renomeação de patrimônios/tenants.
- Reversão de publicação não deve usar DROP TABLE ou apagar objetos automaticamente. Se houver problema, suspender uso da funcionalidade e preparar correção incremental preservando linhas/arquivos; exclusão exige plano e aprovação próprios.

## Alternativas avaliadas

| Alternativa | Motivo para não ser a recomendação |
|---|---|
| Adicionar todos os campos em `equipment` | Mistura créditos/revisão com cadastro e cria vários campos opcionais para dados antigos |
| Guardar somente a URL pública | Não guarda licença, origem ou hashes; acopla a linha ao domínio do ambiente |
| Guardar imagem em `bytea`/base64 no PostgreSQL | Contraria o destino Storage escolhido e aumenta leitura/backup do banco |
| Várias imagens por equipamento agora | Exige ordenação, imagem principal e novas telas sem necessidade na prática |
| Liberar upload para Admin/Operações da aplicação | Cria fluxo de publicação não solicitado e muda o limite de execução da prática |
| Bucket privado e URLs assinadas | Contraria a leitura pública já escolhida no ADR-005 |
| Policy permissiva de negação isolada no Storage | Uma outra policy permissiva pode conceder acesso pelo OR |

São alternativas da proposta, não decisões descartadas já aprovadas pelo responsável.

## Execução posterior à aprovação

1. Registrar a decisão estrutural aprovada em ADR e atualizar spec/plano; manter pendências que não foram respondidas.
2. Registrar no AGENTS o comando novo de geração aprovado. Criar snapshot local do schema atual em `.local/d04-schema-before.prisma` antes de modificá-lo; criar o diretório futuro `prisma/migrations/202611060001_equipment_images/`. A migration inicial permanece intacta.
3. Acrescentar o modelo/relações ao Prisma. Comando proposto de geração offline, ainda não executado nem autorizado como comando vigente:

   ```powershell
   npx prisma migrate diff --from-schema-datamodel .local/d04-schema-before.prisma --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202611060001_equipment_images/migration.sql
   ```

   As opções existem no CLI Prisma 6 instalado, conferidas em `node_modules/prisma/build/index.js`. O diff usa dois arquivos de datamodel, sem introspecção do banco remoto. Complementar o SQL gerado com checks/policies/trigger aprovados na mesma migration e revisar o diff.

4. Atualizar o harness de `tests/db/migration.test.ts`: antes das migrations, criar apenas fixtures descartáveis de `auth.users`, papéis `anon`/`authenticated` e `storage.objects` com RLS. São simulações da infraestrutura externa, como o teste atual já faz para Auth; nunca criar essas tabelas do serviço na migration da aplicação.
5. Executar `npm run db:generate`, `npm run test:db`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` e `npm run build`, com conexões da suíte de banco injetadas exclusivamente pelo container descartável. Não usar o Supabase compartilhado de dev/prod. A aplicação local pode precisar ser parada durante a geração/build no Windows por lock do Prisma.

Casos de banco a acrescentar na implementação: aplicar tudo desde vazio; contar dez tabelas públicas sem contar `_prisma_migrations`; PK/FKs/índices/RLS; equipamento sem imagem; segunda imagem para o mesmo equipamento recusada; destino duplicado recusado; tenant incorreto recusado; campos/URL/hash/formato inválidos recusados; desativação permitida e DELETE físico negado. Para provar RLS e não apenas REVOKE, testar também papel sem owner com grants temporários de teste, mantendo a policy ativa.

Casos do guard de Storage em fixture: `anon` e `authenticated` não leem/listam nem alteram objetos do bucket mesmo com uma policy permissiva ampla instalada somente no teste; INSERT recusado, UPDATE/DELETE sem alterar linhas, mover de outro bucket para este recusado; acesso de outro bucket preservado conforme sua policy. Remover o guard só no teste deve fazer a prova negativa falhar. Isso prova SQL de RLS, não o servidor HTTP do Storage.

Depois, D08 exige evidência separada do operador: GET público sem login, escrita por cliente negada, ausência de duplicação e reexecução no destino. Não declarar esses resultados a partir das fixtures. Verificação independente da spec inteira continua em D07, conforme `rules/spec-flow.md`.

## Pendências que esta proposta não resolve

Política sobre equipamentos/imagens existentes alterados ou inativos, conflitos de reexecução, auditoria exata da população, conta já existente/inativa do professor e preservação de prazos antigos: não decidido. D05/D06 e a migration de prazo da spec 005 precisam dessas decisões antes de implementar suas partes. Nenhuma dependência nova, upload por interface, exclusão remota ou publicação pelo agente foi proposta como já autorizada.

## Revisão solicitada

Conferência documental desta etapa: campos e FKs comparados ao schema versionado; compatibilidade dos 12 registros de origem/dimensões conferida no manifesto; links locais e blocos Markdown conferidos; `git diff --check` sem erros. Nenhum teste de migration, execução do SQL, consulta ao banco remoto ou publicação foi realizado. A aprovação da proposta não deve ser confundida com prova de que o SQL já foi aplicado ou testado.

Aprovar ou ajustar o pacote proposto: tabela separada com uma imagem principal opcional; campos/constraints/índices acima; metadados fechados para acesso direto; guard de Storage com escrita administrativa somente pelo operador; comando de geração e testes locais descritos. Criar o bucket/publicar em produção não faz parte dessa aprovação de implementação local.

A exigência de parar antes de alterar o schema vem de [rules/migration.md](../../../rules/migration.md), passo 2: “Antes de alterar o schema, apresente as entidades, campos, tipos, relacionamentos, constraints, índices e efeitos esperados. Pare e aguarde aprovação.” A proposta documental está preparada; schema, migrations e ambientes continuam sem alteração.
