import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { loadJSON, search, requireKey, ImageError } from "./pipeline.mjs";

// Refinamento autorizado em D03. Somente busca: nunca baixa todas as imagens.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const workdir = path.join(root, ".local", "imagens-equipamentos");
const queries = {
  "TI-0003": ["laptop"],
  "TI-0004": ["laptop"],
  "TI-0007": ["monitor"],
  "TI-0012": ["camera"],
};
try {
  const key = requireKey(process.env.PIXABAY_API_KEY);
  const groups = await loadJSON(path.join(workdir, "candidatos.json"));
  for (const group of groups) {
    if (!queries[group.assetTag]) continue;
    const candidates = new Map(group.candidates.map((item) => [item.id, item]));
    for (const query of queries[group.assetTag]) {
      for (let page = 1; page <= 10; page++) {
        const hits = await search(query, key, workdir, {
          page,
          order: "popular",
        });
        for (const candidate of hits) candidates.set(candidate.id, candidate);
        if (hits.length < 8) break;
      }
    }
    group.refinement = {
      queries: queries[group.assetTag],
      maxPages: 10,
      perPage: 8,
      order: "popular",
      approvedByUser: "06/nov/2026",
      reason:
        "Notebook como foco em TI-0003/TI-0004; ampliar busca de TI-0007/TI-0012",
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
