# E01 — Proposta SQL do prazo versionado

Data: 09/nov/2026. Status: proposta para aprovação; **não implementada nem executada**. Este arquivo apresenta a alteração estrutural antes do schema/migration, conforme `rules/migration.md`. Contratos E00 aprovados; limite três permanece no ADR-008. Regras de calendário são as já confirmadas no ADR-004, sem nova pergunta sobre feriados ou início da contagem.

## Resultado esperado e decisão solicitada

- Empréstimos que existirem no instante da migration conservam exatamente `checked_out_at`, `due_at`, IDs, demais campos e timestamps. Recebem somente a identificação da regra legada.
- Empréstimos criados depois usam 14 dias úteis: segunda a sexta, sem feriados, excluindo o dia da aprovação e mantendo o horário em `America/Sao_Paulo`.
- A regra legada não pode ser escolhida em uma inserção nova. Após a criação, início, vencimento e regra ficam imutáveis; campos de solicitação/confirmação de devolução continuam atualizáveis, respeitando as proteções já existentes.
- A imutabilidade é parte explícita desta proposta: uma futura correção/renovação de prazo exigiria desenho próprio. Não será introduzido um caminho de edição de vencimento nesta spec.

Essa separação evita recalcular o passado e evita que a constraint nova bloqueie uma atualização legítima de devolução de um empréstimo antigo. Não apagar nem recriar registros para migrar a regra.

## Modelo Prisma proposto

Acrescentar o enum e um campo em `Loan`:

```prisma
enum LoanDueRule {
  LEGACY_CALENDAR_14
  BUSINESS_14_SP
}

// Campo adicional no model Loan existente:
// due_rule LoanDueRule @default(BUSINESS_14_SP)
```

| Objeto | Alteração |
|---|---|
| `loans.due_rule` | Enum obrigatório; existentes recebem `LEGACY_CALENDAR_14`, default final para novas linhas é `BUSINESS_14_SP` |
| `loan_due_14_days` | Remover somente essa constraint antiga de 14 dias corridos |
| `loans_due_by_rule` | Nova CHECK validada, com ramo legado que preserva as datas e ramo novo que exige cálculo útil |
| `loan_due_14_business_days_v1` | Função pura do cálculo em São Paulo, versão 1; sem ler tabelas de domínio ou calendário externo |
| `loans_guard_due_rule` | Trigger que impede novas linhas legadas e mudança posterior de início/vencimento/regra |

Nenhuma nova tabela, FK, relação ou índice. `tenant_id`, RLS, privilégios, auditoria, índices parciais e trigger que vincula o empréstimo à solicitação aprovada permanecem. O campo não entra no input da API; E05 usará a regra nova e o horário do servidor.

## SQL proposto para a nova migration

Nome previsto: `202611090001_loan_due_rules`. O bloco abaixo **é proposta Markdown**, não arquivo executável de migration. Uma única instrução `DO` torna o DDL atômico, seguindo o padrão local da D04; não usar um `BEGIN` externo.

