import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

export function assertLocalDatabase(url: string) {
  const parsed = new URL(url);
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
  ) {
    throw new Error("Testes de banco exigem o PostgreSQL descartável local.");
  }
}

export function runPrisma(args: string[], url: string) {
  assertLocalDatabase(url);
  return execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: "pipe",
      timeout: 60_000,
    },
  ).toString();
}

export async function externalServiceFixtures(
  db: PrismaClient,
  storage: "enabled" | "disabled" | "missing" = "enabled",
) {
  // Somente infraestrutura simulada no container; não é servidor Auth/Storage.
  await db.$executeRawUnsafe("CREATE SCHEMA auth");
  await db.$executeRawUnsafe("CREATE TABLE auth.users (id uuid PRIMARY KEY)");
  if (storage === "missing") return;
  await db.$executeRawUnsafe("CREATE SCHEMA storage");
  await db.$executeRawUnsafe(
    "CREATE TABLE storage.objects (id uuid PRIMARY KEY, bucket_id text NOT NULL, name text NOT NULL)",
  );
  if (storage === "enabled") {
    await db.$executeRawUnsafe(
      "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY",
    );
  }
}

export async function startTestDatabase(migrate = true) {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const url = container.getConnectionUri();
  assertLocalDatabase(url);
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await db.$executeRawUnsafe("CREATE ROLE anon NOLOGIN NOBYPASSRLS");
    await db.$executeRawUnsafe("CREATE ROLE authenticated NOLOGIN NOBYPASSRLS");
    await externalServiceFixtures(db);
    if (migrate) runPrisma(["migrate", "deploy"], url);
    return { container, db, url };
  } catch (error) {
    await db.$disconnect();
    await container.stop();
    throw error;
  }
}
