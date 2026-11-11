import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";

export const correctionAccount = {
  email: "marcelo.grilo@institutojef.org.br",
  name: "Marcelo Grilo",
  tenant: "suporte_ti",
  role: "COLLABORATOR",
} as const;

const identitySchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  disabled: z.boolean(),
  confirmed: z.boolean(),
});
export type Identity = z.infer<typeof identitySchema>;
/** Sem implementação HTTP nesta etapa; o executor só injeta a fixture local. */
export interface IdentityStore {
  findByEmail(email: string): Promise<Identity[]>;
  create(input: {
    email: string;
    fullName: string;
    password: string;
  }): Promise<Identity>;
}

const configSchema = z.object({
  CORRECTION_ACCOUNT_PASSWORD: z.string().min(1).max(256).optional(),
});
type IdentityState = "not_created" | "existing" | "created" | "unknown";
export class AccountConflict extends Error {
  constructor(
    public readonly conflicts: string[],
    public readonly identityState: IdentityState = "not_created",
  ) {
    super(`Preparação D06 interrompida: ${conflicts.join("; ")}`);
  }
}
export class ProvisioningFailure extends Error {
  constructor(
    public readonly stage: string,
    public readonly identityState: IdentityState,
  ) {
    // Não anexar causa/payload do provedor ou Prisma: podem conter segredos.
    super(
      `Falha na etapa ${stage}; estado da identidade: ${identityState}. Reconsultar antes de repetir.`,
    );
  }
}

function validateIdentity(input: unknown) {
  const result = identitySchema.safeParse(input);
  if (!result.success) throw new Error("Resposta de identidade inválida.");
  const identity = result.data;
  const conflicts: string[] = [];
  if (identity.email.toLowerCase() !== correctionAccount.email)
    conflicts.push("identidade não corresponde ao e-mail esperado");
  if (
    identity.fullName !== null &&
    identity.fullName !== correctionAccount.name
  )
    conflicts.push("nome de identidade divergente");
  if (identity.disabled) conflicts.push("identidade bloqueada/inativa");
  if (!identity.confirmed) conflicts.push("e-mail não confirmado");
  if (conflicts.length) throw new AccountConflict(conflicts);
  return identity;
}

async function inspect(tx: Prisma.TransactionClient, userId?: string) {
  const tenant = await tx.tenant.findUnique({
    where: { slug: correctionAccount.tenant },
  });
  const conflicts: string[] = [];
  if (!tenant || tenant.deactivated_at)
    conflicts.push("tenant ausente/inativo; preparar D05 antes");
  const profile = userId
    ? await tx.profile.findUnique({ where: { id: userId } })
    : null;
  if (
    profile &&
    (profile.deactivated_at || profile.full_name !== correctionAccount.name)
  )
    conflicts.push("perfil divergente/desativado");
  const membership =
    userId && tenant
      ? await tx.membership.findUnique({
          where: {
            tenant_id_user_id: { tenant_id: tenant.id, user_id: userId },
          },
        })
      : null;
  if (
    membership &&
    (membership.deactivated_at || membership.role !== correctionAccount.role)
  )
    conflicts.push("vínculo divergente/desativado");
  if (
    userId &&
    (await tx.loan.count({ where: { borrower: { user_id: userId } } }))
  )
    conflicts.push("conta possui empréstimos registrados");
  if (conflicts.length) throw new AccountConflict(conflicts);
  return { tenant: tenant!, profile, membership };
}

/** Não lê .env, não cria cliente remoto e não redefine senha de identidade existente. */
export async function provisionCorrectionAccount(
  db: PrismaClient,
  identities: IdentityStore,
  configInput: unknown = {},
) {
  const config = configSchema.safeParse(configInput);
  if (!config.success)
    throw new Error("Configuração inválida: CORRECTION_ACCOUNT_PASSWORD.");
  let stage = "consulta de identidade";
  let identityState: IdentityState = "not_created";
  try {
    const found = await identities.findByEmail(correctionAccount.email);
    if (found.length > 1)
      throw new AccountConflict([
        "identidade ambígua; resolver duplicação antes",
      ]);
    identityState = found.length ? "existing" : "not_created";
    let identity = found.length ? validateIdentity(found[0]) : undefined;
    stage = "pré-validação de domínio";
    await db.$transaction((tx) => inspect(tx, identity?.id), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    if (!identity) {
      if (!config.data.CORRECTION_ACCOUNT_PASSWORD)
        throw new AccountConflict([
          "CORRECTION_ACCOUNT_PASSWORD obrigatória somente para nova identidade",
        ]);
      stage = "criação de identidade";
      identityState = "unknown";
      const created = await identities.create({
        email: correctionAccount.email,
        fullName: correctionAccount.name,
        password: config.data.CORRECTION_ACCOUNT_PASSWORD,
      });
      identityState = "created";
      identity = validateIdentity(created);
    }
    const userId = identity.id;
    stage = "perfil e vínculo";
    const domain = await db.$transaction(
      async (tx) => {
        // Revalidar: Auth e domínio não compartilham transação distribuída.
        const current = await inspect(tx, userId);
        const profile =
          current.profile ??
          (await tx.profile.create({
            data: { id: userId, full_name: correctionAccount.name },
          }));
        const membership =
          current.membership ??
          (await tx.membership.create({
            data: {
              tenant_id: current.tenant.id,
              user_id: profile.id,
              role: correctionAccount.role,
            },
          }));
        return {
          userId,
          membershipId: membership.id,
          created: {
            profiles: current.profile ? 0 : 1,
            memberships: current.membership ? 0 : 1,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30_000,
      },
    );
    return {
      ...domain,
      created: {
        identities: identityState === "created" ? 1 : 0,
        ...domain.created,
      },
    };
  } catch (error) {
    if (error instanceof AccountConflict)
      throw new AccountConflict(error.conflicts, identityState);
    throw new ProvisioningFailure(stage, identityState);
  }
}
