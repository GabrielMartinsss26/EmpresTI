import { test as base } from "@playwright/test";
import { createServer } from "node:http";
import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, mkdir, open } from "node:fs/promises";
import sharp from "sharp";
import { startTestDatabase } from "../db/setup";
import { inventory } from "../../prisma/dados-pratica";
import { calculateLoanDueAt } from "../../src/server/services/loan-due-date";

async function sandbox() {
  const local = await startTestDatabase();
  const db = local.db;
  const users = new Map<string, object>();
  const images = new Map<string, Buffer>();
  const manifest = JSON.parse(
    await readFile("docs/verificacoes/imagens/d03-manifesto.json", "utf8"),
  );
  const tenant = await db.tenant.create({
    data: { slug: "suporte_ti", name: "Suporte TI" },
  });
  for (const [tag, name, categoryName, status] of inventory) {
    const category = await db.equipmentCategory.upsert({
      where: { tenant_id_name: { tenant_id: tenant.id, name: categoryName } },
      create: { tenant_id: tenant.id, name: categoryName },
      update: {},
    });
    const item = await db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        name,
        asset_tag: tag,
        operational_status: status,
        pickup_location: "Operações",
      },
    });
    const source = manifest.entries.find(
      (entry: { assetTag: string }) => entry.assetTag === tag,
    ).source;
    const bytes = await readFile(
      `.local/imagens-equipamentos/preparadas/${tag}.webp`,
    ).catch(() =>
      sharp({
        create: { width: 800, height: 600, channels: 3, background: "#0b1128" },
      })
        .webp()
        .toBuffer(),
    );
    images.set(tag, bytes);
    await db.equipmentImage.create({
      data: {
        tenant_id: tenant.id,
        equipment_id: item.id,
        storage_bucket: "equipamentos",
        object_path: `suporte_ti/${tag}.webp`,
        source_provider: "Pixabay",
        source_id: BigInt(source.id),
        source_author_id: BigInt(source.authorId),
        source_author: source.author,
        source_page_url: source.pageURL,
        license_name: "Pixabay Content License",
        license_url: "https://pixabay.com/service/license-summary/",
        media_kind: tag === "TI-0007" ? "illustration" : "photo",
        mime_type: "image/webp",
        width: 800,
        height: 600,
        size_bytes: bytes.length,
        source_sha256: "a".repeat(64),
        sha256: createHash("sha256").update(bytes).digest("hex"),
        reviewed_at: new Date(),
        reviewed_by: "Fixture E07",
        review_note: "Metadados de teste; não é publicação/aprovação de foto.",
      },
    });
  }
  async function member(
    role: "ADMIN" | "OPERATIONS" | "COLLABORATOR" = "COLLABORATOR",
  ) {
    const id = randomUUID();
    await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
    await db.profile.create({
      data: { id, full_name: "Colaborador de teste" },
    });
    users.set(id, {
      id,
      aud: "authenticated",
      role: "authenticated",
      email: "fixture@example.test",
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: "2026-01-01T00:00:00Z",
    });
    return db.membership.create({
      data: { tenant_id: tenant.id, user_id: id, role },
    });
  }
  const operator = await member("ADMIN");
  const auth = createServer(async (req, res) => {
    if (
      req.url?.startsWith("/storage/v1/object/public/equipamentos/suporte_ti/")
    ) {
      const tag = req.url.split("/").at(-1)?.replace(".webp", "");
      const bytes = images.get(tag ?? "");
      res.writeHead(bytes ? 200 : 404, { "Content-Type": "image/webp" });
      res.end(bytes);
      return;
    }
    if (req.url?.startsWith("/auth/v1/logout")) {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
      const { sub } = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
      const user = users.get(sub);
      res.writeHead(user ? 200 : 401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user ?? { message: "Fixture sem sessão" }));
    } catch {
      res.writeHead(401);
      res.end("{}");
    }
  });
  auth.listen(0, "127.0.0.1");
  await once(auth, "listening");
  const authPort = (auth.address() as { port: number }).port;
  const authUrl = `http://127.0.0.1:${authPort}`;
  const portProbe = createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const port = (portProbe.address() as { port: number }).port;
  await new Promise<void>((resolve) => portProbe.close(() => resolve()));
  await mkdir("test-results", { recursive: true });
  const log = await open("test-results/e07-next.log", "w");
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        APP_MODE: "live",
        DATABASE_URL: local.url,
        DIRECT_URL: local.url,
        NEXT_PUBLIC_SUPABASE_URL: authUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture_e07",
        NODE_ENV: "production",
      },
      stdio: ["ignore", log.fd, log.fd],
      windowsHide: true,
    },
  );
  const url = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null)
        throw new Error(
          "Next da fixture encerrou; consultar test-results/e07-next.log.",
        );
      try {
        ready = (await fetch(`${url}/health`)).ok;
      } catch {
        /* processo ainda iniciando */
      }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error("Next da fixture não iniciou.");
  } catch (error) {
    child.kill();
    auth.close();
    await log.close();
    await db.$disconnect();
    await local.container.stop();
    throw error;
  }
  return {
    db,
    url,
    authUrl,
    tenant,
    operator,
    member,
    cookie(id: string) {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const encode = (value: object) =>
        Buffer.from(JSON.stringify(value)).toString("base64url");
      const access_token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, aud: "authenticated", role: "authenticated", exp })}.fixture`;
      return {
        name: "sb-127-auth-token",
        value: `base64-${encode({ access_token, refresh_token: "fixture-refresh", expires_at: exp, expires_in: 3600, token_type: "bearer", user: users.get(id) })}`,
        url,
        httpOnly: true,
      };
    },
    async reset() {
      const now = new Date("2100-01-01T13:00:00Z");
      await db.loan.updateMany({
        where: { tenant_id: tenant.id, returned_at: null },
        data: { returned_at: now, returned_by_membership_id: operator.id },
      });
      await db.loanRequest.updateMany({
        where: { tenant_id: tenant.id, status: "PENDING" },
        data: {
          status: "REJECTED",
          rejection_reason: "Encerramento da fixture",
          decided_at: now,
          decided_by_membership_id: operator.id,
        },
      });
      await db.equipment.updateMany({
        where: {
          tenant_id: tenant.id,
          asset_tag: { notIn: inventory.map(([tag]) => tag) },
        },
        data: { deactivated_at: now },
      });
    },
    async loan(userId: string, tag: string, start = "2026-11-09T13:00:00Z") {
      const item = await db.equipment.findUniqueOrThrow({
        where: {
          tenant_id_asset_tag: { tenant_id: tenant.id, asset_tag: tag },
        },
      });
      const request = await db.loanRequest.create({
        data: {
          tenant_id: tenant.id,
          equipment_id: item.id,
          requester_membership_id: userId,
          status: "APPROVED",
          requested_at: new Date(start),
          decided_at: new Date(start),
          decided_by_membership_id: operator.id,
        },
      });
      return db.loan.create({
        data: {
          tenant_id: tenant.id,
          loan_request_id: request.id,
          equipment_id: item.id,
          borrower_membership_id: userId,
          approved_by_membership_id: operator.id,
          checked_out_at: new Date(start),
          due_at: calculateLoanDueAt(new Date(start)),
        },
      });
    },
    async stop() {
      if (child.exitCode === null) {
        const exited = once(child, "exit");
        child.kill();
        await exited;
      }
      auth.closeAllConnections();
      await new Promise<void>((resolve) => auth.close(() => resolve()));
      await log.close();
      await db.$disconnect();
      await local.container.stop();
    },
  };
}
export type Sandbox = Awaited<ReturnType<typeof sandbox>>;
export const test = base.extend<
  { user: Awaited<ReturnType<Sandbox["member"]>> },
  { sandbox: Sandbox }
>({
  sandbox: [
    async ({}, provide) => {
      const local = await sandbox();
      try {
        await provide(local);
      } finally {
        await local.stop();
      }
    },
    { scope: "worker", timeout: 120000 },
  ],
  user: [
    async ({ sandbox, context }, provide) => {
      await sandbox.reset();
      const user = await sandbox.member();
      await context.addCookies([sandbox.cookie(user.user_id)]);
      await provide(user);
    },
    { auto: true },
  ],
  baseURL: async ({ sandbox }, provide) => provide(sandbox.url),
});
export { expect } from "@playwright/test";
