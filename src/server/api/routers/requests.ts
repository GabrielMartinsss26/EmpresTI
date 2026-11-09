import { router, tenantProcedure } from "../trpc";
import { z } from "zod";
import { listOwnRequests, createRequest } from "../../services/requests";
import { pageInput } from "../../services/read-input";

export const requestsRouter = router({
  create: tenantProcedure
    .input(z.strictObject({ equipmentId: z.uuid() }))
    .mutation(({ ctx, input }) =>
      createRequest(
        {
          db: ctx.db,
          userId: ctx.user.id,
          membershipId: ctx.membership.id,
          tenantId: ctx.tenantId,
        },
        input.equipmentId,
      ),
    ),
  mine: tenantProcedure.input(pageInput).query(({ ctx, input }) =>
    listOwnRequests(
      {
        db: ctx.db,
        userId: ctx.user.id,
        membershipId: ctx.membership.id,
        tenantId: ctx.tenantId,
      },
      input,
    ),
  ),
});
