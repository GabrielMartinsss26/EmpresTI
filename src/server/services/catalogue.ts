import "server-only";
import type { Prisma } from "@prisma/client";
import { assertReader, invalidCursor, type Reader } from "./read-access";
import { page, type CatalogueInput } from "./read-input";

export async function listCatalogue(reader: Reader, input: CatalogueInput) {
  await assertReader(reader);
  const where: Prisma.EquipmentWhereInput = {
    tenant_id: reader.tenantId,
    deactivated_at: null,
    category: { deactivated_at: null },
    category_id: input.categoryId,
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { asset_tag: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.onlyAvailable
      ? {
          operational_status: "AVAILABLE",
          loans: { none: { returned_at: null } },
          requests: { none: { status: "PENDING" } },
        }
      : {}),
  };
  const cursor = input.cursor
    ? await reader.db.equipment.findFirst({
        where: { AND: [where, { id: input.cursor }] },
        select: { id: true, asset_tag: true },
      })
    : null;
  if (input.cursor && !cursor) invalidCursor();
  const rows = await reader.db.equipment.findMany({
    where: {
      AND: [
        where,
        ...(cursor
          ? [
              {
                OR: [
                  { asset_tag: { gt: cursor.asset_tag } },
                  { asset_tag: cursor.asset_tag, id: { gt: cursor.id } },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: [{ asset_tag: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    select: {
      id: true,
      asset_tag: true,
      name: true,
      description: true,
      pickup_location: true,
      operational_status: true,
      category: { select: { id: true, name: true } },
      image: {
        where: { deactivated_at: null },
        select: {
          storage_bucket: true,
          object_path: true,
          source_author: true,
          source_page_url: true,
          width: true,
          height: true,
        },
      },
      loans: { where: { returned_at: null }, select: { id: true }, take: 1 },
      requests: { where: { status: "PENDING" }, select: { id: true }, take: 1 },
    },
  });
  return page(
    rows.map(({ loans, requests, image, ...equipment }) => {
      const availability =
        equipment.operational_status !== "AVAILABLE"
          ? equipment.operational_status
          : loans.length
            ? ("LOANED" as const)
            : requests.length
              ? ("PENDING" as const)
              : ("AVAILABLE" as const);
      return { ...equipment, availability, image };
    }),
    input.limit,
  );
}

export async function listCategories(reader: Reader) {
  await assertReader(reader);
  return reader.db.equipmentCategory.findMany({
    where: { tenant_id: reader.tenantId, deactivated_at: null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}
