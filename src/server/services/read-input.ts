import { z } from "zod";

export const pageInput = z.strictObject({
  cursor: z.uuid().optional(),
  limit: z.number().int().min(1).max(48).default(12),
});
export const catalogueInput = pageInput.extend({
  search: z.string().trim().max(80).optional(),
  categoryId: z.uuid().optional(),
  onlyAvailable: z.boolean().default(false),
});

export type PageInput = z.infer<typeof pageInput>;
export type CatalogueInput = z.infer<typeof catalogueInput>;

export function page<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor: rows.length > limit ? items.at(-1)!.id : null,
  };
}
