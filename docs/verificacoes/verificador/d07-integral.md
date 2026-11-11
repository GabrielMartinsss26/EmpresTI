Instância filha retornada: `/root/verificacao_d07` — agente customizado `verificador-spec`, com contexto limpo.

Segue o relatório devolvido pelo agente:

Spec: `docs/specs/004-dados-iniciais/spec.md`. Revisão: **árvore local atual**, comparada ao recibo `docs/verificacoes/verificador/d07-evidencias.json`, que declara revisão-base `80ddf07050416119be2c2e7a4a5442c08fa0dd28`.

Na tabela, “recibo” significa esse arquivo de evidências. Execuções são atribuídas ao principal; não executei testes.

| Critério | Estado | Evidência (arquivo:linha e teste/resultado) | Motivo |
|---|---|---|---|
| CA-D01 · Em banco descartável preparado, existem os 12 patrimônios, nomes e categorias da tabela, com local Operações e nove disponíveis/três em manutenção; nenhuma linha de empréstimo é criada. | ATENDE | `prisma/dados-pratica.ts:8`; `tests/db/dados-pratica.test.ts:78`; `tests/db/d05-local.ts:67`; recibo:13 e :49 | Inventário corresponde à spec; teste confere nomes, categorias, local, situações e ausência de empréstimos. Recibo registra 96 testes de banco aprovados e execução D05 aprovada em PostgreSQL descartável. Hashes das fontes conferidas coincidem. |
| CA-D02 · Rodar a população duas vezes preserva IDs e quantidades. Casos de conflito seguem política aprovada antes do código; sem exclusão ou reset silencioso. | ATENDE | `tests/db/dados-pratica.test.ts:118`, :181 e :323; `prisma/dados-pratica.ts:274`; `tests/db/d05-local.ts:37`; recibo:49 | Reexecução compara registros completos; conflitos verificam interrupção sem alterações parciais. Execuções locais identificadas passaram, com hashes compatíveis. Política está registrada na regra 7 e no plano. |
| CA-D03 · As 12 imagens finais são decodificáveis, distintas e medem exatamente 800×600; manifesto associa cada arquivo ao patrimônio, ID Pixabay, autor, origem e licença. | ATENDE | `prisma/dados-pratica.ts:83`, :101 e :131; `tests/db/d05-local.ts:11`; `docs/verificacoes/imagens/d03-manifesto.json:4`; `tests/db/dados-pratica.test.ts:393`; recibo:40 e :49 | Executor D05 lê o pacote real D03, confere manifesto, decodifica integralmente e valida dimensões, hashes e unicidade. Recibo registra sucesso; manifesto e prova D03 atuais têm os hashes esperados. Testes sintéticos também exercitam rejeição de dimensões incorretas. |
| CA-D04 · Revisão visual registra aprovação/reprovação e motivo para cada candidata selecionada, comprovando exclusão de conteúdo proibido. | ATENDE | `docs/verificacoes/imagens/d03-final.json:98`, :378 e :504; `docs/verificacoes/imagens/d03-manifesto.json:24`; `tests/imagens/pipeline.test.mjs:297` e :319; recibo:22 | Registros identificam candidatas, bytes de origem, decisão, revisor, data e motivos; incluem rejeições e substituições. Seleções finais possuem aprovação registrada, respeitando as exceções do ADR-005. Testes aprovados exigem revisão válida. Aprovação baseada na evidência visual registrada, sem nova inspeção das imagens pelo verificador. |
| CA-D05 · No destino publicado pelo operador, URLs de imagem abrem sem login e reexecução não duplica objetos. Escrita pública é negada. | SEM TESTE | recibo:265; `docs/adr/006-metadados-imagens-storage.md:21` e :55 | Não há evidência do destino publicado. PostgreSQL com tabelas Storage simuladas não comprova download HTTP público, repetição de upload ou negação de escrita no serviço real. |
| CA-D06 · Provisionamento local descartável repetido não duplica identidade, perfil ou membership; conta de correção tem papel COLLABORATOR e zero empréstimos. No destino, operador confirma login sem gerar empréstimos. | SEM TESTE | `tests/db/conta-correcao.test.ts:47`; `tests/db/d06-local.ts:28` e :45; `tests/db/auth-fixture.ts:5`; recibo:58 e :254 | Parte local possui teste e execução aprovada com hashes compatíveis. Identidade é simulada; o próprio recibo declara `realLoginVerified: false`. Falta confirmação do operador no destino. |
| CA-D07 · Scripts, manifests, logs e histórico não contêm as credenciais usadas no provisionamento ou na busca. O agente não possui caminho executável de escrita no destino de produção durante a prática. | BLOQUEADO | `prisma/conta-correcao.ts:108`; `tests/db/auth-fixture.ts:30`; `scripts/verificar-spec.mjs:19`; `docs/pratica.md:23`; recibo:270 | Executores locais e lançador apresentam restrições verificáveis, mas não comprovam isolamento global da sessão principal. Histórico Git não está acessível pelo MCP e não há prova suficiente cobrindo histórico, logs e todas as capacidades de escrita do principal. Exemplo público foi conferido apenas por metadados: chave presente e vazia. |
| CA-D08 · Verificador independente emite tabela de todos os critérios com evidência; critério sem evidência não é aprovado. Estado publicado exige evidência do operador, não inferência de testes locais. | ATENDE | Esta tabela; `tests/verificador/seguranca.test.mjs:15` e :70; recibo:31; `docs/verificacoes/verificador/d07-plantado.md:9`; `docs/verificacoes/verificador/d07-delegacao-plantado.json:23`; `docs/verificacoes/verificador/d07-restaurado.md:9` | Revisão independente por MCP apresenta todos os critérios e mantém lacunas reprovadas. Demonstração registra contradição e ausência de teste, seguidas de restauração. Nenhum resultado local foi usado para aprovar publicação ou login real. |

**Veredito: NÃO PRONTA**

Tarefas a devolver ao principal:

- Obter do operador as evidências de CA-D05 e da parte remota de CA-D06, na etapa autorizada correspondente.
- Fornecer evidência sanitizada e verificável da auditoria de histórico/logs e do isolamento efetivo de produção exigidos por CA-D07, sem fornecer credenciais ou ambientes reais.
- Guardar esta tabela integral, preservando os estados e limitações.

Hashes SHA-256 conferidos:

- Spec: `06472c65f072de771e34447907a126bab5b3b5d9d259d39f4ce4d9b8f7c179c5`
- Recibo recebido: `854feb49e8a193339aff58a37e21cd832b1f3c8f2ea53558ad29870d4a620f79`
- Manifesto D03: `47b7ec509a49d8094ac2df136a405225668d9ab6393be29c731d23412c5d5c5b`
- Prova D03: `ab364f5acf24b421541d64594ccade2aec4a2e86ecbddd351d9de15bfc92ee70`
- Exemplo público, somente metadados: `d8aade93480d6a20c8617a7aea72fb93f3b433ef55ff7f2f63ba5c30eafd16d9`

Limitações: inspeção somente pelo MCP autorizado; sem comandos, execução de testes, leitura de ambientes reais ou acesso à produção. Os hashes das fontes relevantes de D05/D06, testes, configuração de banco, schema e migrations consultados coincidiram com o recibo. A revisão identifica os bytes da árvore local; não confirma o commit declarado por inspeção do histórico.
