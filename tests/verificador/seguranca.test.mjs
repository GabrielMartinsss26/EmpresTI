import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  readProjectFile,
  listProjectFiles,
  handle,
  tools,
} from "../../scripts/verificador-mcp.mjs";

test("CA-D08: transporte stdio inicializa e recusa ferramenta de escrita", () => {
  const messages = [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "write_file",
        arguments: { path: "README.md", text: "não deve ser escrito" },
      },
    },
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "read_file", arguments: { path: ".env" } },
    },
  ];
  const response = spawnSync(
    process.execPath,
    ["scripts/verificador-mcp.mjs"],
    {
      encoding: "utf8",
      input:
        messages.map((message) => JSON.stringify(message)).join("\n") + "\n",
      timeout: 5000,
      windowsHide: true,
    },
  );
  assert.equal(response.status, 0);
  const replies = response.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(replies.length, 4);
  assert.equal(
    replies[0].result.serverInfo.name,
    "empresti-verificador-leitura",
  );
  assert.deepEqual(
    replies[1].result.tools.map((tool) => tool.name),
    ["list_files", "read_file"],
  );
  assert.equal(replies[2].error.code, -32602);
  assert.equal(replies[3].error.code, -32602);
});

test("CA-D08: MCP expõe somente lista e leitura; execução/escrita/rede não existem", async () => {
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["list_files", "read_file"],
  );
  for (const name of [
    "write_file",
    "exec",
    "fetch",
    "deploy",
    "migrate",
    "upload",
  ]) {
    await assert.rejects(
      handle({ method: "tools/call", params: { name, arguments: {} } }),
    );
  }
  await assert.rejects(
    handle({
      method: "tools/call",
      params: {
        name: "read_file",
        arguments: { path: "README.md", command: "ignored" },
      },
    }),
  );
});

test("CA-D08: leitura nega ambientes, traversal e caminhos absolutos antes de abrir", async () => {
  for (const name of [
    ".env",
    ".env.local",
    ".env.example",
    "docs/.env.local",
    "../README.md",
    "docs/../../.env",
    "C:/Windows/win.ini",
    "/etc/passwd",
    "docs\\PRD.md",
    ".git/config",
    ".vercel/project.json",
  ]) {
    await assert.rejects(readProjectFile(name));
  }
  await assert.rejects(readProjectFile("README.md", 0));
  await assert.rejects(readProjectFile("README.md", 1, 401));
});

test("CA-D08: descoberta filtra segredos e leitura bloqueia junction externa", async () => {
  const temp = await mkdtemp(
    path.join(os.tmpdir(), "empresti-verificador-test-"),
  );
  const root = path.join(temp, "repo");
  const outside = path.join(temp, "externo");
  try {
    await mkdir(path.join(root, "docs"), { recursive: true });
    await mkdir(outside);
    await writeFile(path.join(root, "docs", "ok.md"), "primeira\nsegunda");
    await writeFile(path.join(root, ".env"), "VALOR_FICTICIO=apenas-fixture");
    await writeFile(path.join(outside, "fora.md"), "fora-do-escopo");
    await symlink(
      outside,
      path.join(root, "docs", "atalho"),
      process.platform === "win32" ? "junction" : "dir",
    );
    assert.deepEqual(await listProjectFiles(root), ["docs/ok.md"]);
    assert.match(
      (await readProjectFile("docs/ok.md", 2, 1, root)).text,
      /^2: segunda$/,
    );
    await assert.rejects(readProjectFile("docs/atalho/fora.md", 1, 10, root));
  } finally {
    // Diretório temporário criado exclusivamente por este teste.
    assert.equal(path.dirname(temp), os.tmpdir());
    await rm(temp, { recursive: true, force: true });
  }
});
