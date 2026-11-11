import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { z } from "zod";

export const inventory = [
  ["TI-0001", "Notebook 14 polegadas", "notebook", "AVAILABLE"],
  ["TI-0002", "Notebook 15 polegadas", "notebook", "AVAILABLE"],
  ["TI-0003", "Notebook 13 polegadas", "notebook", "AVAILABLE"],
  ["TI-0004", "Notebook 15 polegadas", "notebook", "MAINTENANCE"],
  ["TI-0005", "Monitor 24 polegadas", "monitor", "AVAILABLE"],
  ["TI-0006", "Monitor 27 polegadas", "monitor", "AVAILABLE"],
  ["TI-0007", "Monitor 22 polegadas", "monitor", "MAINTENANCE"],
  ["TI-0008", "Cabo HDMI 2 m", "cabo", "AVAILABLE"],
  ["TI-0009", "Cabo USB-C 1 m", "cabo", "AVAILABLE"],
  ["TI-0010", "Cabo de rede 3 m", "cabo", "MAINTENANCE"],
  ["TI-0011", "Webcam Full HD", "camera", "AVAILABLE"],
  ["TI-0012", "Câmera compacta", "camera", "AVAILABLE"],
] as const;

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1);
const entrySchema = z.object({
  assetTag: z.string(),
  file: z.string(),
  objectPath: z.string(),
  width: z.literal(800),
  height: z.literal(600),
  sha256: digest,
  sourceSha256: digest,
  source: z.object({
    provider: z.literal("Pixabay"),
    id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    pageURL: z
      .string()
      .regex(/^https:\/\/pixabay\.com\/(photos|illustrations)\/[^?#\s]+$/),
    author: text,
    authorId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    license: z.object({
      name: z.literal("Pixabay Content License"),
      url: z.literal("https://pixabay.com/service/license-summary/"),
    }),
  }),
  review: z.object({
    reviewer: text,
    reviewedAt: z.iso.datetime(),
    reason: text,
  }),
});
const manifestSchema = z.object({
  version: z.literal(1),
  bucket: z.literal("equipamentos"),
  entries: z.array(entrySchema).length(12),
});
const proofSchema = z.object({
  files: z
    .array(
      z.object({
        assetTag: z.string(),
        type: z.enum(["photo", "illustration"]),
        bytes: z.number().int().positive().max(1_048_576),
        sha256: digest,
      }),
    )
    .length(12),
});

type ImageData = Omit<
  Prisma.EquipmentImageUncheckedCreateInput,
  | "id"
  | "tenant_id"
  | "equipment_id"
  | "created_at"
  | "updated_at"
  | "deactivated_at"
>;
const validated = Symbol("pacote D05 validado");
type Package = { [validated]: true; images: ReadonlyMap<string, ImageData> };

/** Decodifica bytes locais; não baixa, publica nem acessa banco. */
export async function validatePackage(
  directory: string,
  manifestInput: unknown,
  proofInput: unknown,
): Promise<Package> {
  const manifest = manifestSchema.parse(manifestInput);
  const proof = proofSchema.parse(proofInput);
  const tags = inventory.map(([tag]) => tag);
  for (const list of [manifest.entries, proof.files]) {
    if (
      new Set(list.map((e) => e.assetTag)).size !== 12 ||
      list.some((e) => !tags.includes(e.assetTag as (typeof tags)[number]))
    ) {
      throw new Error(
        "Pacote deve conter exatamente os 12 patrimônios da spec.",
      );
    }
  }
  for (const values of [
    manifest.entries.map((e) => e.source.id),
    manifest.entries.map((e) => e.sha256),
    manifest.entries.map((e) => e.sourceSha256),
  ]) {
    if (new Set<string | number>(values).size !== 12)
      throw new Error("Pacote contém origem ou arquivo repetido.");
  }
  const images = new Map<string, ImageData>();
  for (const entry of manifest.entries) {
    const { assetTag: tag, source, review } = entry;
    const evidence = proof.files.find((e) => e.assetTag === tag)!;
    if (
      entry.file !== `${tag}.webp` ||
      entry.objectPath !== `suporte_ti/${tag}.webp`
    ) {
      throw new Error(`${tag}: caminho não corresponde ao tenant/patrimônio.`);
    }
    const kind = tag === "TI-0007" ? "illustration" : "photo";
    if (
      evidence.type !== kind ||
      (tag === "TI-0007" && source.id !== 313011) ||
      !source.pageURL.startsWith(
        `https://pixabay.com/${kind === "photo" ? "photos" : "illustrations"}/`,
      )
    ) {
      throw new Error(
        `${tag}: tipo de imagem não corresponde à exceção aprovada.`,
      );
    }
    const bytes = await readFile(join(directory, entry.file));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const decoder = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: 800 * 600,
    });
    const metadata = await decoder.metadata();
    // metadata() sozinho não garante a decodificação integral do arquivo.
    await decoder.raw().toBuffer();
    if (
      metadata.format !== "webp" ||
      metadata.width !== 800 ||
      metadata.height !== 600 ||
      (metadata.pages ?? 1) !== 1 ||
      bytes.length !== evidence.bytes ||
      bytes.length > 1_048_576 ||
      sha256 !== entry.sha256 ||
      sha256 !== evidence.sha256
    ) {
      throw new Error(`${tag}: bytes, hash, formato ou dimensões divergentes.`);
    }
    images.set(tag, {
      storage_bucket: manifest.bucket,
      object_path: entry.objectPath,
      source_provider: source.provider,
      source_id: BigInt(source.id),
      source_author: source.author,
      source_author_id: BigInt(source.authorId),
      source_page_url: source.pageURL,
      license_name: source.license.name,
      license_url: source.license.url,
      media_kind: kind,
      mime_type: "image/webp",
      width: 800,
      height: 600,
      size_bytes: bytes.length,
      source_sha256: entry.sourceSha256,
      sha256,
      reviewed_at: new Date(review.reviewedAt),
      reviewed_by: review.reviewer,
      review_note: review.reason,
    });
  }
  return { [validated]: true, images };
}

