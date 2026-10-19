export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.APP_MODE !== "showcase"
  ) {
    const { getEnv } = await import("./server/env");
    getEnv();
  }
}
