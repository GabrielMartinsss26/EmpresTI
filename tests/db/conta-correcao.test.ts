import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  AccountConflict,
  correctionAccount,
  provisionCorrectionAccount,
  ProvisioningFailure,
  type IdentityStore,
} from "../../prisma/conta-correcao";
import { startTestDatabase } from "./setup";
import { createAuthFixture, ephemeralConfig } from "./auth-fixture";

let db: PrismaClient;
let container: StartedPostgreSqlContainer;
let identities: IdentityStore;
beforeAll(async () => {
  ({ db, container } = await startTestDatabase());
  identities = await createAuthFixture(db);
});
beforeEach(async () => {
  await db.$executeRawUnsafe(
    "TRUNCATE public.tenants, public.profiles, auth.users CASCADE",
  );
  await db.tenant.create({
    data: { slug: correctionAccount.tenant, name: "Suporte TI" },
  });
});
afterAll(async () => {
  await db?.$disconnect();
  await container?.stop();
});

async function snapshot() {
  return {
    identities: await db.$queryRaw`SELECT * FROM auth.users ORDER BY id`,
    tenants: await db.tenant.findMany({ orderBy: { id: "asc" } }),
    profiles: await db.profile.findMany({ orderBy: { id: "asc" } }),
    memberships: await db.membership.findMany({ orderBy: { id: "asc" } }),
    requests: await db.loanRequest.findMany({ orderBy: { id: "asc" } }),
    loans: await db.loan.findMany({ orderBy: { id: "asc" } }),
  };
}

