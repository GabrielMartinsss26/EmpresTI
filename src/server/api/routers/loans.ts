import { z } from "zod";
import { router, tenantProcedure } from "../trpc";
import { loanSummary, listOwnLoans } from "../../services/loans";
import { pageInput } from "../../services/read-input";

export const loansRouter = router({
  summary: tenantProcedure.input(z.void()).query(({ ctx }) =>
    loanSummary({
      db: ctx.db,
      userId: ctx.user.id,
      membershipId: ctx.membership.id,
      tenantId: ctx.tenantId,
    }),
  ),
  mine: tenantProcedure.input(pageInput).query(({ ctx, input }) =>
    listOwnLoans(
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
