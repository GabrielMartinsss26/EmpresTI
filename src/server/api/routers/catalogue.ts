import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { listCatalogue, listCategories } from "../../services/catalogue";
import { catalogueInput } from "../../services/read-input";

export const catalogueRouter = router({
  list: tenantProcedure.input(catalogueInput).query(({ ctx, input }) =>
    listCatalogue(
      {
        db: ctx.db,
        userId: ctx.user.id,
        membershipId: ctx.membership.id,
        tenantId: ctx.tenantId,
      },
      input,
    ),
  ),
  categories: tenantProcedure.input(z.void()).query(({ ctx }) =>
    listCategories({
      db: ctx.db,
      userId: ctx.user.id,
      membershipId: ctx.membership.id,
      tenantId: ctx.tenantId,
    }),
  ),
});
