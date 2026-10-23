import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  await prisma.tenant.upsert({
    where: { slug: "suporte_ti" },
    create: { slug: "suporte_ti", name: "Suporte TI" },
    update: {},
  });
  console.log("Seed concluído: tenant suporte_ti.");
} finally {
  await prisma.$disconnect();
}
