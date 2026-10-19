export const dynamic = "force-dynamic";
export async function GET() {
  if (process.env.APP_MODE === "showcase") {
    return Response.json(
      { status: "ok", mode: "showcase" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const { db } = await import("@/server/db");
    await db.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