describe("D06 · CA-D06/CA-D07 — identidade simulada e domínio PostgreSQL", () => {
  it("cria identidade/perfil/vínculo uma vez e preserva senha, IDs e timestamps, inclusive com outra senha na configuração", async () => {
    const first = await provisionCorrectionAccount(
      db,
      identities,
      ephemeralConfig(),
    );
    expect(first.created).toEqual({
      identities: 1,
      profiles: 1,
      memberships: 1,
    });
    const before = await snapshot();
    expect(before.profiles[0].full_name).toBe(correctionAccount.name);
    expect(before.memberships[0].role).toBe("COLLABORATOR");
    expect(before.memberships[0].user_id).toBe(first.userId);
    expect(before.loans).toHaveLength(0);
    expect(before.requests).toHaveLength(0);
    expect((await provisionCorrectionAccount(db, identities)).created).toEqual({
      identities: 0,
      profiles: 0,
      memberships: 0,
    });
    expect(
      (await provisionCorrectionAccount(db, identities, ephemeralConfig()))
        .created,
    ).toEqual({ identities: 0, profiles: 0, memberships: 0 });
    expect(await snapshot()).toEqual(before);
  });

  it("completa perfil e vínculo de identidade existente, sem exigir senha", async () => {
    const identity = await identities.create({
      email: correctionAccount.email,
      fullName: correctionAccount.name,
      password: ephemeralConfig().CORRECTION_ACCOUNT_PASSWORD,
    });
    const before = await db.$queryRaw`SELECT * FROM auth.users`;
    const result = await provisionCorrectionAccount(db, identities);
    expect(result.userId).toBe(identity.id);
    expect(result.created).toEqual({
      identities: 0,
      profiles: 1,
      memberships: 1,
    });
    expect(await db.$queryRaw`SELECT * FROM auth.users`).toEqual(before);
  });

  it("preserva departamento e vínculos de outros tenants, completando só o vínculo ausente", async () => {
    const identity = await identities.create({
      email: correctionAccount.email,
      fullName: correctionAccount.name,
      password: ephemeralConfig().CORRECTION_ACCOUNT_PASSWORD,
    });
    const profile = await db.profile.create({
      data: {
        id: identity.id,
        full_name: correctionAccount.name,
        department: "Existente",
      },
    });
    const other = await db.tenant.create({
      data: { slug: "outro", name: "Outro" },
    });
    const otherMembership = await db.membership.create({
      data: { tenant_id: other.id, user_id: identity.id, role: "ADMIN" },
    });
    expect((await provisionCorrectionAccount(db, identities)).created).toEqual({
      identities: 0,
      profiles: 0,
      memberships: 1,
    });
    expect(await db.profile.findUnique({ where: { id: identity.id } })).toEqual(
      profile,
    );
    expect(
      await db.membership.findUnique({ where: { id: otherMembership.id } }),
    ).toEqual(otherMembership);
  });

  it.each([
    "tenant ausente",
    "tenant inativo",
    "identidade bloqueada",
    "email não confirmado",
    "nome de identidade",
    "perfil inativo",
    "nome do perfil",
    "vínculo inativo",
    "papel ADMIN",
    "empréstimo ativo",
    "empréstimo devolvido",
  ])("interrompe por %s e não altera dados existentes", async (kind) => {
    const { userId, membershipId } = await provisionCorrectionAccount(
      db,
      identities,
      ephemeralConfig(),
    );
    const tenant = await db.tenant.findUniqueOrThrow({
      where: { slug: correctionAccount.tenant },
    });
    if (kind === "tenant ausente")
      await db.$executeRawUnsafe("TRUNCATE public.tenants CASCADE");
    if (kind === "tenant inativo")
      await db.tenant.update({
        where: { id: tenant.id },
        data: { deactivated_at: new Date() },
      });
    if (kind === "identidade bloqueada")
      await db.$executeRaw`UPDATE auth.users SET disabled = true WHERE id = ${userId}::uuid`;
    if (kind === "email não confirmado")
      await db.$executeRaw`UPDATE auth.users SET confirmed = false WHERE id = ${userId}::uuid`;
    if (kind === "nome de identidade")
      await db.$executeRaw`UPDATE auth.users SET full_name = 'Outro' WHERE id = ${userId}::uuid`;
    if (kind === "perfil inativo")
      await db.profile.update({
        where: { id: userId },
        data: { deactivated_at: new Date() },
      });
    if (kind === "nome do perfil")
      await db.profile.update({
        where: { id: userId },
        data: { full_name: "Outro" },
      });
    if (kind === "vínculo inativo")
      await db.membership.update({
        where: { id: membershipId },
        data: { deactivated_at: new Date() },
      });
    if (kind === "papel ADMIN")
      await db.membership.update({
        where: { id: membershipId },
        data: { role: "ADMIN" },
      });
    if (kind.startsWith("empréstimo")) {
      const category = await db.equipmentCategory.create({
        data: { tenant_id: tenant.id, name: "fixture" },
      });
      const equipment = await db.equipment.create({
        data: {
          tenant_id: tenant.id,
          category_id: category.id,
          asset_tag: "FIXTURE",
          name: "Fixture",
          pickup_location: "Fixture",
        },
      });
      const operatorId = randomUUID();
      await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${operatorId}::uuid)`;
      await db.profile.create({
        data: { id: operatorId, full_name: "Operador fixture" },
      });
      const operator = await db.membership.create({
        data: { tenant_id: tenant.id, user_id: operatorId, role: "OPERATIONS" },
      });
      const now = new Date();
      const request = await db.loanRequest.create({
        data: {
          tenant_id: tenant.id,
          equipment_id: equipment.id,
          requester_membership_id: membershipId,
          requested_at: now,
          status: "APPROVED",
          decided_at: now,
          decided_by_membership_id: operator.id,
        },
      });
      await db.loan.create({
        data: {
          tenant_id: tenant.id,
          equipment_id: equipment.id,
          loan_request_id: request.id,
          borrower_membership_id: membershipId,
          approved_by_membership_id: operator.id,
          checked_out_at: now,
          due_at: (
            await db.$queryRaw<
              { due: Date }[]
            >`SELECT public.loan_due_14_business_days_v1(${now}::timestamptz) AS due`
          )[0].due,
          ...(kind === "empréstimo devolvido"
            ? { returned_at: now, returned_by_membership_id: operator.id }
            : {}),
        },
      });
    }
    const before = await snapshot();
    await expect(
      provisionCorrectionAccount(db, identities, ephemeralConfig()),
    ).rejects.toBeInstanceOf(AccountConflict);
    expect(await snapshot()).toEqual(before);
  });

  it("não cria identidade se o tenant não estiver preparado", async () => {
    await db.$executeRawUnsafe("TRUNCATE public.tenants CASCADE");
    const before = await snapshot();
    await expect(
      provisionCorrectionAccount(db, identities, ephemeralConfig()),
    ).rejects.toThrow("tenant ausente/inativo");
    expect(await snapshot()).toEqual(before);
  });

  it.each([undefined, "", 123])(
    "configuração de senha ausente/inválida não cria identidade: caso %#",
    async (password) => {
      await expect(
        provisionCorrectionAccount(db, identities, {
          CORRECTION_ACCOUNT_PASSWORD: password,
        }),
      ).rejects.toThrow();
      expect(
        await identities.findByEmail(correctionAccount.email),
      ).toHaveLength(0);
      expect(await db.profile.count()).toBe(0);
    },
  );

  it("recusa identidade ambígua ou que não corresponde ao email configurado", async () => {
    const identity = await identities.create({
      email: correctionAccount.email,
      fullName: correctionAccount.name,
      password: ephemeralConfig().CORRECTION_ACCOUNT_PASSWORD,
    });
    await expect(
      provisionCorrectionAccount(db, {
        ...identities,
        findByEmail: async () => [identity, identity],
      }),
    ).rejects.toThrow("ambígua");
    await expect(
      provisionCorrectionAccount(db, {
        ...identities,
        findByEmail: async () => [{ ...identity, email: "outra@example.test" }],
      }),
    ).rejects.toThrow("não corresponde");
    expect(await db.profile.count()).toBe(0);
  });

  it("sanitiza erro de consulta do provedor sem propagar senha, payload nem causa", async () => {
    const config = ephemeralConfig();
    try {
      await provisionCorrectionAccount(
        db,
        {
          ...identities,
          findByEmail: async () => {
            throw new Error(config.CORRECTION_ACCOUNT_PASSWORD);
          },
        },
        config,
      );
      expect.fail("Deveria falhar");
    } catch (error) {
      expect(error).toBeInstanceOf(ProvisioningFailure);
      expect(String(error)).not.toContain(config.CORRECTION_ACCOUNT_PASSWORD);
      expect((error as Error).cause).toBeUndefined();
    }
    expect(await db.profile.count()).toBe(0);
  });

  it("recupera criação de identidade com resposta perdida, sem repetir a criação ou alterar a senha", async () => {
    const config = ephemeralConfig();
    const failing: IdentityStore = {
      ...identities,
      create: async (input) => {
        await identities.create(input);
        throw new Error(config.CORRECTION_ACCOUNT_PASSWORD);
      },
    };
    let failure: unknown;
    try {
      await provisionCorrectionAccount(db, failing, config);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ProvisioningFailure);
    expect((failure as ProvisioningFailure).identityState).toBe("unknown");
    expect(String(failure)).not.toContain(config.CORRECTION_ACCOUNT_PASSWORD);
    expect(await db.profile.count()).toBe(0);
    const before = await db.$queryRaw`SELECT * FROM auth.users`;
    expect((await provisionCorrectionAccount(db, identities)).created).toEqual({
      identities: 0,
      profiles: 1,
      memberships: 1,
    });
    expect(await db.$queryRaw`SELECT * FROM auth.users`).toEqual(before);
  });

  it("revalida o domínio após criar a identidade, preservando-a se surgir conflito", async () => {
    const fixture: IdentityStore = {
      ...identities,
      create: async (input) => {
        const created = await identities.create(input);
        await db.tenant.updateMany({ data: { deactivated_at: new Date() } });
        return created;
      },
    };
    await expect(
      provisionCorrectionAccount(db, fixture, ephemeralConfig()),
    ).rejects.toMatchObject({
      identityState: "created",
      conflicts: ["tenant ausente/inativo; preparar D05 antes"],
    });
    expect(await db.profile.count()).toBe(0);
    expect(await identities.findByEmail(correctionAccount.email)).toHaveLength(
      1,
    );
  });

  it("faz rollback do perfil se o vínculo falhar; informa estado parcial e permite completar depois", async () => {
    await db.$executeRawUnsafe(
      "CREATE FUNCTION public.reject_d06_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha fixture D06'; END $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER reject_d06_fixture BEFORE INSERT ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.reject_d06_fixture()",
    );
    let failure: unknown;
    try {
      await provisionCorrectionAccount(db, identities, ephemeralConfig());
    } catch (error) {
      failure = error;
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER reject_d06_fixture ON public.memberships",
      );
      await db.$executeRawUnsafe("DROP FUNCTION public.reject_d06_fixture()");
    }
    expect(failure).toBeInstanceOf(ProvisioningFailure);
    expect((failure as ProvisioningFailure).identityState).toBe("created");
    expect(String(failure)).not.toContain("falha fixture D06");
    expect(await db.profile.count()).toBe(0);
    expect(await db.membership.count()).toBe(0);
    const identityBefore = await db.$queryRaw`SELECT * FROM auth.users`;
    expect((await provisionCorrectionAccount(db, identities)).created).toEqual({
      identities: 0,
      profiles: 1,
      memberships: 1,
    });
    expect(await db.$queryRaw`SELECT * FROM auth.users`).toEqual(
      identityBefore,
    );
  });
});
