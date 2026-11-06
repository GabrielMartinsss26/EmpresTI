import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (name) => readFile(path.join(root, name));
const directory = "skills/imagens-equipamentos";
const bytes = await read(`${directory}/SKILL.md`);
const text = bytes.toString("utf8");
const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
assert.ok(frontmatter);
assert.match(frontmatter[1], /^name: imagens-equipamentos$/m);
assert.match(frontmatter[1], /^description: .+/m);
const references = [...text.matchAll(/\]\((references\/[^)]+)\)/g)].map(
  (match) => match[1],
);
assert.ok(references.length >= 1);
for (const reference of references)
  assert.ok((await stat(path.join(root, directory, reference))).isFile());
const inventory = JSON.parse(await read(`${directory}/assets/inventario.json`));
assert.equal(inventory.length, 12);
assert.equal(new Set(inventory.map((item) => item.assetTag)).size, 12);

// Só o exemplo público é lido. Nenhum arquivo real de ambiente é aberto.
const envBytes = await read(".env.example");
const envLines = envBytes.toString("utf8").split(/\r?\n/);
const keyLines = envLines
  .map((line, index) => ({ line, number: index + 1 }))
  .filter((item) => /^PIXABAY_API_KEY=/.test(item.line));
assert.equal(keyLines.length, 1);
assert.equal(keyLines[0].line, "PIXABAY_API_KEY=");

const sources = [],
  referencesToSkill = [];
async function visit(relative) {
  for (const entry of await readdir(path.join(root, relative), {
    withFileTypes: true,
  })) {
    const next = `${relative}/${entry.name}`;
    if (entry.isDirectory()) await visit(next);
    else if (/\.(?:ts|tsx|mjs|js)$/.test(entry.name)) {
      const content = await read(next);
      sources.push({ path: next, sha256: hash(content) });
      if (
        /imagens-equipamentos|(?:\.\.\/)+skills\//.test(
          content.toString("utf8"),
        )
      )
        referencesToSkill.push(next);
    }
  }
}
await visit("src");
assert.deepEqual(referencesToSkill, []);
console.log(
  JSON.stringify(
    {
      scope:
        "auditoria determinística local da skill; sem configuração real ou rede",
      skill: {
        file: `${directory}/SKILL.md`,
        sha256: hash(bytes),
        frontmatterValid: true,
        references,
        uniqueAssets: inventory.length,
      },
      envExample: {
        file: ".env.example",
        sha256: hash(envBytes),
        variable: "PIXABAY_API_KEY",
        line: keyLines[0].number,
        empty: true,
      },
      sourceScan: {
        referencesToSkill,
        sources,
        note: "Nenhum arquivo de src referencia a skill; conferência textual e hashes de todas as fontes para inspeção independente.",
      },
    },
    null,
    2,
  ),
);
