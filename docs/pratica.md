# Planejamento da prática — 06/nov/2026

Esclarecimento posterior do responsável: os pedidos de ajuda e continuidade ocorreram no contexto de dificuldades de conexão e não expressavam intenção de alterar a regra da prática que reserva a escrita em produção ao operador. Como a restrição não voltou a ser discutida, o agente interpretou uma autorização anterior como aplicável às etapas seguintes e realizou operações em produção. As suítes foram executadas em ambientes controlados antes das publicações; depois houve verificações de integração reais. Menções históricas a exceções nos ADRs 007/010 devem ser lidas com esse esclarecimento; o resultado CA-D07 não foi alterado.

Atualização: a conta do professor antes adiada foi criada após pedido do responsável. Auth e acesso autenticado ao catálogo publicado passaram; zero empréstimos e reexecução sem duplicar. Nova revisão independente classificou CA-D06 ATENDE; CA-D07 continua NÃO ATENDE. Evidências docs/verificacoes/conta-professor-20261110.md e verificador/conta-revisao-integral.md. As menções ao adiamento abaixo preservam o histórico.

Histórico de 07/nov/2026: D01–D07 executadas e D08 de dados/imagens publicada; migration D04 aplicada, 12 imagens/equipamentos publicados, repetição sem duplicação e proteção de escrita anônima confirmadas. Naquele momento a conta ainda estava adiada, e o parecer D08-R2 classificou CA-D06 SEM TESTE e CA-D07 NÃO ATENDE. O estado atual está na atualização acima; o histórico do ADR-007 deve ser lido com o esclarecimento posterior do responsável.

## Fontes e histórico

Situação atual: E00–E11 da spec 005 concluídas, novo prazo/fluxo publicado em 09/nov e revisão independente final com 13 critérios ATENDE (PRONTA). A conta do professor foi criada e conferida em 10/nov; a nova revisão classificou CA-D06 como ATENDE. Spec 004 continua NÃO PRONTA porque CA-D07 não foi atendido. As linhas históricas abaixo preservam a sequência anterior.

Atualização em 09/nov/2026: limite vigente voltou a três ativos por decisão explícita do responsável (ADR-008). Aprovação e prazo permanecem; contratos E00 da spec 005 preparados e aprovados expressamente após apresentação. Nenhuma escrita remota ou alteração do fluxo funcional nesta revisão documental.

- Enunciado preservado em `novas-orientacoes/pratica-sdd-subagentes.html`.
- PRD atualizado e ADR-003 preservado como histórico, com substituição parcial explícita pelo ADR-004.
- Em 06/nov o responsável manteve aprovação e adotou cinco empréstimos, 14 dias úteis e três equipamentos em manutenção. Em 09/nov voltou a três ativos pelo risco/volume por pessoa (ADR-008), mantendo aprovação e prazo. A fala anterior de aceitar empréstimo imediato foi reconsiderada antes da implementação.
- Pixabay substitui Pexels por instrução explícita do responsável. Não afirmar que as condições dos dois provedores são iguais.
- Specs 001 e 002 existentes não são renumeradas; 003 permanece cancelada. Novas funcionalidades: 004-dados-iniciais e 005-solicitar-emprestimo.

## Ordem e entregas

1. Preparar o verificador de specs no harness: contexto limpo, saída comparável por critério, sem corrigir código/testes e sem acesso de escrita em produção. Conectar descoberta no AGENTS e obrigação no spec-flow; não declarar isso configurado antes da prova.
2. Criar a skill imagens-equipamentos conforme ADR-005: Pixabay, 12 fotos distintas, revisão visual, WebP 800×600 com bordas, manifesto de créditos e preparação local para Storage. Repetir não duplica arquivos nem imagens. Preparação não autoriza criar bucket ou publicar.
3. Executar a spec 004: preparar imagens, provisionamento e população idempotente local; o operador publica os dados e imagens após os checks.
4. Executar a spec 005: catálogo, solicitação pendente, aprovação/rejeição mínima e Meus empréstimos; concorrência, isolamento e autorização testados em banco descartável.
5. Registrar rodadas reais e erro plantado/restaurado em commits distintos; preencher ENTREGA.md com evidências. Tag e push somente na entrega autorizada pelo responsável, não por existir um comando no enunciado.

## Produção e segredos nesta prática

