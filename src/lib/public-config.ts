export function publicConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("URL pública inválida.");
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Chave pública ausente.");
  return {
    url: url.origin,
    key,
    imageBase: `${url.origin}/storage/v1/object/public/equipamentos/`,
  };
}

export function equipmentImageUrl(base: string, bucket: string, path: string) {
  const segments = path.split("/");
  if (
    bucket !== "equipamentos" ||
    segments.some(
      (part) => !part || part === "." || part === ".." || part.includes("\\"),
    )
  )
    return null;
  return base + segments.map(encodeURIComponent).join("/");
}
