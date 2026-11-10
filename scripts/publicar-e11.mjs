import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const approvedMigrations = {
  "202610190001_initial":
    "38333361e345e711c68d1c5590bf480547e58c731a0acba4f504c9d60a71f20c",
  "202611060001_equipment_images":
    "3d3b0611708ee4d2e4652c5f57a685f4f47339749421b6cf4c0a8cd2908cc73a",
  "202611090001_loan_due_rules":
    "4f72650763fa6486cd4b4d0674ace88c16c6cc311ef68dcbc24337a3e62b0a07",
};
export function publicationConnection(env) {
  const project = "gverauqgerwjwwjkoybl";
  if (
    env.VERCEL !== "1" ||
    env.VERCEL_ENV !== "production" ||
    new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${project}.supabase.co`
  )
    throw new Error("DESTINATION_OR_EXECUTOR_MISMATCH");
  const url = new URL(env.DATABASE_URL);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".pooler.supabase.com") ||
    decodeURIComponent(url.username) !== `postgres.${project}` ||
    url.pathname !== "/postgres"
  )
    throw new Error("DATABASE_DESTINATION_MISMATCH");
  url.port = "5432";
  url.searchParams.delete("pgbouncer");
  url.searchParams.set("connect_timeout", "10");
  url.searchParams.set("pool_timeout", "10");
  url.searchParams.set("connection_limit", "1");
  url.searchParams.set("sslmode", "require");
  return url.href;
}
const sha = (value) => createHash("sha256").update(value).digest("hex");
export function validateSources(files) {
  if (
    JSON.stringify(Object.keys(files).sort()) !==
    JSON.stringify(Object.keys(approvedMigrations).sort())
  )
    throw new Error("UNAPPROVED_MIGRATION_SET");
  for (const [name, bytes] of Object.entries(files))
    if (
      sha(bytes.toString().replace(/\r\n/g, "\n")) !== approvedMigrations[name]
    )
      throw new Error("MIGRATION_SOURCE_CHANGED");
}
export function validateRemote(migrations, sources) {
  if (
    migrations.length < 2 ||
    !migrations.some((m) => m.migration_name === "202610190001_initial") ||
    !migrations.some(
      (m) => m.migration_name === "202611060001_equipment_images",
    ) ||
    new Set(migrations.map((m) => m.migration_name)).size !== migrations.length
  )
    throw new Error("MIGRATION_HISTORY_MISMATCH");
  for (const m of migrations) {
    const source = sources[m.migration_name];
    if (
      !source ||
      !m.applied ||
      m.rolled_back ||
      ![
        sha(source),
        sha(source.toString().replace(/\r\n/g, "\n")),
        sha(source.toString().replace(/\r?\n/g, "\r\n")),
      ].includes(m.checksum)
    )
      throw new Error("MIGRATION_HISTORY_MISMATCH");
  }
}
async function snapshot(url, sources) {
  const db = new PrismaClient({ datasourceUrl: url, log: [] });
  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'UTC'");
        const migrations = await tx.$queryRawUnsafe(
          "SELECT migration_name, checksum, finished_at IS NOT NULL AS applied, rolled_back_at IS NOT NULL AS rolled_back FROM public._prisma_migrations ORDER BY started_at",
        );
        validateRemote(migrations, sources);
        const history = {};
        for (const name of [
          "tenants",
          "profiles",
          "memberships",
          "equipment_categories",
          "equipment",
          "equipment_images",
          "loan_requests",
          "loans",
          "audit_logs",
        ]) {
          const [row] = await tx.$queryRawUnsafe(
            `SELECT count(*)::int AS count, md5(COALESCE(string_agg((to_jsonb(t)-'due_rule')::text, E'\\n' ORDER BY id),'')) AS fingerprint FROM public.${name} t`,
          );
          history[name] = row;
        }
        const columns = await tx.$queryRawUnsafe(
          "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='loans' AND column_name='due_rule'",
        );
        return {
          migrations,
          history,
          dueRuleDefault: columns[0]?.column_default,
        };
      },
      { timeout: 30000 },
    );
  } finally {
    await db.$disconnect();
  }
}
async function main() {
  const receipt = {
    phase: "E11-migration",
    startedAt: new Date().toISOString(),
  };
  try {
    if (
      process.argv.slice(2).join(" ") !==
      "--apply --project=gverauqgerwjwwjkoybl"
    )
      throw new Error("EXPLICIT_APPLY_REQUIRED");
    const url = publicationConnection(process.env);
    const sources = Object.fromEntries(
      readdirSync("prisma/migrations", { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => [
          e.name,
          readFileSync(`prisma/migrations/${e.name}/migration.sql`),
        ]),
    );
    validateSources(sources);
    receipt.sourceSha256 = approvedMigrations;
    receipt.before = await snapshot(url, sources);
    const result = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
        encoding: "utf8",
        timeout: 120000,
        windowsHide: true,
      },
    );
    receipt.migrateExitCode = result.status;
    if (result.status !== 0) throw new Error("PRISMA_MIGRATE_FAILED");
    receipt.after = await snapshot(url, sources);
    if (
      JSON.stringify(receipt.before.history) !==
        JSON.stringify(receipt.after.history) ||
      receipt.after.migrations.length !== 3 ||
      !receipt.after.dueRuleDefault?.includes("BUSINESS_14_SP")
    )
      throw new Error("POST_MIGRATION_VERIFICATION_FAILED");
    receipt.historyPreserved = true;
    receipt.ok = true;
  } catch (error) {
    receipt.ok = false;
    receipt.error = error.code ?? error.errorCode ?? error.message;
    // Nunca emitir mensagens arbitrárias do driver/URL/ambiente.
    if (!/^[A-Z][A-Z0-9_]{2,80}$/.test(receipt.error))
      receipt.error = "PUBLICATION_FAILED";
    process.exitCode = 1;
  }
  receipt.finishedAt = new Date().toISOString();
  console.log("E11_RECEIPT " + JSON.stringify(receipt));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