export class PopulationConflict extends Error {
  constructor(public readonly conflicts: string[]) {
    super(`Lote D05 interrompido: ${conflicts.join("; ")}`);
  }
}

function same(a: unknown, b: unknown) {
  return a instanceof Date && b instanceof Date
    ? a.getTime() === b.getTime()
    : a === b;
}

type PopulationResult = {
  tenantId: string;
  created: {
    tenants: number;
    categories: number;
    equipment: number;
    images: number;
  };
};
export function populatePractice(
  db: PrismaClient,
  bundle: Package,
): Promise<PopulationResult>;
export function populatePractice(
  db: PrismaClient,
  bundle: Package,
  options: { dryRun: true },
): Promise<Omit<PopulationResult, "tenantId"> & { tenantId: string | null }>;
/** Conexão sempre explícita; publicação remota somente na exceção D08/ADR-007. */
export async function populatePractice(
  db: PrismaClient,
  bundle: Package,
  options: { dryRun?: true } = {},
) {
  if (bundle[validated] !== true || bundle.images.size !== 12)
    throw new Error("Pacote não validado.");
  return db.$transaction(
    async (tx) => {
      const conflicts: string[] = [];
      const tenant = await tx.tenant.findUnique({
        where: { slug: "suporte_ti" },
      });
      if (tenant && (tenant.deactivated_at || tenant.name !== "Suporte TI"))
        conflicts.push("tenant suporte_ti divergente/desativado");
      const categories = tenant
        ? await tx.equipmentCategory.findMany({
            where: { tenant_id: tenant.id },
          })
        : [];
      const categoryNames = [
        ...new Set(inventory.map(([, , category]) => category)),
      ];
      for (const name of categoryNames) {
        if (categories.find((c) => c.name === name)?.deactivated_at)
          conflicts.push(`categoria ${name} desativada`);
      }
      const equipment = tenant
        ? await tx.equipment.findMany({
            where: {
              tenant_id: tenant.id,
              asset_tag: { in: inventory.map(([tag]) => tag) },
            },
            include: {
              image: true,
              category: true,
              requests: { where: { status: "PENDING" } },
              loans: { where: { returned_at: null } },
            },
          })
        : [];
      const destinations = await tx.equipmentImage.findMany({
        where: {
          storage_bucket: "equipamentos",
          object_path: {
            in: inventory.map(([tag]) => `suporte_ti/${tag}.webp`),
          },
        },
      });
      for (const [tag, name, category, status] of inventory) {
        const existing = equipment.find((e) => e.asset_tag === tag);
        const image = bundle.images.get(tag)!;
        if (existing) {
          if (existing.deactivated_at)
            conflicts.push(`${tag}: equipamento desativado`);
          if (
            existing.name !== name ||
            existing.category.name !== category ||
            existing.pickup_location !== "Operações" ||
            existing.operational_status !== status
          )
            conflicts.push(`${tag}: cadastro divergente`);
          if (existing.requests.length)
            conflicts.push(`${tag}: pedido pendente`);
          if (existing.loans.length) conflicts.push(`${tag}: empréstimo ativo`);
          if (
            existing.image &&
            (existing.image.deactivated_at ||
              Object.entries(image).some(
                ([key, value]) =>
                  !same(
                    existing.image![key as keyof typeof existing.image],
                    value,
                  ),
              ))
          )
            conflicts.push(`${tag}: imagem divergente/desativada`);
        }
        const destination = destinations.find(
          (i) => i.object_path === image.object_path,
        );
        if (
          destination &&
          (destination.equipment_id !== existing?.id ||
            destination.tenant_id !== tenant?.id)
        )
          conflicts.push(`${tag}: destino de imagem ocupado`);
      }
      if (conflicts.length) throw new PopulationConflict(conflicts);

      if (options.dryRun)
        return {
          tenantId: tenant?.id ?? null,
          created: {
            tenants: tenant ? 0 : 1,
            categories: categoryNames.filter(
              (name) => !categories.some((c) => c.name === name),
            ).length,
            equipment: inventory.length - equipment.length,
            images: inventory.filter(
              ([tag]) => !equipment.find((e) => e.asset_tag === tag)?.image,
            ).length,
          },
        };

      const target =
        tenant ??
        (await tx.tenant.create({
          data: { slug: "suporte_ti", name: "Suporte TI" },
        }));
      const categoryIds = new Map(categories.map((c) => [c.name, c.id]));
      let createdCategories = 0,
        createdEquipment = 0,
        createdImages = 0;
      for (const name of categoryNames) {
        if (!categoryIds.has(name)) {
          const category = await tx.equipmentCategory.create({
            data: { tenant_id: target.id, name },
          });
          categoryIds.set(name, category.id);
          createdCategories++;
        }
      }
      for (const [tag, name, category, status] of inventory) {
        const item = equipment.find((e) => e.asset_tag === tag);
        const id =
          item?.id ??
          (
            await tx.equipment.create({
              data: {
                tenant_id: target.id,
                category_id: categoryIds.get(category)!,
                asset_tag: tag,
                name,
                pickup_location: "Operações",
                operational_status: status,
              },
            })
          ).id;
        if (!item) createdEquipment++;
        if (!item?.image) {
          await tx.equipmentImage.create({
            data: {
              ...bundle.images.get(tag)!,
              tenant_id: target.id,
              equipment_id: id,
            },
          });
          createdImages++;
        }
      }
      return {
        tenantId: target.id,
        created: {
          tenants: tenant ? 0 : 1,
          categories: createdCategories,
          equipment: createdEquipment,
          images: createdImages,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    },
  );
}
