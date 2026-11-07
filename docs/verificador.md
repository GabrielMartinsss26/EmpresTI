# Verificador de specs

## Escopo autorizado

Etapa D01 da spec 004, autorizada pelo responsável em 06/nov/2026: configurar e provar o verificador antes da skill e das funcionalidades. Não autoriza implementar dados, catálogo ou empréstimos, publicar ou executar migrations.

Arquivos: `.codex/agents/verificador-spec.toml` define o papel; `.codex/config.toml` anuncia MCP de leitura; `scripts/verificador-mcp.mjs` limita as operações locais; `scripts/verificar-spec.mjs` abre uma sessão separada de leitura e exige a delegação. Não existe segunda cópia das instruções do agente em `agents/`.

## Execução

```powershell
npm run test:verificador
npm run verify:spec -- docs/specs/004-dados-iniciais/spec.md docs/verificacoes/resultado.json
```

O segundo caminho é opcional e deve apontar para evidências reais preparadas pelo principal. Sem prova suficiente, o resultado será SEM TESTE/BLOQUEADO, não aprovação por suposição. O verificador inspeciona fontes e testes, mas não executa testes: o principal roda os checks, identifica comando, código de saída, fontes/revisão e guarda recibos para conferência. Esse limite é deliberado para eliminar o terminal do verificador.

Usar o lançador, que chama o Codex CLI instalado, com contexto novo, `--sandbox read-only`, aprovação `never`, sem configuração pessoal, sem shell, apps, plugins, memória ou pesquisa web. A autenticação normal do Codex continua pertencendo ao cliente; não é copiada ao projeto nem fornecida como ferramenta ao modelo. Não abre chat do usuário na sidebar.

Não delegar a partir desta sessão de implementação com acesso irrestrito: subagentes herdam permissões do pai. O lançador também registra o papel explicitamente por configuração de linha de comando, pois descoberta automática pode depender de confiança no projeto/versão do cliente. Se falhar a delegação, a etapa fica BLOQUEADA, sem substituição pela opinião do principal.

## Limites efetivos

- O MCP expõe lista/leitura de fontes e `inspect_public_env_example`, acrescentada em D02 para conferir apenas existência, vazio e SHA-256 da variável PIXABAY_API_KEY no exemplo público fixo. Não há ferramenta de escrita, comando, rede, SQL, upload ou deploy. A consulta de metadados não aceita caminho ou variável arbitrária e nunca devolve valores.
- Leitura limitada a fontes/documentos e configurações públicas do projeto; nega todo `.env*` (inclusive exemplo), `.git`, `.vercel`, dependências, resultados locais e diretórios pessoais. Caminhos absolutos, traversal e escapes por links/junctions são recusados antes de leitura.
- A negativa acima se aplica à leitura textual. A consulta de metadados do exemplo é a única exceção delimitada: rejeita link e tamanho excessivo, abre somente .env.example e retorna flags/hash, sem conteúdo. Ambientes reais continuam inacessíveis.
- O MCP não recebe nem lê variáveis reais do projeto; o lançador encaminha ambiente mínimo ao cliente. O servidor não abre sockets, não importa clientes de banco e não executa programas.
- O sandbox de leitura da sessão dedicada é uma camada adicional para ferramentas nativas; não é alegado que um campo no arquivo do subagente substitui as permissões do pai.
- Relatórios são devolvidos ao principal. Só o principal grava evidências e corrige arquivos. Nenhuma ferramenta de escrita é adicionada para salvar relatório.
- Apps/plugins e configuração MCP pessoal não são carregados pelo lançador; somente o leitor local é registrado. Não executar a revisão nativa em sessão que tenha outros servidores com escrita.

Não é uma sandbox contra alteração maliciosa do próprio lançador/MCP por alguém com acesso ao computador. O contrato cobre a execução da versão revisada desses arquivos. A rede do cliente Codex para inferência é necessária; isso não fornece ferramenta de rede ao verificador.

## Procedimento e saída

O papel e formato da tabela têm um único dono: `.codex/agents/verificador-spec.toml`. O gatilho obrigatório pertence a `rules/spec-flow.md`. O principal fornece somente caminhos e identificador da revisão, sem histórico/conclusão desejada. O agente lê spec, código, testes, evidências e decisões aplicáveis.

O formato identifica cada CA na ordem, estado, arquivo/linha, teste/resultado e motivo; qualquer lacuna impede PRONTA. Duas rodadas podem ser comparadas por ID de critério. Verificação local não prova publicação. A conta do professor e dados remotos não são usados.

## Provas

`npm run test:verificador` testa a superfície MCP, bloqueio de caminhos/ambientes, junction externa e fixture independente. Os testes de segurança criam somente diretório temporário próprio, com valor explicitamente fictício.

`tests/verificador/spec.md` é uma fixture de dois critérios: limite e aprovação. Serve para provar o mecanismo; não substitui a prova final das specs 004/005. A demonstração deve registrar: baseline, alteração proposital com commit, teste quebrado e critério sem teste, reprovação por subagente real, restauração pelo principal com outro commit e nova rodada. Sem os eventos de delegação e leitura não declarar a prova concluída.

Recibos e tabelas versionados ficam em `docs/verificacoes/verificador/`. Eventos brutos locais ficam em `test-results/verificador/`, ignorados pelo Git. A prova plantada deve ocorrer somente nessa fixture, sem banco, usuário real ou produção.

Prova realizada em 06/nov/2026: configuração `e56b9ad`, erro plantado `f26262e`, restauração `27b503f`. `plantado.md` reprovou CA-V01 e marcou CA-V02 SEM TESTE; `restaurado.md` aprovou ambos após execução local do principal. Os arquivos `delegacao-*.json` registram do runtime a chamada spawn_agent, agent_type, fork_turns=none, sessões pai/filho e sandbox read-only/approval never. Os eventos do CLI não mostram todos os detalhes de delegação; por isso o principal conferiu também os registros locais dessas sessões, guardando somente os metadados necessários, sem prompts ou configuração pessoal.

Em D07, 07/nov/2026, nova demonstração: `4e3c16b` plantou o erro somente na fixture; `80ddf07` restaurou os bytes originais. Pareceres e delegações `docs/verificacoes/verificador/d07-*` preservam baseline, reprovação, restauração e revisão integral. A revisão da spec 004 reconheceu os critérios locais, manteve produção/login SEM TESTE e CA-D07 BLOQUEADO por prova insuficiente de isolamento global da sessão principal. Limitar este verificador não resolve esse último ponto. Registro completo e desvio de whitespace da fase plantada em `d07-execucao.md`; proposta de isolamento ainda não aprovada.

Calibração real anterior: `calibracao.md` recusou o recibo `baseline.json` após formatação mudar o hash do teste. O recibo foi preservado como evidência histórica dessa reprovação, não como teste vigente. A nova execução identificada e compatível está em `restaurado.json`.

## Fontes e versão

Consulta de 06/nov/2026 e CLI instalado `0.167.0-alpha.3.2`:

- https://learn.chatgpt.com/docs/agent-configuration/subagents — arquivo TOML, capacidades e herança de permissões.
- https://learn.chatgpt.com/docs/config-file/config-reference — registro de papel, MCP e controles da sessão.
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports — stdio JSON-RPC delimitado por linha.

Documentação não é prova de enforcement local; resultados da demonstração são registrados separadamente.
