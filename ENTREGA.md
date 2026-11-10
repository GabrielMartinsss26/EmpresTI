# Entrega da prática

Status em 10/nov/2026: publicação E11 executada em 09/nov/2026; verificação independente final da spec 005 concluída com 13 critérios ATENDE, PRONTA (docs/verificacoes/verificador/e11-integral-r2.md). A prática inteira não está concluída: conta do professor adiada e spec 004 NÃO PRONTA por falta da conta real e isolamento global não atendido. Sem push/tag de entrega.

## Estado vigente — E10 e E11

E10 verificou código, banco descartável, navegador e mecanismo independente: erro da fixture em 611129b, restauração efetiva em 2a943cf; tentativa intermediária incorreta preservada, sem reescrever o histórico. Parecer E10-R2: nove critérios ATENDE e quatro SEM TESTE até publicação. Lacuna local de fotos corrigida com comparação dos bytes recebidos pelo navegador ao manifesto D03. Evidências em docs/verificacoes/e10-execucao.md e verificador/e10-*.

O responsável então delegou a E11 (ADR-010). Aplicada apenas a migration aprovada de prazo, via Prisma Migrate no build Vercel, com preservação do histórico, depois publicado o deploy dpl_3aSE1YQFhNGrtrWi224RgkAtmrv4 em https://empresti-mauve.vercel.app. Credenciais/ambientes reais ficaram fora do upload e das evidências. Não houve criação de conta ou alteração de senha, push, tag ou merge.

Conferência real com conta própria: login, catálogo com 12 imagens aprovadas, manutenção em TI-0004/TI-0007/TI-0010, solicitar/rejeitar com motivo/solicitar novamente/aprovar, Meus empréstimos após recarregar, logout e proteção das três rotas. TI-0008 ficou como empréstimo de validação, vencendo 27/nov/2026 17:21. Não foi apagado por SQL. Recibos identificados em docs/verificacoes/e11-integracao.json e e11-evidencias.json; execução/limites em e11-publicacao.md.

A prática original reservava escrita real ao operador; o responsável delegou pontualmente D08 e E11. Registrar essas diferenças na correção: autorização não equivale a isolamento técnico, não transforma CA-D07 em ATENDE e não permite afirmar que a prática inteira está pronta. As seções abaixo preservam o planejamento e as evidências históricas, com os estados de cada data.

## Histórico iniciado em 06/nov/2026

## Links

- Repositório: https://github.com/GabrielMartinsss26/EmpresTI
- Produção existente: https://empresti-mauve.vercel.app/ — contém a base de login/landing, ainda não as funcionalidades desta prática.
- Arquitetura: monolito Next/tRPC; uma verificação cobre frontend, backend e banco, com evidências distintas para cada camada.

## 1. Conflitos: o que foi pedido contra o que já existia

| Pedido | Contrariava o quê | O que foi decidido | Por quê | Registro | Commit/evidência |
|---|---|---|---|---|---|
| Empréstimo imediato sem aprovação | ADR-003, relações e trigger do banco existente | Manter aprovação por Operações/Admin; incluir decisão mínima na prática | Responsável não considera adequado emprestar a bel prazer e quer preservar o controle/modelo | ADR-004; spec 005, regras 3–8 | Decisão confirmada em 06/nov/2026; implementação pendente |
| Três empréstimos | PRD original com três; revisão de 06/nov aceitou cinco | Retornar a três ativos em 09/nov | Responsável reconsiderou volume por pessoa e risco de não devolução/prejuízo | PRD v3; ADR-004 histórico e ADR-008 vigente; CA-E03/E06 | Implementação pendente |
| 14 dias úteis | ADR-003 e constraint de 14 corridos | Adotar 14 úteis após aprovação | Responsável considera mais adequado que corridos | ADR-004; CA-E07/E12 | Nova migration pendente |
| Somente TI-0004/TI-0007 em manutenção | Lista do mesmo enunciado também marca TI-0010 | Manter os três em manutenção | Responsável escolheu a lista completa | Spec 004, inventário e CA-D01 | População pendente |
| Pexels como única fonte | Alteração de orientação pelo responsável | Usar Pixabay como única fonte | Nova orientação para a prática | docs/pratica.md; spec 004 | Skill ainda não criada |
| Verificador corrige teste | Independência exigida no próprio enunciado | Só verificar; principal corrige | Correção própria elimina independência da conferência | docs/verificador.md; papel TOML | Demonstrado na fixture: f26262e → 27b503f |
| Senha literal no script | rules/secrets.md e regra geral da prática | Não copiar credencial ao seed; operador fornece por configuração | Manter segredo fora do código/histórico | docs/pratica.md; regra 8 da spec 004 | Provisionamento pendente |
| Instalar sharp diretamente | ADR-001 e regra de aprovação de dependências | Proposta apresentada; responsável autorizou sharp na etapa da skill | Nome no briefing sozinho não era aprovação; depois houve autorização explícita | ADR-005 | sharp 0.35.5 registrado como devDependency direta |
| Catálogo sem crédito × crédito exigido na seção de fotos | Contradição interna e mudança de provedor | Manifesto com autoria/licença e link discreto de créditos no catálogo | Escolha do responsável após proposta, sem transportar a condição do Pexels | ADR-005 | Manifesto implementado; interface pendente na spec 005 |
| Agente publica dados/imagens por autorizações antigas | Limite mais restritivo da prática | Operador executa escritas em produção nesta prática | Agente prepara e testa localmente | rules/operacao.md → docs/pratica.md | Nenhuma escrita de prática executada |

