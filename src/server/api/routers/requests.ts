import { router, tenantProcedure, operationsProcedure } from "../trpc";
import { z } from "zod";
import { listOwnRequests, createRequest } from "../../services/requests";
import { pageInput } from "../../services/read-input";
import {
  rejectRequest,
  rejectionReason,
} from "../../services/request-rejection";
import {
  approveRequest,
  listPendingRequests,
} from "../../services/request-approval";

export const requestsRouter = router({
  reject: operationsProcedure
    .input(z.strictObject({ requestId: z.uuid(), reason: rejectionReason }))
    .mutation(({ ctx, input }) =>
      rejectRequest(
        {
          db: ctx.db,
          userId: ctx.user.id,
          membershipId: ctx.membership.id,
          tenantId: ctx.tenantId,
        },
        input.requestId,
        input.reason,
      ),
    ),
  pending: operationsProcedure.input(pageInput).query(({ ctx, input }) =>
    listPendingRequests(
      {
        db: ctx.db,
        userId: ctx.user.id,
        membershipId: ctx.membership.id,
        tenantId: ctx.tenantId,
      },
      input,
    ),
  ),
  approve: operationsProcedure
    .input(z.strictObject({ requestId: z.uuid() }))
    .mutation(({ ctx, input }) =>
      approveRequest(
        {
          db: ctx.db,
          userId: ctx.user.id,
          membershipId: ctx.membership.id,
          tenantId: ctx.tenantId,
        },
        input.requestId,
      ),
    ),
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
