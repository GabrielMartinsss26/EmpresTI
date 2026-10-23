-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

BEGIN;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLLABORATOR', 'OPERATIONS', 'ADMIN');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "department" TEXT,
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "serial_number" TEXT,
    "pickup_location" TEXT NOT NULL,
    "description" TEXT,
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'AVAILABLE',
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "requester_membership_id" UUID NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "decided_by_membership_id" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "loan_request_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "borrower_membership_id" UUID NOT NULL,
    "approved_by_membership_id" UUID NOT NULL,
    "checked_out_at" TIMESTAMPTZ(6) NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "return_requested_at" TIMESTAMPTZ(6),
    "returned_at" TIMESTAMPTZ(6),
    "returned_by_membership_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_membership_id" UUID,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "subject_hash" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_role_idx" ON "memberships"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_id_tenant_id_key" ON "memberships"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenant_id_user_id_key" ON "memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_id_tenant_id_key" ON "equipment_categories"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_tenant_id_name_key" ON "equipment_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "equipment_tenant_id_operational_status_idx" ON "equipment"("tenant_id", "operational_status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_id_tenant_id_key" ON "equipment"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_asset_tag_key" ON "equipment"("tenant_id", "asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_tenant_id_serial_number_key" ON "equipment"("tenant_id", "serial_number");

-- CreateIndex
CREATE INDEX "loan_requests_tenant_id_status_requested_at_idx" ON "loan_requests"("tenant_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "loan_requests_tenant_id_requester_membership_id_idx" ON "loan_requests"("tenant_id", "requester_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_requests_id_tenant_id_key" ON "loan_requests"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loan_request_id_key" ON "loans"("loan_request_id");

-- CreateIndex
CREATE INDEX "loans_tenant_id_borrower_membership_id_returned_at_idx" ON "loans"("tenant_id", "borrower_membership_id", "returned_at");

-- CreateIndex
CREATE INDEX "loans_tenant_id_returned_at_due_at_idx" ON "loans"("tenant_id", "returned_at", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "loans_loan_request_id_tenant_id_key" ON "loans"("loan_request_id", "tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_scope_subject_hash_window_start_key" ON "rate_limit_buckets"("scope", "subject_hash", "window_start");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_category_id_tenant_id_fkey" FOREIGN KEY ("category_id", "tenant_id") REFERENCES "equipment_categories"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_equipment_id_tenant_id_fkey" FOREIGN KEY ("equipment_id", "tenant_id") REFERENCES "equipment"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_requester_membership_id_tenant_id_fkey" FOREIGN KEY ("requester_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_decided_by_membership_id_tenant_id_fkey" FOREIGN KEY ("decided_by_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_loan_request_id_tenant_id_fkey" FOREIGN KEY ("loan_request_id", "tenant_id") REFERENCES "loan_requests"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_equipment_id_tenant_id_fkey" FOREIGN KEY ("equipment_id", "tenant_id") REFERENCES "equipment"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_membership_id_tenant_id_fkey" FOREIGN KEY ("borrower_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_membership_id_tenant_id_fkey" FOREIGN KEY ("approved_by_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_membership_id_tenant_id_fkey" FOREIGN KEY ("returned_by_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_membership_id_tenant_id_fkey" FOREIGN KEY ("actor_membership_id", "tenant_id") REFERENCES "memberships"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supabase Auth gerencia a identidade; Prisma gerencia apenas o perfil público.
ALTER TABLE profiles ADD CONSTRAINT profiles_auth_user_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX loan_requests_one_pending_equipment
  ON loan_requests (tenant_id, equipment_id) WHERE status = 'PENDING';
CREATE UNIQUE INDEX loans_one_active_equipment
  ON loans (tenant_id, equipment_id) WHERE returned_at IS NULL;

ALTER TABLE equipment ADD CONSTRAINT equipment_asset_not_blank CHECK (length(btrim(asset_tag)) > 0);
ALTER TABLE equipment ADD CONSTRAINT equipment_serial_not_blank CHECK (serial_number IS NULL OR length(btrim(serial_number)) > 0);
ALTER TABLE rate_limit_buckets ADD CONSTRAINT rate_limit_nonnegative CHECK (count >= 0);
ALTER TABLE rate_limit_buckets ADD CONSTRAINT rate_limit_valid_window CHECK (expires_at > window_start);
ALTER TABLE loan_requests ADD CONSTRAINT loan_request_decision_fields CHECK (
  (status = 'PENDING' AND decided_at IS NULL AND decided_by_membership_id IS NULL AND rejection_reason IS NULL)
  OR (status = 'APPROVED' AND decided_at IS NOT NULL AND decided_by_membership_id IS NOT NULL AND rejection_reason IS NULL)
  OR (status = 'REJECTED' AND decided_at IS NOT NULL AND decided_by_membership_id IS NOT NULL AND rejection_reason IS NOT NULL AND length(btrim(rejection_reason)) > 0)
);
ALTER TABLE loan_requests ADD CONSTRAINT loan_request_decision_order CHECK (decided_at IS NULL OR decided_at >= requested_at);
ALTER TABLE loans ADD CONSTRAINT loan_due_14_days CHECK (due_at = checked_out_at + interval '14 days');
ALTER TABLE loans ADD CONSTRAINT loan_return_fields CHECK (
  (returned_at IS NULL AND returned_by_membership_id IS NULL)
  OR (returned_at IS NOT NULL AND returned_by_membership_id IS NOT NULL AND returned_at >= checked_out_at)
);
ALTER TABLE loans ADD CONSTRAINT loan_return_request_order CHECK (return_requested_at IS NULL OR return_requested_at >= checked_out_at);

-- Impede que o empréstimo seja ligado a outro equipamento ou solicitante.
CREATE FUNCTION validate_loan_request() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM loan_requests r WHERE r.id = NEW.loan_request_id
      AND r.tenant_id = NEW.tenant_id AND r.status = 'APPROVED'
      AND r.equipment_id = NEW.equipment_id
      AND r.requester_membership_id = NEW.borrower_membership_id
      AND r.decided_by_membership_id = NEW.approved_by_membership_id
      AND r.decided_at = NEW.checked_out_at
  ) THEN RAISE EXCEPTION 'loan must match its approved request'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER loans_match_approved_request BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION validate_loan_request();

-- Sem policy permissiva para o cliente: autorização principal fica no backend.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['tenants', 'profiles', 'memberships', 'equipment_categories', 'equipment', 'loan_requests', 'loans', 'audit_logs', 'rate_limit_buckets']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY backend_only ON %I FOR ALL TO PUBLIC USING (false) WITH CHECK (false)', table_name);
  END LOOP;
END;
$$;

CREATE FUNCTION preserve_audit_log() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END;
$$;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION preserve_audit_log();

CREATE FUNCTION prevent_physical_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'physical deletion is disabled; deactivate the record'; END;
$$;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['tenants', 'profiles', 'memberships', 'equipment_categories', 'equipment', 'loan_requests', 'loans']
  LOOP
    EXECUTE format('CREATE TRIGGER preserve_history BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION prevent_physical_delete()', table_name);
  END LOOP;
END;
$$;

COMMIT;