## 1b. Lacunas: o que foi pedido de forma incompleta

| Spec | O que faltava | Alternativas | Decisão | Motivo | Commit/evidência |
|---|---|---|---|---|---|
| 005 | Definição de dia útil e contagem | Seg–sex; calendário com feriados | Seg–sex sem feriados, iniciar no dia seguinte e manter horário em São Paulo | Confirmado pelo responsável | ADR-004; implementação pendente |
| 004 | Local de retirada | Operações; outro local | Operações nos 12 itens | Confirmado pelo responsável | Spec 004; população pendente |
| 004 | Nome e papel do professor | Colaborador; Operações; Admin | Marcelo Grilo, COLLABORATOR | Confirmado pelo responsável | Spec 004; conta ainda não provisionada por esta prática |
| 005 | Como manter aprovação sem construir toda Operações | Decisão mínima; painel completo | Tela mínima de aprovação/rejeição | Confirmado pelo responsável | Spec 005; implementação pendente |
| 004/005 | Demais lacunas | Ver docs/pratica.md | Não decidido | Não preencher pelo agente | Sem implementação |

## 2. Onde o agente tentou decidir por você

Na calibração do verificador, o principal forneceu um recibo de execução anterior à formatação do teste, assumindo que serviria para a versão atual. O filho comparou hashes e devolveu SEM TESTE/NÃO PRONTA em vez de aceitar essa afirmação. O principal gerou uma nova execução compatível, sem alterar o teste para enfraquecer a regra. Evidências em docs/verificacoes/verificador/calibracao.md, baseline.json e restaurado.json. É um erro real de evidência, não um episódio inventado de decisão de negócio. A escolha de aprovação/limite/prazo foi feita pelo responsável, conforme ADR-004.

## 3. Uma decisão que merece (ou não) um ADR

ADR-004 registra manutenção da aprovação e alteração de limite/prazo. Há alternativas defensáveis e impacto na constraint do banco, nas transações, nos testes e na interface. O ADR-003 permanece como histórico, sem fingir que previa cinco itens/dias úteis desde o começo.

ADR-008 registra a decisão posterior de voltar a três empréstimos ativos em 09/nov/2026. A aprovação e os 14 dias úteis permanecem. Não houve exclusão de histórico, coleta de CPF ou implementação do fluxo nesta revisão documental; a decisão intermediária de cinco foi preservada para a correção.

## 4. A skill imagens-equipamentos

Skill criada em skills/imagens-equipamentos. SKILL.md contém o roteiro e gatilho; references/ separa uso do Pixabay e operação local; assets/ contém as 12 buscas; scripts/ implementa busca/cache, download seletivo, transformação, integridade, manifesto e validação do pacote. Essas partes foram separadas porque técnica/provedor e formato de operação não precisam ocupar o roteiro inteiro, enquanto dimensões e repetição precisam ser verificadas por código.

Código garante WebP 800×600 com bordas, idempotência local, limites de arquivo, exclusividade por ID/hash, créditos e exigência de revisão vinculada aos bytes inspecionados. Adequação da foto, ausência de pessoas/marcas/textos e conteúdo nas telas dependem de inspeção visual registrada; não são provadas por filtros ou pelos testes sintéticos. O script não aprova fotos automaticamente.

A busca inicial retornou 96 candidatas para 12 patrimônios. Na primeira rodada de D03 houve refinamento autorizado e inspeção de originais: dez fotos aceitas, duas lacunas. Recusas reais incluem logos Apple, Canon, Samsung, Logitech e FED; não foram removidos por edição. O responsável permitiu apenas inscrições técnicas de fábrica, divergência explícita da leitura estrita inicial de “sem texto” (ADR-005/spec 004). Histórico com revisor, data e hash em docs/verificacoes/imagens/d03-parcial.json. Na rodada seguinte, o responsável pediu melhorar TI-0003/TI-0004 e confirmou foto de câmera de ação compacta para TI-0012 e ilustração só para TI-0007. As 12 imagens foram preparadas e verificadas localmente (11 fotografias e uma ilustração); reexecução preservou bytes/destinos. Evidências atuais: docs/verificacoes/imagens/d03-final.md, d03-final.json e d03-manifesto.json. Galeria com 12 imagens em http://127.0.0.1:3002/. Não equivale a publicação ou aprovação humana de todo o conjunto.

