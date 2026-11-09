# E07 — Catálogo e Meus empréstimos

Em 09/nov/2026 o responsável autorizou o próximo passo após E06. Plano/arquivos registrados antes do código. Sem nova dependência, alteração de schema, biblioteca de interface, mutação de domínio ou publicação externa. Composição conforme layout/E00; tokens Nocturne/desktop ADR-002, regras ADRs 004/008/009.

## Entrega local

- Catálogo substitui placeholder: sidebar 236px, três colunas, dados tRPC inferidos, busca por nome/patrimônio, categoria, disponíveis, paginação e resumo real com três segmentos. Sem contadores fictícios ou link de Operações antes da E08.
- Cards com fotos D03 4:3 object-contain, sem recortar equipamento, autor/link Pixabay e distinção entre disponível/manutenção/fora de uso/emprestado/pedido pendente. Falha/ausência de imagem tem fallback. Nenhum dado de outro solicitante no catálogo.
- Diálogo nativo com foco inicial, Tab/Shift+Tab contidos, Escape, retorno de foco, retirada e regra de prazo somente após aprovação. Envio usa requests.create, trava síncrona contra repetição mais estado de envio; sucesso/conflito invalidam consultas. Não cria aprovação ou vencimento fictícios.
- /meus-emprestimos protegida no servidor/proxy. Ativos com due_at real em São Paulo e pedidos/decisões em seção separada, incluindo motivo de rejeição como texto. Sem botão Devolver/histórico completo. Indicação visual de data vencida usa instante estável de atualização da consulta; autorização/limite/atraso continuam no servidor.
- Carregamento, vazio, erro com retry e falha de rede em português. Falha no resumo impede habilitar solicitação com dados desconhecidos; limite/atraso exibem motivo. Sidebar reaproveita logout e só aponta para rotas implementadas.
- Imagens já WebP 800×600 usam img nativo para evitar estilos inline. CSP sem unsafe-inline/host curinga; apenas origin público configurado e caminho /storage/v1/object/public/equipamentos/ adicional em img-src. URL valida origem/protocolo, sem credenciais/path/query; caminho de imagem rejeita outro bucket/traversal. Sem novo endpoint/API de imagem.
- Proxy resolve URL/chave públicas em runtime, como permitido pela documentação Next instalada; somente base pública das imagens chega ao componente. Nenhum segredo novo em cliente/configuração versionada.
- useInfiniteQuery do tRPC envia direction: forward: schema de paginação agora aceita somente esse literal opcional, preservando objetos estritos, filtros/isolamento e cursor. Não implementa paginação reversa ou seletor de tenant/pessoa.

## Evidências e natureza dos testes

Quatro testes unitários novos em public-config.test.ts: direção técnica/validação estrita, URL pública sem valores privados, bucket/traversal e data UTC→São Paulo. Total unitário 32.

Nove E2E em catalogue.spec.ts usam Next real separado, tRPC/services reais e PostgreSQL Testcontainers com todas as migrations. Auth/Storage HTTP são simulados e os usuários/dados são sintéticos, sem bypass no código da aplicação. Cookie/JWT da fixture serve apenas ao servidor Auth local; não comprova Supabase Auth real. As 12 fotos locais D03 são servidas se presentes; clone sem esses arquivos usa WebP sintético, sem atribuir a isso revisão/publicação real das imagens. Metadados da fixture são declarados de teste. Ambiente filho sobrescreve os destinos Auth/banco para loopback; não usa banco do deploy.

Cobertura: 12 fotos/créditos e três itens em manutenção; três colunas/236px/sem overflow horizontal/CSP sem violações; busca/filtros/vazio; diálogo/foco/teclado/envio único e um PENDING sem Loan no banco; conflito real provocado por pedido de outra pessoa com atualização da tela sem falso sucesso; teto três/atraso; datas reais/isolamento entre usuários/motivo de rejeição/pedidos sem prazo; falha de imagem/rede com retry; paginação 13 itens sem duplicar; ambas as rotas sem sessão voltam ao login.

Somente a prova de erro visual interrompe transporte de rede e uma imagem; as solicitações bem-sucedidas/conflitos usam respostas reais do service/banco local, sem interceptar sucesso. Cadastro, convites e conta do professor continuam fora desta etapa.

Capturas locais ignoradas: test-results/e07-catalogue.png, e07-dialog.png, e07-my-loans.png, conferidas visualmente. Logs/artefatos do runner ficam em test-results/playwright para preservar capturas entre execuções. Não são telas de produção ou dados reais.

## Correções durante a execução

- Lint recusou Date.now durante render: trocado pelo instante estável dataUpdatedAt da consulta. Callback use do Playwright confundido com hook React foi renomeado provide, sem desativar regra de hooks.
- Primeira rodada E2E encontrou rejeição de direction: forward no schema estrito; corrigido o contrato técnico e criado teste de regressão. Execução interrompida para corrigir, sem registrar os demais casos como aprovados.
- Localizador de teste do select passou a usar nome acessível do combobox. Shift+Tab revelou falha real de contenção de foco; corrigida no diálogo, mantendo a expectativa do teste.
- Teste de retry aguardava um anúncio genérico antes do erro real; agora espera mensagem/botão específicos. Mensagens de transporte normalizadas para português.
- Build teve EPERM do Windows/OneDrive em artefato .next. Remoção foi recusada pela revisão automática; nenhuma exclusão ocorreu. Alternativa reversível: caminho conferido e build anterior movido por Move-Item para .local/e07-build-*, preservado/ignorado. Recompilação passou sem mudar proteção ou configuração de build.
- Runner inicialmente limpou capturas de outra execução. outputDir separado; três cenários de captura repetidos somente para recuperar/conferir os artefatos. Demais falhas acima foram corrigidas antes da conclusão.

## Limites

Checks finais: `npm run test:e2e -- tests/e2e/catalogue.spec.ts --workers=1 --max-failures=1`: nove passaram (21,7 s). Dois testes existentes de login passaram (3,5 s); showcase um (5,7 s). Três cenários de captura reexecutados após separar outputDir passaram (14,6 s). `npm run test:db`: 241/dez arquivos (140,67 s); `npm test`: 32/oito arquivos; imagens dez/verificador sete. Lint/typecheck/format:check/build/diff passaram. Build conserva aviso pré-existente Prisma; nenhum teste reprovado foi contado como sucesso.

E07 cobre a parcela de UI de CA-E01/E02/E03/E09 com evidência local, não declara toda a spec pronta. Tela de aprovação/rejeição E08 e sincronização completa E09 ainda pendentes; verificador integral E10. Sem push, Vercel, atualização do Supabase ou criação da conta adiada do professor.

A migration E01 permanece não publicada: último estado remoto registrado é inicial+D04. Aplicação principal na porta 3000 conserva seu ambiente atual; não afirmar que aprovação/prazo e todas as consultas novas já funcionam nesse destino antes da migração/publicação E11. Não foi executado pedido real para testar. Próximo E08, aguardando autorização própria.
