import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ImageError,
  loadJSON,
  requireKey,
  searchInventory,
  selectCandidate,
  prepare,
  verify,
} from "./pipeline.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const workdir = path.join(root, ".local", "imagens-equipamentos");
const inventory = await loadJSON(
  new URL("../assets/inventario.json", import.meta.url),
);
const [command, assetTag, id, ...extra] = process.argv.slice(2);
try {
  if (extra.length) throw new ImageError("Argumentos excedentes.");
  if (command === "buscar" && !assetTag && !id) {
    const result = await searchInventory(
      inventory,
      requireKey(process.env.PIXABAY_API_KEY),
      workdir,
    );
    console.log(
      JSON.stringify({
        patrimonios: result.length,
        candidatas: result.reduce(
          (sum, item) => sum + item.candidates.length,
          0,
        ),
        arquivo: ".local/imagens-equipamentos/candidatos.json",
        revisao: "pendente",
      }),
    );
  } else if (
    command === "baixar" &&
    inventory.some((item) => item.assetTag === assetTag) &&
    /^\d+$/.test(id ?? "")
  ) {
    requireKey(process.env.PIXABAY_API_KEY);
    const result = await selectCandidate(assetTag, Number(id), workdir);
    console.log(
      JSON.stringify({
        assetTag,
        file: path.relative(root, result.file),
        sourceSha256: result.sourceSha256,
        revisao: "pendente; inspecionar arquivo antes de aprovar",
      }),
    );
  } else if (["preparar", "verificar"].includes(command) && !assetTag && !id) {
    const result = await (command === "preparar" ? prepare : verify)(
      inventory,
      workdir,
    );
    console.log(
      JSON.stringify({
        comando: command,
        imagens: result.entries.length,
        dimensoes: "800x600",
        formato: "webp",
        upload: "não executado",
      }),
    );
  } else
    throw new ImageError(
      "Use buscar, baixar <TI-0001> <id>, preparar ou verificar. Não existe comando de upload.",
    );
} catch (error) {
  console.error(
    error instanceof ImageError
      ? error.message
      : "Pipeline interrompido: confira arquivos locais, schema e seleção. Nenhum segredo ou resposta autenticada foi exibido.",
  );
  process.exitCode = 1;
}
