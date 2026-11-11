import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { isSameOrigin } from "@/lib/same-origin";

async function handler(req: Request) {
  if (process.env.APP_MODE === "showcase")
    return Response.json(
      { message: "O login ainda não está disponível." },
      { status: 503 },
    );
  const { appRouter } = await import("@/server/api/root");
  const { createContext } = await import("@/server/api/trpc");
  if (req.method === "POST" && !isSameOrigin(req))
    return new Response("Forbidden", { status: 403 });
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ headers: req.headers }),
    onError({ error }) {
      if (error.code === "INTERNAL_SERVER_ERROR")
        console.error(
          JSON.stringify({
            event: "request.error",
            request_id: crypto.randomUUID(),
            code: error.code,
          }),
        );
    },
    responseMeta() {
      return { headers: { "Cache-Control": "private, no-store" } };
    },
  });
}
export { handler as GET, handler as POST };
