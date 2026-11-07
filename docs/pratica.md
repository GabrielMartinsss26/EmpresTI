# Planejamento da prática — 06/nov/2026

Status: D01–D05 concluídas localmente até 07/nov/2026. A proposta D04 foi apresentada em c2f4b28 e depois aprovada; ADR-006 e nova migration de imagens/proteção implementados. D05 criou quatro categorias, 12 equipamentos e 12 referências em container descartável, com reexecução sem mudanças; 73 testes de banco totais e checks gerais/build passaram. Evidências em `docs/verificacoes/verificador/` e `docs/verificacoes/imagens/d05-execucao.md`. Nenhum schema remoto, conta ou recurso de produção foi alterado nesta prática. Conta, publicação e empréstimos ainda aguardam suas tarefas e revisões.

## Fontes e histórico

- Enunciado preservado em `novas-orientacoes/pratica-sdd-subagentes.html`.
- PRD atualizado e ADR-003 preservado como histórico, com substituição parcial explícita pelo ADR-004.
- A decisão final do responsável mantém aprovação e adota cinco empréstimos, 14 dias úteis e três equipamentos em manutenção. A fala anterior de aceitar empréstimo imediato foi reconsiderada antes da implementação.
- Pixabay substitui Pexels por instrução explícita do responsável. Não afirmar que as condições dos dois provedores são iguais.
- Specs 001 e 002 existentes não são renumeradas; 003 permanece cancelada. Novas funcionalidades: 004-dados-iniciais e 005-solicitar-emprestimo.

## Ordem e entregas

1. Preparar o verificador de specs no harness: contexto limpo, saída comparável por critério, sem corrigir código/testes e sem acesso de escrita em produção. Conectar descoberta no AGENTS e obrigação no spec-flow; não declarar isso configurado antes da prova.
2. Criar a skill imagens-equipamentos conforme ADR-005: Pixabay, 12 fotos distintas, revisão visual, WebP 800×600 com bordas, manifesto de créditos e preparação local para Storage. Repetir não duplica arquivos nem imagens. Preparação não autoriza criar bucket ou publicar.
3. Executar a spec 004: preparar imagens, provisionamento e população idempotente local; o operador publica os dados e imagens após os checks.
4. Executar a spec 005: catálogo, solicitação pendente, aprovação/rejeição mínima e Meus empréstimos; concorrência, isolamento e autorização testados em banco descartável.
5. Registrar rodadas reais e erro plantado/restaurado em commits distintos; preencher ENTREGA.md com evidências. Tag e push somente na entrega autorizada pelo responsável, não por existir um comando no enunciado.

## Produção e segredos nesta prática

O agente prepara os artefatos e os verifica localmente. Escritas no banco, Auth ou Storage de produção são executadas pelo operador. Autorizações anteriores de integração/publicação não se estendem à execução desta prática. Dev ainda aponta para o mesmo Supabase de produção: executar scripts apenas em ambiente descartável, sem herdar URLs ou credenciais remotas. O verificador precisa de restrição efetiva no harness; texto de proibição sozinho não comprova isolamento.

Senha da conta de correção e chave Pixabay não entram em código, fixture, manifesto, documentação ou logs. Registrar apenas os nomes das variáveis após definir os scripts. Não copiar a senha demonstrativa do enunciado para o seed. O material original é uma fonte histórica, não um script executável de provisionamento.

## Pontos ainda não decididos

| Ponto | Situação |
|---|---|
| Biblioteca de processamento | sharp 0.35.5 direto de desenvolvimento, aprovado na proposta da skill; ADR-005 |
| Formato final e enquadramento | WebP 800×600, foto inteira com bordas; parâmetros em ADR-005 |
| Bucket, caminhos, metadados e policies de Storage | ADR-006 aprovado e D04 implementada/testada localmente: `equipment_images` e guard restritivo de Storage; manifesto mantém equipamentos / suporte_ti/patrimonio.webp. Bucket/publicação de produção continuam com o operador; nada criado externamente |
| Crédito visível no catálogo com Pixabay | Link discreto de créditos aprovado na proposta; manifesto registra autor/origem/licença; implementação visual na spec 005 |
| Provisionamento de conta já existente ou inativa | Não decidido; não redefinir senha/reativar silenciosamente |
| Política de reexecução sobre equipamentos modificados/em uso | Confirmada em 07/nov/2026: qualquer conflito interrompe o lote inteiro; criar ausentes e reutilizar ativos idênticos, preservando IDs, timestamps e campos não informados; detalhes na regra 7 da spec 004 |
| DDL de prazo e preservação de empréstimos existentes | Não decidido; SQL e impacto devem ser aprovados antes da migration |
| Configuração efetiva do verificador e seus comandos permitidos | Definida e provada em D01: lançador separado, sem terminal, MCP com lista/leitura; detalhes em docs/verificador.md |

## Fontes do Pixabay consultadas

Consulta em 06/nov/2026: https://pixabay.com/api/docs/ e https://pixabay.com/service/license-summary/.
Endpoint `https://pixabay.com/api/`, chave privada de configuração, cache de buscas por 24 horas; baixar as imagens para uso permanente, sem hotlink permanente das URLs da API. Registrar ID, página de origem, autor e licença. Filtros não substituem revisão visual de pessoas, marcas, texto e telas.

## Critério para concluir a documentação

D03 concluída localmente: 12 imagens distintas em WebP 800×600; preparar/verificar e reexecução passaram. TI-0003/TI-0004 substituídos por foco no notebook. Responsável confirmou foto de câmera de ação compacta para TI-0012 e ilustração só para TI-0007; conjunto de 11 fotografias e uma ilustração. ADR-005/spec 004 registram as exceções. Evidências em docs/verificacoes/imagens/d03-final.md e d03-manifesto.json; parcial preservado como histórico. Galeria http://127.0.0.1:3002/ atualizada; nenhum upload.

Specs com critérios identificados, planos e tarefas; histórico das escolhas visível; lacunas marcadas sem inventar decisões; nenhum comportamento implementado declarado como pronto. ENTREGA.md permanece rascunho até conter evidências reais.
