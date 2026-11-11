Instância filha: `/root/verificacao_004_d08` — agente customizado `verificador-spec`, com contexto limpo.

Segue o parecer devolvido pela instância:

Spec 004 — Dados iniciais e imagens, revisão da **árvore local atual**. Recibo recebido: `docs/verificacoes/imagens/d08-recibo-r2.json`, revisão-base declarada `e41044a27ec42ce6c933dc4a59147193dfa36633`.

Hashes SHA-256:

- Spec: `c9e3b1ead627fbf6515c3a1a48a3affcf85bbdd5c5b1e3189564711d44b0608c`.
- Recibo R2: `e84195a8a8633b72af6c3def4bda1979ddb7e1b465fff6f552ced1b89488252b`.
- Manifesto: `47b7ec509a49d8094ac2df136a405225668d9ab6393be29c731d23412c5d5c5b`.

Comparei os **92 hashes de arquivos** declarados no recibo com os retornados pelo MCP: nenhuma divergência. O recibo D05 antigo diverge da implementação/teste atuais; para esses arquivos, considerei a execução atual registrada no recibo R2.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-D01 · Em banco descartável preparado, existem os 12 patrimônios, nomes e categorias da tabela, com local Operações e nove disponíveis/três em manutenção; nenhuma linha de empréstimo é criada. | ATENDE | `prisma/dados-pratica.ts:8`; `tests/db/dados-pratica.test.ts:102`; `tests/db/setup.ts:47`; `docs/verificacoes/imagens/d08-recibo-r2.json:415`. | Inventário conferido contra a spec. Teste verifica categorias, retirada, situações e ausência de empréstimos. Resultado identificado: 98 testes em PostgreSQL descartável, saída 0. |
| CA-D02 · Rodar a população duas vezes preserva IDs e quantidades. Casos de conflito seguem política aprovada antes do código; sem exclusão ou reset silencioso. | ATENDE | `tests/db/dados-pratica.test.ts:139`, `:220` e `:355`; `prisma/dados-pratica.ts:215`; `docs/verificacoes/imagens/d08-recibo-r2.json:415`. | Testes comparam snapshots completos na repetição, exercitam conflitos e rollback de falha tardia. Implementação valida o lote antes de criar ausentes, em transação serializável. |
| CA-D03 · As 12 imagens finais são decodificáveis, distintas e medem exatamente 800×600; manifesto associa cada arquivo ao patrimônio, ID Pixabay, autor, origem e licença. | ATENDE | `prisma/dados-pratica.ts:83`, `:101` e `:131`; `docs/verificacoes/imagens/d03-manifesto.json:5`; `scripts/publicar-pratica.ts:78`; `docs/verificacoes/imagens/d08-recibo-r2.json:72` e `:384`. | Validação decodifica integralmente os arquivos e compara hashes/dimensões antes da publicação. Manifesto contém os vínculos e créditos. Integração registra 12 downloads públicos com dimensões e hashes correspondentes. |
| CA-D04 · Revisão visual registra aprovação/reprovação e motivo para cada candidata selecionada, comprovando exclusão de conteúdo proibido. | ATENDE | `docs/verificacoes/imagens/d03-final.json:99`, `:217`, `:396` e `:504`; `docs/verificacoes/imagens/d03-manifesto.json:24`; `docs/adr/005-imagens-equipamentos.md:16`. | Registros identificam candidatas, decisões, motivos, revisor e hashes. Há rejeições por pessoas, marcas e conteúdo em tela; as 12 finais possuem aprovação registrada. Exceções conferidas contra spec/ADR. |
| CA-D05 · No destino publicado pelo operador, URLs de imagem abrem sem login e reexecução não duplica objetos. Escrita pública é negada. | ATENDE | `docs/adr/007-execucao-delegada-d08.md:3`; `scripts/publicar-pratica.ts:268`, `:287` e `:357`; `docs/verificacoes/imagens/d08-recibo-r2.json:53`, `:72`, `:187` e `:378`. | ADR-007 permite execução delegada. Recibo de integração identifica destino, horários, duas execuções, 12 GETs públicos HTTP 200 e zero uploads na segunda execução. Upload anônimo foi negado com código Storage 403. Não confundi essa integração com testes locais. |
| CA-D06 · Provisionamento local descartável repetido não duplica identidade, perfil ou membership; conta de correção tem papel COLLABORATOR e zero empréstimos. No destino, operador confirma login sem gerar empréstimos. | SEM TESTE | `tests/db/conta-correcao.test.ts:46`; `docs/verificacoes/imagens/d06-recibo.json:4`; `docs/verificacoes/imagens/d08-recibo-r2.json:540`. | Parte local possui teste de repetição, papel e zero empréstimos, usando identidade simulada. Conta e login reais foram adiados; falta a confirmação exigida no destino. |
| CA-D07 · Scripts, manifests, logs e histórico não contêm as credenciais usadas no provisionamento ou na busca. O agente não possui caminho executável de escrita no destino de produção durante a prática. | NÃO ATENDE | `scripts/publicar-pratica.ts:76`, `:134`, `:279` e `:323`; `docs/verificacoes/imagens/d08-recibo-r2.json:34`; `docs/adr/007-execucao-delegada-d08.md:25`. | Nesta árvore há executor de escrita real e recibo de sua utilização. Isso contradiz a segunda condição do critério, embora autorizado. A classificação desta rodada decorre dessa contradição verificável; não altera o parecer histórico de bloqueio. A ausência integral de credenciais no histórico também não é comprovável pelo acesso permitido. |
| CA-D08 · Verificador independente emite tabela de todos os critérios com evidência; critério sem evidência não é aprovado. Estado publicado exige evidência do operador, não inferência de testes locais. | ATENDE | `.codex/agents/verificador-spec.toml:4`; `scripts/verificar-spec.mjs:29`; `docs/verificador.md:16`; esta tabela; `docs/verificacoes/imagens/d08-recibo-r2.json:7`. | Revisão independente recebeu caminhos e inspecionou fontes pelo MCP. Todos os critérios estão apresentados; lacunas permanecem reprovadas. Publicação fundamentada em recibo de integração do executor delegado pelo ADR-007. |

**Veredito: NÃO PRONTA.**

Tarefas a devolver ao principal:

- Obter, quando autorizado, evidência do provisionamento e login reais da conta de correção, sem gerar empréstimos.
- Encaminhar a decisão e a prova do isolamento efetivo exigido por CA-D07. Autorização de publicação e restrição do verificador não satisfazem esse critério.
- Registrar esta tabela integralmente, preservando os pareceres anteriores e a diferença de classificação de CA-D07 nesta rodada.

Limitações: não executei testes, comandos ou chamadas remotas; examinei fontes e resultados fornecidos. Imagens e respostas HTTP foram avaliadas pelos registros identificados, sem nova inspeção visual ou download. Ambientes reais, credenciais e histórico Git permanecem inacessíveis. A inspeção autorizada de `.env.example` confirmou `PIXABAY_API_KEY` existente e vazia, hash `91b53dbff1f0975c3a3724d89ee7bfe9f810470803be39e02e55c73bd3d314ab`; isso não comprova ausência de segredos em todo o histórico.
