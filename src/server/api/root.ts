import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { catalogueRouter } from "./routers/catalogue";
import { loansRouter } from "./routers/loans";
import { requestsRouter } from "./routers/requests";
export const appRouter = router({
  auth: authRouter,
  catalogue: catalogueRouter,
  loans: loansRouter,
  requests: requestsRouter,
});
export type AppRouter = typeof appRouter;
