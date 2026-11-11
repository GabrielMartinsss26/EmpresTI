import { realpath, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { createHash } from "node:crypto";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const roots = new Set([
  "docs",
  "src",
  "prisma",
  "tests",
  "rules",
  "scripts",
  "skills",
  ".codex",
]);
const rootFiles = new Set([
  ".gitignore",
  ".vercelignore",
  "AGENTS.md",
  "README.md",
  "ENTREGA.md",
  "package.json",
  "package-lock.json",
  "vitest.config.ts",
  "vitest.db.config.ts",
  "playwright.config.ts",
  "tsconfig.json",
  "next.config.ts",
  "eslint.config.mjs",
]);
const extensions = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".mjs",
  ".json",
  ".css",
  ".sql",
  ".prisma",
  ".toml",
]);
const forbidden =
  /^(?:\.env.*|\.git|\.vercel|node_modules|\.next|coverage|test-results|playwright-report|auth\.json|config\.local.*)$/i;

function permitted(relative) {
  const parts = relative.split("/");
  return (
    !parts.some(
      (part) => !part || part === "." || part === ".." || forbidden.test(part),
    ) &&
    !relative.includes("\\") &&
    !relative.includes(":") &&
    (roots.has(parts[0]) || (parts.length === 1 && rootFiles.has(relative))) &&
    (extensions.has(path.extname(relative)) || rootFiles.has(relative))
  );
}

export async function readProjectFile(
  relative,
  start = 1,
  count = 200,
  root = projectRoot,
) {
  if (typeof relative !== "string" || !permitted(relative))
    throw new Error("Caminho não permitido.");
  if (
    !Number.isInteger(start) ||
    start < 1 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 400
  ) {
    throw new Error("Intervalo inválido: use 1 a 400 linhas.");
  }
  const canonicalRoot = await realpath(root);
  const target = await realpath(path.resolve(canonicalRoot, relative));
  // Impede escape por junction/symlink, inclusive dentro de uma pasta permitida.
  const normalized = path
    .relative(canonicalRoot, target)
    .split(path.sep)
    .join("/");
  if (
    !permitted(normalized) ||
    normalized !== relative ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Destino real não permitido.");
  }
  const info = await stat(target);
  if (!info.isFile() || info.size > 2_000_000)
    throw new Error("Arquivo fora do limite de leitura.");
  const bytes = await readFile(target);
  const lines = bytes.toString("utf8").split(/\r?\n/);
  return {
    path: relative,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    totalLines: lines.length,
    text: lines
      .slice(start - 1, start - 1 + count)
      .map((line, i) => `${start + i}: ${line}`)
      .join("\n"),
  };
}

export async function listProjectFiles(root = projectRoot) {
  const result = [];
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      if (entry.isSymbolicLink() || forbidden.test(entry.name)) continue;
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory() && (relative || roots.has(entry.name)))
        await visit(next);
      else if (entry.isFile() && permitted(next)) result.push(next);
    }
  }
  await visit();
  return result.sort();
}

// Metadados do exemplo público; nunca devolve valor e nunca abre ambiente real.
export async function inspectPublicEnvExample(root = projectRoot) {
  const canonicalRoot = await realpath(root);
  const expected = path.join(canonicalRoot, ".env.example");
  const target = await realpath(expected);
  if (target !== expected)
    throw new Error("Exemplo público não pode ser link.");
  const info = await stat(target);
  if (!info.isFile() || info.size > 100_000)
    throw new Error("Exemplo público fora do limite.");
  const bytes = await readFile(target);
  const lines = bytes
    .toString("utf8")
    .split(/\r?\n/)
    .filter((line) => /^PIXABAY_API_KEY=/.test(line));
  return {
    path: ".env.example",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    variable: "PIXABAY_API_KEY",
    occurrences: lines.length,
    exists: lines.length === 1,
    empty: lines.length === 1 && lines[0] === "PIXABAY_API_KEY=",
  };
}

export const tools = [
  {
    name: "inspect_public_env_example",
    description:
      "Confere somente existência e valor vazio de PIXABAY_API_KEY no exemplo público fixo .env.example e devolve SHA-256. Não retorna conteúdo/valores; não recebe caminho e não acessa ambiente real.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: "list_files",
    description:
      "Lista somente fontes e documentos autorizados do projeto; sem ambiente, histórico, dependências ou diretórios externos.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  {
    name: "read_file",
    description:
      "Lê arquivo autorizado com linhas numeradas. Não escreve, executa comandos ou faz rede.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        start: { type: "integer", minimum: 1 },
        count: { type: "integer", minimum: 1, maximum: 400 },
      },
      required: ["path"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
];

export async function handle(request) {
  if (request.method === "initialize")
    return {
      protocolVersion: request.params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "empresti-verificador-leitura", version: "1.0.0" },
    };
  if (request.method === "ping") return {};
  if (request.method === "tools/list") return { tools };
  if (request.method !== "tools/call") throw new Error("Método não permitido.");
  const { name, arguments: args = {} } = request.params ?? {};
  if (!tools.some((tool) => tool.name === name))
    throw new Error("Ferramenta não permitida.");
  const allowedKeys = name === "read_file" ? ["path", "start", "count"] : [];
  if (Object.keys(args).some((key) => !allowedKeys.includes(key)))
    throw new Error("Argumento não permitido.");
  const output =
    name === "inspect_public_env_example"
      ? await inspectPublicEnvExample()
      : name === "list_files"
        ? await listProjectFiles()
        : await readProjectFile(args.path, args.start, args.count);
  return { content: [{ type: "text", text: JSON.stringify(output) }] };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const input = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });
  for await (const line of input) {
    if (Buffer.byteLength(line) > 64_000) continue;
    let request;
    try {
      request = JSON.parse(line);
      if (request.id === undefined) continue;
      const result = await handle(request);
      process.stdout.write(
        `${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`,
      );
    } catch {
      process.stdout.write(
        `${JSON.stringify({ jsonrpc: "2.0", id: request?.id ?? null, error: { code: -32602, message: "Operação ou caminho não permitido; nenhum conteúdo sensível foi retornado." } })}\n`,
      );
    }
  }
}
