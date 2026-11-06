-- Uma única instrução DO é atômica e permite ao Prisma registrar a causa de falha.
-- BEGIN externo deixaria a conexão abortada ao registrar o erro da migration.
DO $$
BEGIN
  -- Auth/Storage são infraestrutura do serviço, não tabelas da aplicação.
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'Storage deve estar provisionado antes desta migration';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'storage.objects'::regclass AND relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS do Storage precisa estar habilitado pelo serviço';
  END IF;
-- CreateTable
CREATE TABLE "equipment_images" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "object_path" TEXT NOT NULL,
    "source_provider" TEXT NOT NULL,
    "source_id" BIGINT NOT NULL,
    "source_author" TEXT NOT NULL,
    "source_author_id" BIGINT NOT NULL,
    "source_page_url" TEXT NOT NULL,
    "license_name" TEXT NOT NULL,
    "license_url" TEXT NOT NULL,
    "media_kind" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "source_sha256" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_note" TEXT NOT NULL,
    "deactivated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_images_equipment_key" ON "equipment_images"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_images_tenant_idx" ON "equipment_images"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_images_object_key" ON "equipment_images"("storage_bucket", "object_path");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_images_equipment_tenant_key" ON "equipment_images"("equipment_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "equipment_images" ADD CONSTRAINT "equipment_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_images" ADD CONSTRAINT "equipment_images_equipment_id_tenant_id_fkey" FOREIGN KEY ("equipment_id", "tenant_id") REFERENCES "equipment"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.equipment_images
  ADD CONSTRAINT equipment_images_destination CHECK (
    storage_bucket = 'equipamentos'
    AND length(btrim(object_path)) > 0
    AND object_path NOT LIKE '/%'
    AND strpos(object_path, '?') = 0 AND strpos(object_path, '#') = 0
    AND object_path !~ '(^|/)[.]{1,2}(/|$)'
    AND strpos(object_path, chr(92)) = 0
    AND strpos(object_path, '//') = 0
    AND object_path LIKE '%.webp'
  ),
  ADD CONSTRAINT equipment_images_source CHECK (
    source_provider = 'Pixabay'
    AND source_id > 0 AND source_author_id > 0
    AND length(btrim(source_author)) > 0
    AND source_page_url ~ '^https://pixabay[.]com/(photos|illustrations)/[^?#[:space:]]+$'
    AND license_name = 'Pixabay Content License'
    AND license_url = 'https://pixabay.com/service/license-summary/'
  ),
  ADD CONSTRAINT equipment_images_format CHECK (
    media_kind IN ('photo', 'illustration')
    AND mime_type = 'image/webp'
    AND width = 800 AND height = 600
    AND size_bytes BETWEEN 1 AND 1048576
  ),
  ADD CONSTRAINT equipment_images_hashes CHECK (
    source_sha256 ~ '^[0-9a-f]{64}$' AND sha256 ~ '^[0-9a-f]{64}$'
  ),
  ADD CONSTRAINT equipment_images_review CHECK (
    length(btrim(reviewed_by)) > 0 AND length(btrim(review_note)) > 0
  );

ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_only ON public.equipment_images
  FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
REVOKE ALL ON TABLE public.equipment_images FROM PUBLIC, anon, authenticated;

CREATE TRIGGER preserve_history BEFORE DELETE ON public.equipment_images
  FOR EACH ROW EXECUTE FUNCTION public.prevent_physical_delete();

-- Restritivo: protege este bucket mesmo diante de policy permissiva ampla.
CREATE POLICY equipment_objects_block_app_clients
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id IS DISTINCT FROM 'equipamentos')
  WITH CHECK (bucket_id IS DISTINCT FROM 'equipamentos');

END;
$$;
