import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";

export class ImageError extends Error {}
const fail = (message) => {
  throw new ImageError(message);
};
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const tagSchema = z.string().regex(/^TI-\d{4}$/);
const shaSchema = z.string().regex(/^[a-f0-9]{64}$/);
const idSchema = z.number().int().positive();
const TTL = 24 * 60 * 60 * 1000;
const MAX_DOWNLOAD = 12 * 1024 * 1024;
const LICENSE = {
  name: "Pixabay Content License",
  url: "https://pixabay.com/service/license-summary/",
};

function pixabayURL(value, image = false) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("Origem de imagem inválida.");
  }
  const allowed = image ? ["pixabay.com", "cdn.pixabay.com"] : ["pixabay.com"];
  if (
    url.protocol !== "https:" ||
    !allowed.includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.searchParams.has("key")
  )
    fail("Origem fora do Pixabay.");
  if (
    image &&
    !url.pathname.startsWith("/photo/") &&
    !url.pathname.startsWith("/get/")
  )
    fail("Endereço de download fora das rotas de imagem.");
  return url.href;
}

const candidateSchema = z.object({
  id: idSchema,
  author: z.string().min(1),
  authorId: idSchema,
  pageURL: z.string().transform((url) => pixabayURL(url)),
  downloadURL: z.string().transform((url) => pixabayURL(url, true)),
});
const selectionSchema = candidateSchema.extend({
  assetTag: tagSchema,
  sourceSha256: shaSchema,
});
const reviewSchema = z.object({
  assetTag: tagSchema,
  candidateId: idSchema,
  sourceSha256: shaSchema,
  decision: z.enum(["approved", "rejected", "pending"]),
  reviewer: z.string(),
  reviewedAt: z.string().nullable(),
  reason: z.string(),
});

export async function loadJSON(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
}
async function saveJSON(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}
export function requireKey(value) {
  const result = z.string().trim().min(1).safeParse(value);
  if (!result.success)
    fail("Configure PIXABAY_API_KEY no ambiente local para buscar ou baixar.");
  return result.data;
}