Em 09/nov/2026 o responsável também delegou a E11 após a conclusão local E10; ADR-010 registra somente a publicação da migration E01 já aprovada e aplicação no Supabase/Vercel existentes, com validação real separada. Não amplia D08, não autoriza push/tag/criação de conta e não satisfaz isolamento global da sessão. Conta do professor continua adiada. Esta exceção posterior não altera as autorizações históricas abaixo.

O agente prepara os artefatos e os verifica localmente. Escritas no banco, Auth ou Storage de produção são executadas pelo operador. Autorizações anteriores de integração/publicação não se estendem à execução desta prática. Dev ainda aponta para o mesmo Supabase de produção: executar scripts apenas em ambiente descartável, sem herdar URLs ou credenciais remotas. O verificador precisa de restrição efetiva no harness; texto de proibição sozinho não comprova isolamento.

Exceção posterior, solicitada explicitamente em 07/nov/2026: o responsável delegou ao agente a publicação D08 no projeto Supabase existente; ADR-007 registra a mudança antes da execução. Conta do professor adiada por resposta explícita. Suíte de banco permanece exclusivamente descartável; integração D08 é separada. Esta exceção não satisfaz CA-D07, não altera o parecer D07 e não autoriza push/deploy Vercel.

Senha da conta de correção e chave Pixabay não entram em código, fixture, manifesto, documentação ou logs. Registrar apenas os nomes das variáveis após definir os scripts. Não copiar a senha demonstrativa do enunciado para o seed. O material original é uma fonte histórica, não um script executável de provisionamento.

## Pontos ainda não decididos

| Ponto | Situação |
|---|---|
| Biblioteca de processamento | sharp 0.35.5 direto de desenvolvimento, aprovado na proposta da skill; ADR-005 |
| Formato final e enquadramento | WebP 800×600, foto inteira com bordas; parâmetros em ADR-005 |
| Bucket, caminhos, metadados e policies de Storage | ADR-006/D04 primeiro testados localmente, sem escrita externa naquela fase; depois D08 publicou dados/imagens por delegação específica ADR-007. Caminhos equipamentos / suporte_ti/patrimonio.webp. Essa exceção não autoriza outras migrations/publicações |
| Crédito visível no catálogo com Pixabay | Link discreto aprovado; manifesto registra autor/origem/licença e E07 implementou a apresentação local, com evidências próprias |
| Provisionamento de conta já existente ou inativa | Confirmado em 07/nov/2026 após esclarecimento: criar ausentes, reutilizar ativos compatíveis sem trocar senha; interromper por bloqueio/desativação, divergência ou empréstimos registrados; regra 9 da spec 004. D06 local usa identidade simulada, sem login real |
| Política de reexecução sobre equipamentos modificados/em uso | Confirmada em 07/nov/2026: qualquer conflito interrompe o lote inteiro; criar ausentes e reutilizar ativos idênticos, preservando IDs, timestamps e campos não informados; detalhes na regra 7 da spec 004 |
| DDL de prazo e preservação de empréstimos existentes | Proposta E01 86d8127 depois aprovada, ADR-009 e migration versionada testada somente em containers; legado preservado sem recalcular datas. Não publicada no Supabase |
| Configuração efetiva do verificador e seus comandos permitidos | Definida e provada em D01: lançador separado, sem terminal, MCP com lista/leitura; detalhes em docs/verificador.md |

## Fontes do Pixabay consultadas

Consulta em 06/nov/2026: https://pixabay.com/api/docs/ e https://pixabay.com/service/license-summary/.
Endpoint `https://pixabay.com/api/`, chave privada de configuração, cache de buscas por 24 horas; baixar as imagens para uso permanente, sem hotlink permanente das URLs da API. Registrar ID, página de origem, autor e licença. Filtros não substituem revisão visual de pessoas, marcas, texto e telas.

## Critério para concluir a documentação

D03 concluída localmente: 12 imagens distintas em WebP 800×600; preparar/verificar e reexecução passaram. TI-0003/TI-0004 substituídos por foco no notebook. Responsável confirmou foto de câmera de ação compacta para TI-0012 e ilustração só para TI-0007; conjunto de 11 fotografias e uma ilustração. ADR-005/spec 004 registram as exceções. Evidências em docs/verificacoes/imagens/d03-final.md e d03-manifesto.json; parcial preservado como histórico. Galeria http://127.0.0.1:3002/ atualizada; nenhum upload.

Specs com critérios identificados, planos e tarefas; histórico das escolhas visível; lacunas marcadas sem inventar decisões; nenhum comportamento implementado declarado como pronto. ENTREGA.md permanece rascunho até conter evidências reais.
