import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const [spec, evidence] = process.argv.slice(2);
const safePath = (value) =>
  typeof value === "string" &&
  /^(?:docs\/|tests\/verificador\/)[a-zA-Z0-9_./-]+\.(?:md|json)$/.test(
    value,
  ) &&
  !value.split("/").includes("..");
if (!safePath(spec) || (evidence && !safePath(evidence))) {
  console.error(
    "Uso: npm run verify:spec -- docs/specs/NNN-nome/spec.md [docs/verificacoes/resultado.json]",
  );
  process.exit(2);
}
// Ambiente mínimo: nenhum segredo de banco/provedor é encaminhado a comandos filhos.
const env = {};
for (const [name, value] of Object.entries(process.env)) {
  if (
    /^(?:PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMFILES|PROGRAMFILES\(X86\))$/i.test(
      name,
    )
  )
    env[name] = value;
}
const prompt = `Delegue obrigatoriamente para o agente customizado verificador-spec, com contexto limpo, apenas estes caminhos: spec ${spec}; evidências ${evidence ?? "não fornecidas"}. Use a ferramenta nativa spawn_agent com agent_type verificador-spec e aguarde o resultado; registre o ID retornado da instância filha no relatório. Ele deve ler as fontes pelo MCP verificador_local e devolver sua tabela. Não implemente e não corrija. Não rode comandos, não leia ambientes reais e não chame outras integrações. Se o agente customizado ou a delegação não estiver disponível, encerre com BLOQUEADO; não simule a delegação nem revise você mesmo. Devolva a resposta dele, sem transformar reprovação em aprovação. Identifique no relatório que a revisão é da árvore local atual e cite os hashes de evidência quando fornecidos.`;
const result = spawnSync(
  "codex",
  [
    "--no-daemon",
    "exec",
    "--ignore-user-config",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--cd",
    root,
    "--json",
    "-c",
    'approval_policy="never"',
    "-c",
    'shell_environment_policy.inherit="none"',
    "-c",
    'web_search="disabled"',
    "-c",
    "features.shell_tool=false",
    "-c",
    "features.apps=false",
    "-c",
    "features.plugins=false",
    "-c",
    "features.memories=false",
    "-c",
    "features.hooks=false",
    "-c",
    "features.request_permissions_tool=false",
    "-c",
    "features.shell_snapshot=false",
    "-c",
    "features.multi_agent=true",
    "-c",
    "agents.enabled=true",
    "-c",
    `agents.verificador-spec.config_file=${JSON.stringify(path.join(root, ".codex/agents/verificador-spec.toml"))}`,
    "-c",
    'agents.verificador-spec.description="Verifica todos os critérios da spec sem corrigir, com ferramentas de leitura."',
    "-c",
    "skills.bundled.enabled=false",
    "-c",
    "skills.include_instructions=false",
    "-c",
    `mcp_servers.verificador_local.command=${JSON.stringify(process.execPath)}`,
    "-c",
    `mcp_servers.verificador_local.args=[${JSON.stringify(path.join(root, "scripts/verificador-mcp.mjs"))}]`,
    "-c",
    "mcp_servers.verificador_local.required=true",
    "-",
  ],
  {
    cwd: root,
    env,
    input: prompt,
    encoding: "utf8",
    timeout: 600_000,
    maxBuffer: 8_000_000,
    windowsHide: true,
  },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error)
  console.error(
    `Verificação não concluída: ${result.error.code ?? "erro ao iniciar Codex"}.`,
  );
process.exit(result.status ?? 1);