export async function search(
  query,
  key,
  workdir,
  { fetcher = fetch, now = Date.now() } = {},
) {
  key = requireKey(key);
  const term = z.string().trim().min(1).max(100).parse(query);
  const cacheFile = path.join(workdir, "cache", hash(term) + ".json");
  const cached = await loadJSON(cacheFile, null);
  if (
    cached &&
    cached.query === term &&
    now - cached.fetchedAt >= 0 &&
    now - cached.fetchedAt < TTL
  ) {
    return z.array(candidateSchema).max(8).parse(cached.candidates);
  }
  const url = new URL("https://pixabay.com/api/");
  for (const [name, value] of Object.entries({
    key,
    q: term,
    image_type: "photo",
    safesearch: "true",
    min_width: "800",
    min_height: "600",
    per_page: "8",
  }))
    url.searchParams.set(name, value);
  let response, body;
  try {
    response = await fetcher(url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      fail(
        `Busca Pixabay recusada (HTTP ${response.status}); sem repetição automática.`,
      );
    body = await response.json();
  } catch (error) {
    if (error instanceof ImageError) throw error;
    fail("Busca Pixabay falhou; detalhes autenticados não são exibidos.");
  }
  const hits = z
    .array(
      z.object({
        id: idSchema,
        user: z.string().min(1),
        user_id: idSchema,
        pageURL: z.string(),
        largeImageURL: z.string(),
      }),
    )
    .max(8)
    .parse(body.hits);
  const candidates = hits.map((hit) =>
    candidateSchema.parse({
      id: hit.id,
      author: hit.user,
      authorId: hit.user_id,
      pageURL: hit.pageURL,
      downloadURL: hit.largeImageURL,
    }),
  );
  await saveJSON(cacheFile, { query: term, fetchedAt: now, candidates });
  return candidates;
}

export async function searchInventory(inventory, key, workdir, options = {}) {
  requireKey(key);
  const groups = [];
  for (const item of inventory) {
    tagSchema.parse(item.assetTag);
    groups.push({
      ...item,
      candidates: await search(item.query, key, workdir, options),
    });
  }
  await saveJSON(path.join(workdir, "candidatos.json"), groups);
  return groups;
}

export async function download(candidate, { fetcher = fetch } = {}) {
  let url = pixabayURL(candidate.downloadURL, true);
  for (let redirects = 0; redirects <= 3; redirects++) {
    let response;
    try {
      response = await fetcher(url, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      fail("Download Pixabay falhou; nenhum detalhe autenticado foi exibido.");
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const target = response.headers.get("location");
      if (!target || redirects === 3)
        fail("Redirecionamento de imagem inválido.");
      url = pixabayURL(new URL(target, url).href, true);
      continue;
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      fail("Resposta de imagem inválida.");
    if (Number(response.headers.get("content-length")) > MAX_DOWNLOAD)
      fail("Download excede 12 MiB.");
    const chunks = [];
    let total = 0;
    if (!response.body) fail("Imagem sem conteúdo.");
    try {
      for await (const chunk of response.body) {
        total += chunk.length;
        if (total > MAX_DOWNLOAD) fail("Download excede 12 MiB.");
        chunks.push(chunk);
      }
    } catch (error) {
      if (error instanceof ImageError) throw error;
      fail("Download de imagem incompleto.");
    }
    return Buffer.concat(chunks);
  }
  fail("Redirecionamentos excedidos.");
}

export async function selectCandidate(
  assetTag,
  candidateId,
  workdir,
  options = {},
) {
  tagSchema.parse(assetTag);
  idSchema.parse(candidateId);
  const groups = await loadJSON(path.join(workdir, "candidatos.json"));
  const raw = groups
    .find((group) => group.assetTag === assetTag)
    ?.candidates.find((item) => item.id === candidateId);
  if (!raw) fail("Candidata não consta da busca desse patrimônio.");
  const candidate = candidateSchema.parse(raw);
  const previous = z
    .array(selectionSchema)
    .parse(await loadJSON(path.join(workdir, "selecoes.json"), []));
  if (
    previous.some(
      (item) => item.assetTag !== assetTag && item.id === candidateId,
    )
  )
    fail("Foto já selecionada para outro equipamento.");
  const file = path.join(
    workdir,
    "originais",
    `${assetTag}-${candidateId}.image`,
  );
  let bytes;
  try {
    bytes = await readFile(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    bytes = await download(candidate, options);
  }
  const selected = { ...candidate, assetTag, sourceSha256: hash(bytes) };
  if (
    previous.some(
      (item) =>
        item.assetTag !== assetTag &&
        item.sourceSha256 === selected.sourceSha256,
    )
  )
    fail("Bytes de foto repetidos em outro equipamento.");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  await saveJSON(
    path.join(workdir, "selecoes.json"),
    [...previous.filter((item) => item.assetTag !== assetTag), selected].sort(
      (a, b) => a.assetTag.localeCompare(b.assetTag),
    ),
  );
  const reviews = z
    .array(reviewSchema)
    .parse(await loadJSON(path.join(workdir, "revisao.json"), []));
  if (
    !reviews.some(
      (item) =>
        item.assetTag === assetTag &&
        item.candidateId === candidateId &&
        item.sourceSha256 === selected.sourceSha256,
    )
  ) {
    reviews.push({
      assetTag,
      candidateId,
      sourceSha256: selected.sourceSha256,
      decision: "pending",
      reviewer: "",
      reviewedAt: null,
      reason: "",
    });
    await saveJSON(path.join(workdir, "revisao.json"), reviews);
  }
  return { file, sourceSha256: selected.sourceSha256 };
}

export async function transform(bytes) {
  try {
    const input = sharp(bytes, {
      limitInputPixels: 40_000_000,
      animated: false,
    });
    const metadata = await input.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages ?? 1) > 1
    )
      fail("Somente foto estática JPEG, PNG ou WebP é aceita.");
    const output = await input
      .rotate()
      .resize(800, 600, { fit: "contain", background: "#0B1128" })
      .webp({ quality: 85 })
      .toBuffer();
    const checked = await sharp(output).metadata();
    if (
      checked.width !== 800 ||
      checked.height !== 600 ||
      checked.format !== "webp" ||
      output.length > 1024 * 1024
    )
      fail("Saída fora do contrato 800×600/WebP/1 MiB.");
    return output;
  } catch (error) {
    if (error instanceof ImageError) throw error;
    fail("Arquivo de imagem inválido ou fora dos limites de processamento.");
  }
}

export async function compilePackage(inventory, workdir) {
  const selections = z
    .array(selectionSchema)
    .parse(await loadJSON(path.join(workdir, "selecoes.json"), []));
  const reviews = z
    .array(reviewSchema)
    .parse(await loadJSON(path.join(workdir, "revisao.json"), []));
  if (
    new Set(inventory.map((item) => item.assetTag)).size !== inventory.length ||
    selections.length !== inventory.length ||
    new Set(selections.map((item) => item.assetTag)).size !== inventory.length
  )
    fail("Seleções incompletas ou patrimônios repetidos.");
  const ids = new Set(),
    sources = new Set(),
    outputs = new Set(),
    files = [],
    entries = [];
  for (const item of inventory) {
    tagSchema.parse(item.assetTag);
    const selected = selections.find(
      (selection) => selection.assetTag === item.assetTag,
    );
    if (!selected) fail("Patrimônio sem seleção.");
    const matching = reviews.filter(
      (review) =>
        review.assetTag === item.assetTag &&
        review.candidateId === selected.id &&
        review.sourceSha256 === selected.sourceSha256,
    );
    const review = matching.at(-1);
    if (
      !review ||
      review.decision !== "approved" ||
      !review.reviewer.trim() ||
      !review.reason.trim() ||
      !review.reviewedAt ||
      !z.iso.datetime({ offset: true }).safeParse(review.reviewedAt).success
    )
      fail(
        "Revisão visual aprovada e identificada é obrigatória para cada foto.",
      );
    const original = await readFile(
      path.join(workdir, "originais", `${item.assetTag}-${selected.id}.image`),
    );
    if (hash(original) !== selected.sourceSha256)
      fail("Original mudou após a revisão; nova inspeção é necessária.");
    const output = await transform(original),
      sha256 = hash(output);
    if (
      ids.has(selected.id) ||
      sources.has(selected.sourceSha256) ||
      outputs.has(sha256)
    )
      fail("Foto repetida por ID ou conteúdo.");
    ids.add(selected.id);
    sources.add(selected.sourceSha256);
    outputs.add(sha256);
    files.push({ name: `${item.assetTag}.webp`, bytes: output });
    entries.push({
      assetTag: item.assetTag,
      file: `${item.assetTag}.webp`,
      objectPath: `suporte_ti/${item.assetTag}.webp`,
      width: 800,
      height: 600,
      sha256,
      sourceSha256: selected.sourceSha256,
      source: {
        provider: "Pixabay",
        id: selected.id,
        pageURL: selected.pageURL,
        author: selected.author,
        authorId: selected.authorId,
        license: LICENSE,
      },
      review: {
        reviewer: review.reviewer,
        reviewedAt: review.reviewedAt,
        reason: review.reason,
      },
    });
  }
  return { files, manifest: { version: 1, bucket: "equipamentos", entries } };
}

export async function prepare(inventory, workdir) {
  const result = await compilePackage(inventory, workdir);
  const destination = path.join(workdir, "preparadas");
  await mkdir(destination, { recursive: true });
  for (const file of result.files)
    await writeFile(path.join(destination, file.name), file.bytes);
  await saveJSON(path.join(workdir, "manifesto.json"), result.manifest);
  return result.manifest;
}

export async function verify(inventory, workdir) {
  const expected = await compilePackage(inventory, workdir);
  const actual = await loadJSON(path.join(workdir, "manifesto.json"));
  if (JSON.stringify(actual) !== JSON.stringify(expected.manifest))
    fail("Manifesto diverge das seleções/revisões atuais.");
  for (const file of expected.files) {
    if (
      hash(await readFile(path.join(workdir, "preparadas", file.name))) !==
      hash(file.bytes)
    )
      fail("Arquivo preparado diverge do manifesto.");
  }
  return expected.manifest;
}
