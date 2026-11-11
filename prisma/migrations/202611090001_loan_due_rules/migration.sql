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