Scripts oferecem apenas GET ao Pixabay e escrita local; não há cliente Supabase ou upload na skill. Esse limite dos scripts não é alegado como revogação global das permissões da sessão principal; as escritas externas da prática continuam com o operador.

Rodadas independentes e recibos ficam em docs/verificacoes/imagens/. A primeira pediu proveniência de validação e auditoria; a segunda pediu testes explícitos de GET/min_height e revisão inválida, além de conferir o exemplo sem acesso a ambientes reais. O principal acrescentou essas provas, preservando a leitura textual bloqueada de .env; a consulta específica retorna somente flags/hash do exemplo público, sem valores. Terceira rodada: oito critérios ATENDE, PRONTA exclusivamente para D02, conforme rodada-3.md e delegacao.json. D02 passou nove testes de imagens e sete do verificador; D03 acrescentou teste de cache/paginação (dez de imagens passaram). O pacote local D03 de 12 imagens foi validado; publicação segue pendente.

## 5. O subagente verificador

Configurado em `.codex/agents/verificador-spec.toml`, sem cópia Markdown concorrente. O gatilho de fechamento da spec fica em rules/spec-flow.md; AGENTS aponta para o lançador. Este abre sessão CLI separada com sandbox de leitura, sem configuração pessoal, terminal, apps/plugins ou memória, e exige filho com contexto limpo. O filho lê as fontes por MCP local: lista e leitura, mais consulta restrita de metadados do exemplo público acrescentada em D02. Caminhos de ambiente reais, externos, traversal e junctions são recusados por código; a consulta não retorna valores. Sem ferramenta de execução, ele inspeciona testes e recibos do principal, comparando SHA-256 independente dos arquivos atuais. Não executa os testes nem grava/corrige relatórios.

O monolito tem um único verificador para front/backend/banco, com evidência por camada. Falta testar/verificar as implementações 004/005 quando existirem. A restrição não é alegada a partir de texto no TOML: seis testes locais exercitam o MCP, e os metadados das sessões registram read-only no pai e no filho. Em sessão principal irrestrita, esse papel não deve ser lançado diretamente por herança.

## 6. O verificador em ação

Prova do mecanismo, em fixture isolada, concluída em 06/nov/2026:

| Rodada | Resultado | Evidência |
|---|---|---|
| Calibração | Recibo antigo não validou o teste atual; dois SEM TESTE | docs/verificacoes/verificador/calibracao.md e baseline.json |
| Erro plantado — f26262e | Limite 4 em vez de 5: CA-V01 NÃO ATENDE; teste de aprovação removido: CA-V02 SEM TESTE; NÃO PRONTA | docs/verificacoes/verificador/plantado.md e plantado.json |
| Restauração pelo principal — 27b503f | Limite 5 e teste de aprovação restaurados; ambos ATENDE após dois testes locais passarem; PRONTA somente para a fixture | docs/verificacoes/verificador/restaurado.md e restaurado.json |

Delegação nativa, contexto limpo e permissões foram conferidos pelo principal nos registros das sessões, com resumo em delegacao-plantado.json e delegacao-restaurado.json. O verificador não alterou os arquivos; a correção consta do commit do principal. Tabelas finais das specs 004 e 005 continuam pendentes: a demonstração não substitui sua implementação ou seus testes.

## 7. Uma regra sua que esta prática pôs à prova

O contrato anterior permitia operações externas mediante pedido explícito. A prática impõe que o agente não escreva no destino de produção; rules/operacao.md agora aponta para o recorte em docs/pratica.md. A conta local ainda usa o mesmo Supabase da produção, então não é seguro chamar um script de “local” apenas por executá-lo no computador.

## 8. O que ficou de fora e o que faria diferente

Proposta D04 apresentada em c2f4b28 e depois aprovada explicitamente para implementação/testes locais. ADR-006 registrado antes do código; modelo `EquipmentImage`, migration `202611060001_equipment_images` e proteção do Storage implementados. Os 48 testes de PostgreSQL descartável e checks gerais/build passaram. Histórico real de falhas/correções e limites em docs/verificacoes/imagens/d04-execucao.md; recibo em d04-recibo.json. Não houve execução anterior à proposta/aprovação a ser alegada. Schema remoto, conta, bucket, arquivos e produção permanecem sem alteração.

Documentos, infraestrutura do verificador e scripts da skill foram preparados; houve prova em fixture, testes de imagens sintéticas e busca real de candidatas. D03 e manifesto local concluídos; D04 de metadados/proteção implementada e testada localmente. População, conta, migration de prazo da spec 005, funcionalidades das novas specs e publicação seguem pendentes. Devolução, cadastro por interface, tela completa de Operações, convites e autocadastro ficam fora do recorte confirmado. Tag entrega-pratica e push ainda não executados; só marcar a entrega depois das evidências reais.
