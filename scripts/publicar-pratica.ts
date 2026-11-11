import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { z } from "zod";
import {
  inventory,
  populatePractice,
  validatePackage,
} from "../prisma/dados-pratica";

export const publicationProject = "gverauqgerwjwwjkoybl";
const migrationNames = [
  "202610190001_initial",
  "202611060001_equipment_images",
];
const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const configSchema = z.object({
  DIRECT_URL: z.url(),
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export function publicationConfig(input: unknown, args: string[]) {
  if (
    args.length !== 2 ||
    !args.includes("--apply") ||
    !args.includes(`--project=${publicationProject}`)
  )
    throw new Error(
      "Publicação exige --apply e o projeto explícito aprovado no ADR-007.",
    );
  const parsed = configSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Configuração de servidor incompleta/inválida para D08; nenhum valor exibido.",
    );
  const config = parsed.data;
  const api = new URL(config.NEXT_PUBLIC_SUPABASE_URL);
  if (
    api.protocol !== "https:" ||
    api.hostname !== `${publicationProject}.supabase.co` ||
    api.pathname !== "/" ||
    api.username ||
    api.password ||
    api.search ||
    api.hash
  )
    throw new Error("API não corresponde ao projeto autorizado.");
  for (const name of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const db = new URL(config[name]);
    const direct =
      db.hostname === `db.${publicationProject}.supabase.co` &&
      db.username === "postgres";
    const pooler =
      db.hostname.endsWith(".pooler.supabase.com") &&
      db.username === `postgres.${publicationProject}`;
    if (
      !["postgres:", "postgresql:"].includes(db.protocol) ||
      !(direct || pooler) ||
      db.pathname !== "/postgres"
    )
      throw new Error("Banco não corresponde ao projeto autorizado.");
  }
  return config;
}

export async function publishPractice(input: unknown, args: string[]) {
  const config = publicationConfig(input, args);
  // Todos os arquivos são conferidos antes da primeira conexão/mutação remota.
  const manifestBytes = await readFile(
    "docs/verificacoes/imagens/d03-manifesto.json",
  );
  const manifest = JSON.parse(manifestBytes.toString());
  const localManifest = JSON.parse(
    await readFile(".local/imagens-equipamentos/manifesto.json", "utf8"),
  );
  if (!isDeepStrictEqual(manifest, localManifest))
    throw new Error("Manifesto local difere da D03 aprovada.");
  const proof = JSON.parse(
    await readFile("docs/verificacoes/imagens/d03-final.json", "utf8"),
  );
  const bundle = await validatePackage(
    ".local/imagens-equipamentos/preparadas",
    manifest,
    proof,
  );
  const files = await Promise.all(
    inventory.map(async ([tag]) => {
      const entry = manifest.entries.find(
        (e: { assetTag: string }) => e.assetTag === tag,
      );
      const bytes = await readFile(
        `.local/imagens-equipamentos/preparadas/${tag}.webp`,
      );
      if (hash(bytes) !== entry.sha256)
        throw new Error("Arquivo mudou após validação.");
      return {
        tag,
        objectPath: `suporte_ti/${tag}.webp`,
        sha256: entry.sha256 as string,
        bytes,
      };
    }),
  );
  const available = (
    await readdir("prisma/migrations", { withFileTypes: true })
  )
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (!isDeepStrictEqual(available, migrationNames))
    throw new Error("Linha de migrations difere do recorte D08 autorizado.");
  const direct = new URL(config.DIRECT_URL);
  direct.searchParams.set("connect_timeout", "10");
  direct.searchParams.set("pool_timeout", "10");
  direct.searchParams.set("sslmode", "require");
  const db = new PrismaClient({ datasourceUrl: direct.href });
  const clientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const admin = createClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY,
    clientOptions,
  );
  const anon = createClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    clientOptions,
  );
  const report: Record<string, unknown> = {
    task: "D08",
    project: publicationProject,
    startedAt: new Date().toISOString(),
    manifestSha256: hash(manifestBytes),
    account: "ADIADA PELO RESPONSÁVEL; nenhuma mutação de Auth",
    authorization: "ADR-007; publicação delegada",
    globalIsolation: "NÃO COMPROVADO; CA-D07 BLOQUEADO",
    uploaded: [] as string[],
    stages: [] as string[],
    productionWrites: true,
    fullSpecReady: false,
  };
  let stage = "pré-validação de migrations";
  try {
    const applied = await db.$queryRaw<
      {
        migration_name: string;
        checksum: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }[]
    >`SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at`;
    if (
      !applied.some(
        (m) => m.migration_name === migrationNames[0] && m.finished_at,
      ) ||
      applied.some(
        (m) =>
          !migrationNames.includes(m.migration_name) ||
          !m.finished_at ||
          m.rolled_back_at,
      )
    )
      throw new Error(
        "Estado de migrations inesperado; não aplicar automaticamente.",
      );
    for (const migration of applied) {
      const sql = await readFile(
        `prisma/migrations/${migration.migration_name}/migration.sql`,
        "utf8",
      );
      if (
        ![sql, sql.replace(/\r?\n/g, "\n"), sql.replace(/\r?\n/g, "\r\n")].some(
          (s) => hash(Buffer.from(s)) === migration.checksum,
        )
      )
        throw new Error("Migration aplicada diverge dos bytes aprovados.");
    }
    stage = "migration D04";
    if (!applied.some((m) => m.migration_name === migrationNames[1])) {
      const env: NodeJS.ProcessEnv = { NODE_ENV: "production" };
      for (const [name, value] of Object.entries(process.env))
        if (
          /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(
            name,
          )
        )
          env[name] = value;
      const migrated = spawnSync(
        process.execPath,
        ["node_modules/prisma/build/index.js", "migrate", "deploy"],
        {
          env: { ...env, DATABASE_URL: direct.href, DIRECT_URL: direct.href },
          encoding: "utf8",
          windowsHide: true,
          timeout: 60_000,
        },
      );
      report.migration = {
        applied: migrationNames[1],
        exitCode: migrated.status,
      };
      if (migrated.status !== 0)
        throw new Error(
          "Prisma Migrate não concluiu; preservar destino e investigar sem imprimir credenciais.",
        );
    } else report.migration = { alreadyApplied: true };
    (report.stages as string[]).push(stage);
    stage = "proteções de banco e Storage";
    const security = await db.$queryRaw<Record<string, boolean>[]>`
      SELECT
        (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.equipment_images'::regclass) AS metadata_rls,
        (SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass) AS storage_rls,
        NOT has_table_privilege('anon', 'public.equipment_images', 'SELECT,INSERT,UPDATE,DELETE') AS metadata_anon_revoked,
        NOT has_table_privilege('authenticated', 'public.equipment_images', 'SELECT,INSERT,UPDATE,DELETE') AS metadata_authenticated_revoked,
        EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
          AND policyname = 'equipment_objects_block_app_clients' AND permissive = 'RESTRICTIVE'
          AND cmd = 'ALL' AND roles @> ARRAY['anon'::name, 'authenticated'::name]) AS restrictive_storage_guard`;
    report.databaseSecurity = security[0];
    if (
      !security[0] ||
      !Object.values(security[0]).every((value) => value === true)
    )
      throw new Error(
        "Proteções esperadas não confirmadas; interromper antes de publicar arquivos.",
      );
    stage = "simulação do lote";
    report.planned = (
      await populatePractice(db, bundle, { dryRun: true })
    ).created;
    stage = "pré-validação de bucket e objetos";
    const buckets = await admin.storage.listBuckets();
    if (buckets.error) throw new Error("Não foi possível conferir buckets.");
    const bucket = buckets.data.find((b) => b.id === "equipamentos");
    if (
      bucket &&
      (!bucket.public ||
        bucket.file_size_limit !== 1_048_576 ||
        !isDeepStrictEqual(bucket.allowed_mime_types, ["image/webp"]))
    )
      throw new Error(
        "Bucket existente diverge da configuração aprovada; não alterar.",
      );
    const store = admin.storage.from("equipamentos");
    const existing = new Set<string>();
    if (bucket) {
      for (let offset = 0; ; offset += 100) {
        const result = await store.list("suporte_ti", { limit: 100, offset });
        if (result.error)
          throw new Error("Não foi possível conferir objetos existentes.");
        for (const file of result.data) existing.add(file.name);
        if (result.data.length < 100) break;
      }
      for (const file of files.filter((f) => existing.has(`${f.tag}.webp`))) {
        const downloaded = await store.download(file.objectPath);
        if (
          downloaded.error ||
          hash(new Uint8Array(await downloaded.data.arrayBuffer())) !==
            file.sha256
        )
          throw new Error(`Objeto divergente: ${file.tag}; não sobrescrever.`);
      }
    } else {
      stage = "criação do bucket";
      const created = await admin.storage.createBucket("equipamentos", {
        public: true,
        fileSizeLimit: 1_048_576,
        allowedMimeTypes: ["image/webp"],
      });
      if (created.error) throw new Error("Criação do bucket não concluída.");
    }
    (report.stages as string[]).push("bucket validado");
    stage = "verificação negativa de escrita pública";
    const probe = `suporte_ti/__verificacao-d08-${randomUUID()}.webp`;
    const denied = await anon.storage
      .from("equipamentos")
      .upload(probe, files[0].bytes, {
        contentType: "image/webp",
        upsert: false,
      });
    if (!denied.error) {
      // Somente o objeto de prova criado por esta execução; nunca um equipamento.
      const cleaned = await store.remove([probe]);
      report.probeUnexpectedlyCreated = true;
      report.probeCleanupSucceeded = !cleaned.error;
      throw new Error(
        "Escrita anônima liberada indevidamente; publicação interrompida.",
      );
    }
    const denial = denied.error as {
      status?: number;
      statusCode?: string;
      message: string;
    };
    report.anonymousWrite = {
      denied: true,
      status: denial.status,
      code: denial.statusCode,
      probeCreated: false,
    };
    if (
      String(denial.statusCode ?? denial.status) !== "403" ||
      !/row.level security|unauthorized|not authorized|permission/i.test(
        denial.message,
      )
    )
      throw new Error("Negativa não comprova proteção esperada; interromper.");
    stage = "upload dos ausentes";
    for (const file of files.filter((f) => !existing.has(`${f.tag}.webp`))) {
      const uploaded = await store.upload(file.objectPath, file.bytes, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploaded.error)
        throw new Error(
          `Upload não concluído: ${file.tag}; não substituir nem apagar.`,
        );
      (report.uploaded as string[]).push(file.tag);
    }
    stage = "população transacional";
    report.population = (await populatePractice(db, bundle)).created;
    const before = await db.equipment.findMany({
      where: {
        tenant: { slug: "suporte_ti" },
        asset_tag: { in: inventory.map(([tag]) => tag) },
      },
      orderBy: { asset_tag: "asc" },
      include: { image: true },
    });
    report.reexecution = (await populatePractice(db, bundle)).created;
    const after = await db.equipment.findMany({
      where: {
        tenant: { slug: "suporte_ti" },
        asset_tag: { in: inventory.map(([tag]) => tag) },
      },
      orderBy: { asset_tag: "asc" },
      include: { image: true },
    });
    if (!isDeepStrictEqual(before, after))
      throw new Error("Reexecução alterou registros; investigar.");
    report.unchangedIdsAndTimestamps = true;
    stage = "download público sem autenticação";
    const urls = [];
    for (const file of files) {
      const url = `${config.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/equipamentos/${file.objectPath}`;
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const metadata = await sharp(bytes).metadata();
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/webp") ||
        hash(bytes) !== file.sha256 ||
        metadata.width !== 800 ||
        metadata.height !== 600
      )
        throw new Error(`GET público diverge: ${file.tag}.`);
      urls.push({
        assetTag: file.tag,
        url,
        status: response.status,
        width: metadata.width,
        height: metadata.height,
        sha256: hash(bytes),
      });
    }
    report.publicDownloads = urls;
    stage = "listagem e metadados anônimos";
    const listed = await anon.storage
      .from("equipamentos")
      .list("suporte_ti", { limit: 100 });
    if (!listed.error && listed.data.length)
      throw new Error("Listagem anônima expôs objetos.");
    const metadataAccess = await anon
      .from("equipment_images")
      .select("id")
      .limit(1);
    if (!metadataAccess.error || ![401, 403].includes(metadataAccess.status))
      throw new Error("Metadados acessíveis diretamente.");
    report.anonymousListing = {
      exposedObjects: listed.data?.length ?? 0,
      deniedOrEmpty: true,
    };
    report.anonymousMetadata = { denied: true, status: metadataAccess.status };
    report.counts = {
      equipment: after.length,
      images: after.filter((e) => e.image).length,
      available: after.filter((e) => e.operational_status === "AVAILABLE")
        .length,
      maintenance: after.filter((e) => e.operational_status === "MAINTENANCE")
        .length,
    };
    report.status = "DADOS/IMAGENS PUBLICADOS E VERIFICADOS; CONTA ADIADA";
    return report;
  } catch {
    report.status = "INTERROMPIDO; ESTADO PARCIAL PRESERVADO";
    report.failedStage = stage;
    throw new Error(
      `D08 interrompida em: ${stage}. Conferir recibo sanitizado; não repetir sem pré-validação.`,
    );
  } finally {
    report.finishedAt = new Date().toISOString();
    await mkdir(".local", { recursive: true });
    await writeFile(
      `.local/d08-publicacao-${Date.now()}.json`,
      JSON.stringify(report, null, 2) + "\n",
    );
    await db.$disconnect();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(
      JSON.stringify(
        await publishPractice(process.env, process.argv.slice(2)),
        null,
        2,
      ),
    );
  } catch {
    console.error(
      "Publicação D08 interrompida. Conferir configuração/recibo sanitizado em .local; valores de credenciais não são exibidos.",
    );
    process.exitCode = 1;
  }
}
