import { z } from "zod";

export const loginInput = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(256, "Senha muito longa."),
});
