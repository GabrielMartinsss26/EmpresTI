Parecer do agente customizado `verificador-spec`, instância `/root/revisao_conta_spec004`, sobre a **árvore local atual**:

**Veredito: NÃO PRONTA.**

| Critério | Estado | Fundamentação devolvida pelo agente |
|---|---|---|
| CA-D01 | ATENDE | Inventário, categorias, nove disponíveis/três em manutenção e zero empréstimos conferidos em implementação, testes e evidência E10 compatível. |
| CA-D02 | ATENDE | Reexecução preserva snapshots; conflitos e falha tardia não produzem alterações parciais. |
| CA-D03 | ATENDE | Manifesto e provas identificam 12 imagens distintas, decodificáveis, 800×600, com créditos e hashes correspondentes. |
| CA-D04 | ATENDE | Registros documentam aprovação/reprovação visual, motivos e exceções previstas no ADR-005. |
| CA-D05 | ATENDE | Recibo D08 registra 12 GETs públicos HTTP 200, zero uploads na repetição e escrita anônima negada. |
| CA-D06 | ATENDE | Testes locais comprovam idempotência; nova evidência remota registra autenticação real, `/catalogo` autenticado com HTTP 200, papel COLLABORATOR e zero empréstimos. |
| CA-D07 | **NÃO ATENDE** | Existe executor de escrita real e evidência de uso em produção. O recibo atual também declara senha compartilhada no histórico publicado. A autorização da execução não satisfaz o critério de isolamento. |
| CA-D08 | ATENDE | Tabela integral fundamentada em fontes e recibos de integração, mantendo a reprovação de CA-D07; também apoiada em provas históricas de delegação independente. |

Hashes SHA-256 conferidos pelo agente via MCP:

| Evidência | Hash |
|---|---|
| Spec | `ab99527c2f46fe5a78e25247e410d171a422cf4768e8523f2a38849a7b575e4d` |
| Recibo de entrada | `a8f7eb1cd287332af094df52d6f942ac04cc7045f879c493ce55b61c714f8355` |
| Conta publicada — JSON | `c621b3efaca934fb939d4affdcf5ed75b11aba8756c710c788b5fb3860195e7f` |
| Conta publicada — relato | `f4f26c1b219940204188e78508c6247d7535d79ddc18ed6f35944dafd723476f` |
| Manifesto D03 | `47b7ec509a49d8094ac2df136a405225668d9ab6393be29c731d23412c5d5c5b` |

O agente informou que inspecionou fontes exclusivamente pelo MCP autorizado, sem executar testes, comandos ou acessos remotos. Resultados históricos não representam nova execução nesta rodada. As imagens foram avaliadas pelos registros e evidências, sem nova inspeção visual.

A delegação atual não possui recibo em disco. O identificador da instância não comprova todos os parâmetros do lançador nem isolamento global. A revisão-base declarada no recibo é `75fd468315096f117c43d4619a0ec4af6105c7ef`, sem confirmação pelo histórico Git.

Encaminhamento do verificador: registrar **CA-D06 como ATENDE nesta rodada**, preservar o parecer histórico e manter **CA-D07 como NÃO ATENDE**. Nenhum arquivo foi alterado.
