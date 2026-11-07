import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { populatePractice, validatePackage } from "../../prisma/dados-pratica";
import { startTestDatabase } from "./setup";

// Este comando não aceita destino: sempre cria e encerra seu próprio container.
if (process.argv.length !== 2)
  throw new Error("D05 local não aceita argumentos de conexão.");
const manifestBytes = await readFile(
  "docs/verificacoes/imagens/d03-manifesto.json",
);
const proofBytes = await readFile("docs/verificacoes/imagens/d03-final.json");
const manifest: unknown = JSON.parse(manifestBytes.toString());
assert.ok(
  isDeepStrictEqual(
    manifest,
    JSON.parse(
      await readFile(".local/imagens-equipamentos/manifesto.json", "utf8"),
    ),
  ),
  "Manifesto local difere do pacote D03 versionado.",
);
const bundle = await validatePackage(
  ".local/imagens-equipamentos/preparadas",
  manifest,
  JSON.parse(proofBytes.toString()),
);
const { db, container } = await startTestDatabase();
try {
  const first = await populatePractice(db, bundle);
  const before = await db.equipment.findMany({
    orderBy: { asset_tag: "asc" },
    include: { image: true, category: true },
  });
  const second = await populatePractice(db, bundle);
  const after = await db.equipment.findMany({
    orderBy: { asset_tag: "asc" },
    include: { image: true, category: true },
  });
  assert.deepEqual(after, before);
  assert.deepEqual(first.created, {
    tenants: 1,
    categories: 4,
    equipment: 12,
    images: 12,
  });
  assert.deepEqual(second.created, {
    tenants: 0,
    categories: 0,
    equipment: 0,
    images: 0,
  });
  const counts = {
    equipment: after.length,
    categories: await db.equipmentCategory.count(),
    available: after.filter((e) => e.operational_status === "AVAILABLE").length,
    maintenance: after.filter((e) => e.operational_status === "MAINTENANCE")
      .length,
    images: await db.equipmentImage.count(),
    requests: await db.loanRequest.count(),
    loans: await db.loan.count(),
    profiles: await db.profile.count(),
    memberships: await db.membership.count(),
  };
  assert.deepEqual(counts, {
    equipment: 12,
    categories: 4,
    available: 9,
    maintenance: 3,
    images: 12,
    requests: 0,
    loans: 0,
    profiles: 0,
    memberships: 0,
  });
  const report = {
    task: "D05",
    recordedAt: new Date().toISOString(),
    database:
      "PostgreSQL 16 em container descartável; fixtures de Auth/Storage",
    manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
    d03ProofSha256: createHash("sha256").update(proofBytes).digest("hex"),
    first: first.created,
    second: second.created,
    counts,
    unchangedIdsAndTimestamps: true,
    productionWrites: false,
    uploads: false,
    fullSpecReady: false,
  };
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/d05-local.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db.$disconnect();
  await container.stop();
}
