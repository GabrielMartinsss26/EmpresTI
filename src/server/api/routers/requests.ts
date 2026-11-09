import { router, tenantProcedure } from "../trpc";
import { listOwnRequests } from "../../services/requests";
import { pageInput } from "../../services/read-input";

export const requestsRouter = router({
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
