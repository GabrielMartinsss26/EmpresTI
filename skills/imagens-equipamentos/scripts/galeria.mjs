import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hash, loadJSON, transform } from "./pipeline.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const workdir = path.join(root, ".local", "imagens-equipamentos");
const groups = await loadJSON(path.join(workdir, "candidatos.json"));
const reviews = await loadJSON(path.join(workdir, "revisao.json"), []);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const names = [
  "Notebook 14 polegadas",
  "Notebook 15 polegadas",
  "Notebook 13 polegadas",
  "Notebook 15 polegadas (manutenção)",
  "Monitor 24 polegadas",
  "Monitor 27 polegadas",
  "Monitor 22 polegadas (manutenção)",
  "Cabo HDMI 2 m",
  "Cabo USB-C 1 m",
  "Cabo de rede 3 m (manutenção)",
  "Webcam Full HD",
  "Câmera compacta",
];
const decision = (tag, id) =>
  reviews
    .filter(
      (review) =>
        review.assetTag === tag &&
        review.candidateId === id &&
        review.decision !== "pending",
    )
    .at(-1);
for (const group of groups)
  for (const candidate of group.candidates) {
    for (const value of [candidate.pageURL, candidate.downloadURL]) {
      const url = new URL(value);
      if (
        url.protocol !== "https:" ||
        !["pixabay.com", "cdn.pixabay.com"].includes(url.hostname) ||
        url.username ||
        url.password
      )
        throw new Error("URL fora do provedor permitido.");
    }
  }
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EmpresTI — revisão de fotos</title>
<style>body{margin:0;background:#080c1a;color:#e6eaf6;font:15px system-ui}header,main{max-width:1280px;margin:auto;padding:24px}header{position:sticky;top:0;background:#080c1af2;z-index:2;border-bottom:1px solid #2b3450}h1{font-size:24px;margin:0 0 8px}p{color:#aab6d2}a{color:#9cbaff}nav{display:flex;flex-wrap:wrap;gap:12px}section{scroll-margin-top:210px;margin-bottom:40px}h2{font-size:20px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.card{padding:12px;border:1px solid #2b3450;border-radius:10px;background:#0b1128}.card img{width:100%;height:180px;object-fit:contain;background:#fff}.card p{margin:8px 0;font-size:13px}.card strong{color:#e6eaf6}.approved{border-color:#5fd3aa}.rejected{border-color:#f78193}footer{padding:24px}</style>
<header><h1>Revisão de fotos — candidatas</h1><p>Prévia local temporária. Fotos: <a href="https://pixabay.com/" target="_blank" rel="noreferrer">Pixabay</a>. Nenhuma publicada no catálogo. Para sugerir uma escolha, informe patrimônio + ID.</p><p>Etiquetas indicam inspeção assistida do original, não aprovação atribuída ao usuário. Novas buscas autorizadas para melhorar adequação e evitar marcas/textos. Galeria gerada em ${esc(new Date().toISOString())}.</p><nav>${groups.map((group) => `<a href="#${esc(group.assetTag)}">${esc(group.assetTag)}</a>`).join("")}</nav></header>
<main>${groups
  .map(
    (group) =>
      `<section id="${esc(group.assetTag)}"><h2>${esc(group.assetTag)} — ${esc(names[Number(group.assetTag.slice(3)) - 1])}</h2><p>Busca: ${esc(group.query)}</p><div class="grid">${group.candidates
        .map((candidate) => {
          const review = decision(group.assetTag, candidate.id);
          return `<article class="card ${review?.decision ?? ""}"><a href="${esc(candidate.pageURL)}" target="_blank" rel="noreferrer"><img loading="lazy" src="${esc(candidate.downloadURL)}" alt="Candidata ${esc(candidate.id)} para ${esc(group.assetTag)}"></a><p><strong>ID ${esc(candidate.id)}</strong> · ${esc(candidate.author)}</p><p>${review ? `${review.decision === "approved" ? "Aceita na inspeção assistida" : "Reprovada"}: ${esc(review.reason)}` : "Pendente de inspeção do original"}</p><a href="${esc(candidate.pageURL)}" target="_blank" rel="noreferrer">Ver origem e foto maior</a></article>`;
        })
        .join("")}</div></section>`,
  )
  .join(
    "",
  )}</main><footer>Fotos ilustrativas da prática, não registros dos patrimônios físicos. Apenas inscrições técnicas de fábrica são permitidas; pessoas, marcas/logos legíveis, texto acrescentado e telas com conteúdo são proibidos. Links externos de busca são temporários; o pacote final usará cópias no Storage após publicação pelo operador. <a href="/">Ver seleção atual</a>.</footer></html>`;
await mkdir(path.join(workdir, "preview"), { recursive: true });
await writeFile(path.join(workdir, "preview", "candidatas.html"), html);
const selections = await loadJSON(path.join(workdir, "selecoes.json"), []);
let accepted = 0;
const cards = [];
for (const group of groups) {
  const selected = selections.find((item) => item.assetTag === group.assetTag);
  const review =
    selected &&
    reviews
      .filter(
        (item) =>
          item.assetTag === selected.assetTag &&
          item.candidateId === selected.id &&
          item.sourceSha256 === selected.sourceSha256,
      )
      .at(-1);
  const title = `${esc(group.assetTag)} — ${esc(names[Number(group.assetTag.slice(3)) - 1])}`;
  if (review?.decision !== "approved") {
    cards.push(
      `<article class="card rejected"><h2>${title}</h2><p>Falta encontrar foto adequada. Última candidata reprovada: ${esc(review?.reason ?? "inspeção pendente")}</p></article>`,
    );
    continue;
  }
  const bytes = await readFile(
    path.join(
      workdir,
      "originais",
      `${selected.assetTag}-${selected.id}.image`,
    ),
  );
  if (hash(bytes) !== selected.sourceSha256)
    throw new Error("Original mudou após a revisão.");
  const filename = `${selected.assetTag}-${selected.id}.webp`;
  await writeFile(
    path.join(workdir, "preview", filename),
    await transform(bytes),
  );
  accepted++;
  cards.push(
    `<article class="card approved"><h2>${title}</h2><a href="${esc(filename)}"><img src="${esc(filename)}" alt="${title}"></a><p>ID ${selected.id} · ${esc(selected.author)}</p><p>${esc(review.reason)}</p><a href="${esc(selected.pageURL)}" target="_blank" rel="noreferrer">Origem no Pixabay</a></article>`,
  );
}
const selectionHTML = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EmpresTI — seleção atual</title>${html.slice(html.indexOf("<style>"), html.indexOf("</style>") + 8)}<header><h1>Seleção atual: ${accepted} de ${groups.length} fotos aceitas na inspeção</h1><p>Inspeção pelo Codex dos originais, sem atribuir aprovação ao usuário. Prévias locais 800×600, sem corte. Nada publicado no catálogo.</p><p>Permitidas apenas inscrições técnicas de fábrica. Pessoas, marcas/logos legíveis, texto acrescentado e telas com conteúdo continuam proibidos.</p><a href="candidatas.html">Ver todas as candidatas e recusas</a></header><main class="grid">${cards.join("")}</main><footer>Ilustrações para a prática; não comprovam modelo, medidas ou condição dos patrimônios reais. Estas prévias não são o pacote final: preparar/verificar exigem as 12 fotos aprovadas.</footer></html>`;
await writeFile(path.join(workdir, "preview", "index.html"), selectionHTML);
console.log(
  `Galeria local: ${accepted}/${groups.length} aceitas; pacote final ainda depende de preparar/verificar. Servir somente .local/imagens-equipamentos/preview em 127.0.0.1, sem expor a raiz do projeto.`,
);
