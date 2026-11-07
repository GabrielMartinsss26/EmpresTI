import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  correctionAccount,
  provisionCorrectionAccount,
} from "../../prisma/conta-correcao";
import { startTestDatabase } from "./setup";
import { createAuthFixture, ephemeralConfig } from "./auth-fixture";

if (process.argv.length !== 2)
  throw new Error("D06 local não aceita argumentos de conexão.");
const { db, container } = await startTestDatabase();
try {
  const identities = await createAuthFixture(db);
  await db.tenant.create({
    data: { slug: correctionAccount.tenant, name: "Suporte TI" },
  });
  const first = await provisionCorrectionAccount(
    db,
    identities,
    ephemeralConfig(),
  );
  const before = {
    profile: await db.profile.findMany(),
    membership: await db.membership.findMany(),
    identity: await db.$queryRaw`SELECT * FROM auth.users`,
  };
  const second = await provisionCorrectionAccount(db, identities);
  const after = {
    profile: await db.profile.findMany(),
    membership: await db.membership.findMany(),
    identity: await db.$queryRaw`SELECT * FROM auth.users`,
  };
  assert.deepEqual(after, before);
  assert.deepEqual(first.created, {
    identities: 1,
    profiles: 1,
    memberships: 1,
  });
  assert.deepEqual(second.created, {
    identities: 0,
    profiles: 0,
    memberships: 0,
  });
  assert.equal(before.membership[0].role, "COLLABORATOR");
  assert.equal(before.membership[0].deactivated_at, null);
  assert.equal(before.profile[0].deactivated_at, null);
  const loans = await db.loan.count();
  const requests = await db.loanRequest.count();
  assert.equal(loans, 0);
  assert.equal(requests, 0);
  const report = {
    task: "D06",
    recordedAt: new Date().toISOString(),
    database: "PostgreSQL 16 descartável",
    identityProvider: "fixture local; sem Supabase Auth/GoTrue HTTP",
    first: first.created,
    second: second.created,
    role: before.membership[0].role,
    loans,
    requests,
    unchangedIdsTimestampsAndPasswordHash: true,
    productionWrites: false,
    realLoginVerified: false,
    fullSpecReady: false,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/d06-local.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} catch {
  // Não serializar erro de driver nem configuração, mesmo em falha local.
  console.error(
    "D06 local falhou; conferir testes locais, sem imprimir credenciais.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
  await container.stop();
}