```sql
DO $migration$
BEGIN
  -- Se não conseguir o lock em 5 s, falhar sem aplicar parte do desenho.
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  LOCK TABLE public.loans IN ACCESS EXCLUSIVE MODE;

  CREATE TYPE public."LoanDueRule" AS ENUM (
    'LEGACY_CALENDAR_14',
    'BUSINESS_14_SP'
  );

  -- O default inicial identifica as linhas existentes sem UPDATE de datas.
  ALTER TABLE public.loans
    ADD COLUMN due_rule public."LoanDueRule" NOT NULL
    DEFAULT 'LEGACY_CALENDAR_14'::public."LoanDueRule";

  ALTER TABLE public.loans
    ALTER COLUMN due_rule
    SET DEFAULT 'BUSINESS_14_SP'::public."LoanDueRule";

  CREATE FUNCTION public.loan_due_14_business_days_v1(
    p_checked_out_at timestamp with time zone
  ) RETURNS timestamp with time zone
  LANGUAGE plpgsql
  IMMUTABLE STRICT SECURITY INVOKER
  SET search_path = pg_catalog
  AS $calendar$
  DECLARE
    v_local timestamp without time zone;
    v_count integer := 0;
  BEGIN
    IF NOT pg_catalog.isfinite(p_checked_out_at) THEN
      RAISE EXCEPTION 'loan start must be finite'
        USING ERRCODE = '23514';
    END IF;

    v_local := p_checked_out_at AT TIME ZONE 'America/Sao_Paulo';
    WHILE v_count < 14 LOOP
      v_local := v_local + INTERVAL '1 day';
      IF EXTRACT(ISODOW FROM v_local) BETWEEN 1 AND 5 THEN
        v_count := v_count + 1;
      END IF;
    END LOOP;
    RETURN v_local AT TIME ZONE 'America/Sao_Paulo';
  END;
  $calendar$;

  CREATE FUNCTION public.guard_loan_due_rule_v1()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = pg_catalog
  AS $guard$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF NEW.due_rule IS DISTINCT FROM
         'BUSINESS_14_SP'::public."LoanDueRule" THEN
        RAISE EXCEPTION 'new loans must use the business-day rule'
          USING ERRCODE = '23514';
      END IF;
    ELSIF NEW.checked_out_at IS DISTINCT FROM OLD.checked_out_at
       OR NEW.due_at IS DISTINCT FROM OLD.due_at
       OR NEW.due_rule IS DISTINCT FROM OLD.due_rule THEN
      RAISE EXCEPTION 'loan start, due date and due rule are immutable'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END;
  $guard$;

  ALTER TABLE public.loans DROP CONSTRAINT loan_due_14_days;

  ALTER TABLE public.loans
    ADD CONSTRAINT loans_due_by_rule CHECK (
      CASE due_rule
        WHEN 'LEGACY_CALENDAR_14'::public."LoanDueRule" THEN true
        WHEN 'BUSINESS_14_SP'::public."LoanDueRule" THEN
          due_at = public.loan_due_14_business_days_v1(checked_out_at)
        ELSE false
      END
    );

  CREATE TRIGGER loans_guard_due_rule
    BEFORE INSERT OR UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION public.guard_loan_due_rule_v1();

  REVOKE ALL ON FUNCTION
    public.loan_due_14_business_days_v1(timestamp with time zone)
    FROM PUBLIC, anon, authenticated;
  REVOKE ALL ON FUNCTION public.guard_loan_due_rule_v1()
    FROM PUBLIC, anon, authenticated;
END;
$migration$;
```

O ramo legado não recalcula a antiga expressão `checked_out_at + interval '14 days'`: ela depende do contexto de fuso da sessão e não deve reinterpretar um vencimento já armazenado. O trigger fecha a brecha de inserir legado novo ou editar datas depois. As constraints anteriores já validaram essas linhas no momento da gravação; a migration não tenta consertar/analisar retroativamente seu conteúdo.

Para as linhas novas, `checked_out_at` e `due_at` continuam NOT NULL. Função STRICT não cria uma brecha de NULL; instantes infinitos novos são rejeitados. O cálculo usa timestamp local para avançar os dias e volta ao instante com fuso explícito, sem depender do `TimeZone` da conexão. Não hardcodar UTC−3 ou usar `14 × 24 horas`.

O nome `v1` não autoriza substituir a função depois para mudar o significado de datas já validadas. Nova regra/fuso/feriados exigiria nova versão e revisão da CHECK. Atualizações de tzdata são dependência operacional do PostgreSQL e precisam ser avaliadas no calendário/versionamento; não se promete independência de alterações externas das regras de fuso.

## Efeitos, concorrência e reversão

O lock define o corte entre linhas anteriores e posteriores. Em PostgreSQL 16, adicionar default constante permite identificar as existentes sem UPDATE dos campos; `updated_at` não é tocado por código de ORM. A alteração ainda exige lock exclusivo, validação e janela de manutenção na publicação futura. Timeout não deve levar a retry cego ou SQL alternativo no destino.

Somente devolução/solicitação de devolução e outros campos não protegidos podem ser atualizados; todas as constraints/triggers anteriores continuam valendo. O backend Prisma usa o papel de migration/runtime existente; nenhuma função é SECURITY DEFINER ou lê empréstimos de outro tenant. Clientes públicos não recebem EXECUTE dessas funções.

Rollback técnico em falha do próprio bloco é atômico. Depois de criar empréstimos pela regra nova, **não** reintroduzir cegamente a CHECK antiga ou apagar o enum/campo: os vencimentos novos não são 14 dias corridos. Preferir correção versionada para frente. Um rollback de aplicação deve suspender novas aprovações até que o código escreva vencimentos compatíveis; não usar legado como escape de compatibilidade.

O publicador D08 tem whitelist de apenas duas migrations e deve continuar recusando uma terceira. Não ampliar essa whitelist como parte desta E01 nem reutilizar a autorização de produção do ADR-007. Publicação do novo prazo pertence à E11, com autorização própria.

## Arquivos e comandos após aprovação

Arquivos a criar/alterar somente depois da aprovação:

- ADR-009 para a decisão estrutural, registrado antes do código; `prisma/schema.prisma`; nova migration na pasta prevista acima.
- `tests/db/loan-due-rules.test.ts`: upgrade e comportamento/segurança no PostgreSQL 16 descartável.
- Fixtures de empréstimo em `tests/db/dados-pratica.test.ts` e `tests/db/conta-correcao.test.ts`: atualmente usam 14 dias corridos. Depois da migration, fixtures novas devem usar vencimento válido da regra nova, sem alterar o objetivo dos testes de conflito.
- Preservar os testes históricos D04 e as duas migrations anteriores. Aplicar nova migration também em cenário de upgrade completo.

Comando offline **proposto**, ainda não executado: guardar o schema anterior em `.local/e01-schema-before.prisma`, alterar o schema aprovado e gerar a parte declarativa com:

```powershell
npx prisma migrate diff --from-schema-datamodel .local/e01-schema-before.prisma --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/202611090001_loan_due_rules/migration.sql
```

Complementar a migration com o SQL aprovado acima e conferir default final/enum com o schema. Documentar o comando executado no AGENTS. Usar `tests/db/setup.ts` e `npm run test:db` para deploy exclusivamente no container criado pelo helper, que substitui as duas URLs de conexão. Não executar `db:deploy` com o ambiente real desta aplicação.

Depois: `npm run db:generate`, `npm run test:db`, `npm test`, `npm run test:imagens`, `npm run test:verificador`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, diff/status e recibo. Parar apenas o servidor deste projeto se houver lock do Prisma no Windows. Não há dependência nova ou alteração visual em E01; E02 implementará o cálculo TypeScript com os mesmos casos fixos.

## Provas previstas — CA-E12 e base de CA-E07

| Cenário | Resultado a comprovar depois da aprovação |
|---|---|
| Banco vazio + todas as migrations | Enum/default/CHECK/trigger existentes, sem passos SQL manuais |
| Upgrade com empréstimos antigos ativos e devolvidos | Mesmos IDs, datas, vínculos, demais campos e timestamps; apenas `due_rule` legado acrescentado |
| Devolução de empréstimo legado após upgrade | Atualiza campos de devolução sem reinterpretar vencimento |
| Datas antigas ou regra alteradas após criação | Falha com rollback, inclusive tentando converter legado em regra nova |
| Inserção nova com regra legada explícita | Falha; não existe bypass do cálculo útil |
| Novo empréstimo com default | Regra útil; prazo incorreto rejeitado, correto aceito, solicitação aprovada continua obrigatória |
| Segunda 09/nov/2026 10h São Paulo | Sexta 27/nov/2026 10h São Paulo |
| Sexta 06/nov/2026 10h São Paulo | Quinta 26/nov/2026 10h São Paulo |
| Aprovação sábado/domingo | Contagem começa na segunda útil seguinte; manter horário |
| Viradas de mês/ano, microssegundos e sessões UTC/Tokyo | Mesmo instante final para a mesma entrada, com horário local de São Paulo preservado |
| Instantes infinitos, NULL e papéis sem EXECUTE | Rejeição adequada em contexto de inserção; nenhum bypass de RLS |
| Lock indisponível/erro de DDL | Falha sem schema parcialmente alterado; nenhuma tentativa de correção no remoto |
| Segunda execução por Prisma Migrate | Nenhuma reaplicação SQL ou perda de dados |

Os testes de calendário terão expectativas fixas, não serão aprovados comparando a função consigo mesma. Fixtures de outras suítes podem usar a função para montar um empréstimo válido, pois seu objetivo ali é testar conflitos, não o cálculo do prazo.

## Alternativas consideradas

- Trocar a CHECK de todos os empréstimos para dias úteis: rejeita histórico ou exige recálculo, contrariando a preservação confirmada.
- Usar apenas NOT VALID: ainda aplica a expressão nova a inserts e updates, podendo bloquear devolução de linha antiga.
- Somente calcular no TypeScript e remover validação do banco: não preserva a defesa existente contra gravação de prazo inválido.
- Versionar sem impedir legado novo/edição de datas: deixa uma forma de escapar da regra nova e mudar o passado silenciosamente.

## Revisão documental e limites

SQL revisado como texto contra os objetos atuais e a documentação oficial do PostgreSQL 16. Não foi executado, não teve teste de sintaxe em servidor e não comprova CA-E12 atendido. Após aprovação, a criação via Prisma Migrate e os testes reais podem revelar ajustes técnicos; qualquer mudança de semântica precisa voltar à revisão.

Fontes consultadas em 09/nov/2026: [CHECK e imutabilidade](https://www.postgresql.org/docs/16/ddl-constraints.html), [ALTER TABLE, defaults e NOT VALID](https://www.postgresql.org/docs/16/sql-altertable.html), [AT TIME ZONE, ISODOW e isfinite](https://www.postgresql.org/docs/16/functions-datetime.html), [CREATE FUNCTION e privilégios](https://www.postgresql.org/docs/16/sql-createfunction.html).
