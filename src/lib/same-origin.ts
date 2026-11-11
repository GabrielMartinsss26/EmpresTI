export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return (
      source.origin === origin &&
      source.host === host &&
      source.protocol === target.protocol
    );
  } catch {
    return false;
  }
}
