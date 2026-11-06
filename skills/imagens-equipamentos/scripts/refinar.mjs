import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { loadJSON, search, requireKey, ImageError } from "./pipeline.mjs";

// Refinamento autorizado em D03. Somente busca: nunca baixa todas as imagens.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const workdir = path.join(root, ".local", "imagens-equipamentos");
const queries = {
  "TI-0001": "laptop",
  "TI-0003": "laptop",
  "TI-0004": "laptop",
  "TI-0007": "lcd",
  "TI-0011": "webcam",
  "TI-0012": "camera",
};
try {
  const key = requireKey(process.env.PIXABAY_API_KEY);
  const groups = await loadJSON(path.join(workdir, "candidatos.json"));
  for (const group of groups) {
    if (!queries[group.assetTag]) continue;
    const query = queries[group.assetTag],
      category = ["laptop", "webcam", "lcd"].includes(query)
        ? "computer"
        : undefined;
    const candidates = new Map();
    for (let page = 1; page <= 3; page++) {
      const hits = await search(query, key, workdir, { page, category });
      for (const candidate of hits) candidates.set(candidate.id, candidate);
      if (hits.length < 8) break;
    }
    if (!candidates.size) {
      console.log(
        JSON.stringify({
          assetTag: group.assetTag,
          candidates: 0,
          status: "sem resultados; conjunto anterior preservado",
        }),
      );
      continue;
    }
    group.query = query;
    group.refinement = {
      maxPages: 3,
      perPage: 8,
      category: category ?? null,
      approvedByUser: "06/nov/2026",
    };
    group.candidates = [...candidates.values()];
    console.log(
      JSON.stringify({
        assetTag: group.assetTag,
        candidates: group.candidates.length,
      }),
    );
  }
  await writeFile(
    path.join(workdir, "candidatos.json"),
    JSON.stringify(groups, null, 2) + "\n",
  );
} catch (error) {
  console.error(
    error instanceof ImageError
      ? error.message
      : "Refinamento interrompido; confira configuração e cache sem exibir credenciais.",
  );
  process.exitCode = 1;
}
