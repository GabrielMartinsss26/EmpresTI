import type { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import type { Identity, IdentityStore } from "../../prisma/conta-correcao";

/** Fixture somente: não corresponde ao schema completo nem ao servidor Supabase Auth. */
export async function createAuthFixture(
  db: PrismaClient,
): Promise<IdentityStore> {
  await db.$executeRawUnsafe(`ALTER TABLE auth.users
    ADD COLUMN email text UNIQUE, ADD COLUMN full_name text,
    ADD COLUMN disabled boolean NOT NULL DEFAULT false,
    ADD COLUMN confirmed boolean NOT NULL DEFAULT true,
    ADD COLUMN password_hash text`);
  return {
    async findByEmail(email) {
      return db.$queryRaw<
        Identity[]
      >`SELECT id, email, full_name AS "fullName", disabled, confirmed FROM auth.users WHERE lower(email) = lower(${email})`;
    },
    async create({ email, fullName, password }) {
      const id = randomUUID();
      const salt = randomBytes(16).toString("hex");
      const hash = `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
      await db.$executeRaw`INSERT INTO auth.users (id, email, full_name, password_hash) VALUES (${id}::uuid, ${email}, ${fullName}, ${hash})`;
      return { id, email, fullName, disabled: false, confirmed: true };
    },
  };
}

export const ephemeralConfig = () => ({
  CORRECTION_ACCOUNT_PASSWORD: randomBytes(24).toString("base64url"),
});
