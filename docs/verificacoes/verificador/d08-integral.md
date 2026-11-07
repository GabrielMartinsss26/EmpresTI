Instância filha retornada por `spawn_agent`: `/root/verificacao_d08`
Agente: `verificador-spec`, com contexto limpo.

Segue o parecer recebido:

Spec 004 — Dados iniciais e imagens. Revisão **BLOQUEADA**, referente à árvore local atual; não certifica o commit informado no recibo.

Hashes SHA-256 retornados pelo MCP:

- `docs/specs/004-dados-iniciais/spec.md`: `c9e3b1ead627fbf6515c3a1a48a3affcf85bbdd5c5b1e3189564711d44b0608c`
- `docs/verificacoes/imagens/d08-recibo.json`: `daa653fd24cb85fd660c77959d854e07712083dcd711de92308f62643cf8f37f`

O hash atual da spec coincide com o registrado em `d08-recibo.json:527`. Os demais arquivos não puderam ter seus hashes comparados: a solicitação restringiu a leitura a esses dois caminhos.

Na tabela, `spec.md` e `d08-recibo.json` designam os caminhos completos acima.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-D01 · Em banco descartável preparado, existem os 12 patrimônios, nomes e categorias da tabela, com local Operações e nove disponíveis/três em manutenção; nenhuma linha de empréstimo é criada. | BLOQUEADO | `spec.md:53`; `d08-recibo.json:415` relata 98 testes de banco; `d08-recibo.json:378` registra contagens remotas. | Testes, implementação e recibos locais específicos estão fora do escopo permitido. Contagens remotas não comprovam o cenário descartável nem todos os campos exigidos. |
| CA-D02 · Rodar a população duas vezes preserva IDs e quantidades. Casos de conflito seguem política aprovada antes do código; sem exclusão ou reset silencioso. | BLOQUEADO | `spec.md:54`; `d08-recibo.json:230` registra reexecução sem novas linhas e `d08-recibo.json:236` declara preservação de IDs e timestamps. | Não foi possível inspecionar os casos de conflito, implementação, testes ou comparar seus hashes atuais. |
| CA-D03 · As 12 imagens finais são decodificáveis, distintas e medem exatamente 800×600; manifesto associa cada arquivo ao patrimônio, ID Pixabay, autor, origem e licença. | BLOQUEADO | `spec.md:55`; `d08-recibo.json:237` registra downloads, dimensões e hashes; `d08-recibo.json:522` identifica hash do manifesto. | Manifesto e arquivos não estão acessíveis no escopo recebido. O registro não permite conferir créditos, licença e associação integral. |
| CA-D04 · Revisão visual registra aprovação/reprovação e motivo para cada candidata selecionada, comprovando exclusão de conteúdo proibido. | BLOQUEADO | `spec.md:56`; `d08-recibo.json:523` referencia hash de evidência D03. | Revisão visual, candidatas e motivos não constam dos dois arquivos permitidos. |
| CA-D05 · No destino publicado pelo operador, URLs de imagem abrem sem login e reexecução não duplica objetos. Escrita pública é negada. | BLOQUEADO | `spec.md:57`; `d08-recibo.json:218` registra escrita anônima negada; `d08-recibo.json:195` registra zero uploads na segunda execução; `d08-recibo.json:237` registra 12 respostas HTTP 200. | Há registro de integração real, separado dos testes locais. Porém, código executor e ADR-007 estão inacessíveis, impedindo verificar proveniência, método e contrato da delegação. Os hashes desses arquivos não puderam ser comparados. |
| CA-D06 · Provisionamento local descartável repetido não duplica identidade, perfil ou membership; conta de correção tem papel COLLABORATOR e zero empréstimos. No destino, operador confirma login sem gerar empréstimos. | SEM TESTE | `spec.md:58`; `d08-recibo.json:192` e `d08-recibo.json:534` registram conta e login adiados. | Não há evidência de login real. Os testes locais específicos também não puderam ser inspecionados. |
| CA-D07 · Scripts, manifests, logs e histórico não contêm as credenciais usadas no provisionamento ou na busca. O agente não possui caminho executável de escrita no destino de produção durante a prática. | BLOQUEADO | `spec.md:59`; `d08-recibo.json:200` registra escrita em produção; `d08-recibo.json:535` declara capacidade de escrita real e isolamento global não comprovado. | A evidência não demonstra isolamento. A exceção alegada depende de ADR inacessível, e scripts, manifests e histórico não foram inspecionados. |
| CA-D08 · Verificador independente emite tabela de todos os critérios com evidência; critério sem evidência não é aprovado. Estado publicado exige evidência do operador, não inferência de testes locais. | BLOQUEADO | `spec.md:60`; esta tabela; `d08-recibo.json:3` identifica execução pelo principal por delegação alegada. | A tabela foi emitida sem aprovações indevidas, mas a revisão integral exige fontes obrigatórias inacessíveis no escopo recebido e validação do contrato de evidência delegada. |

**Veredito: NÃO PRONTA.**

Tarefas a devolver ao principal:

- Disponibilizar, em nova revisão, PRD, ADRs aplicáveis, `rules/restrictions.md`, `rules/tests.md`, `rules/spec-flow.md`, plano, tarefas e fontes de implementação/testes identificadas pelo recibo.
- Permitir comparar os hashes atuais dessas fontes com os hashes registrados, sem acesso a ambientes reais ou credenciais.
- Manter pendentes a comprovação de login real e a resolução do isolamento exigido por CA-D07.

Limitações: somente os dois arquivos autorizados foram lidos, exclusivamente pelo MCP. Nenhum comando, teste ou acesso remoto foi executado. Os resultados do recibo foram tratados como registros fornecidos pelo principal, sem simular confirmação independente de sua execução.
