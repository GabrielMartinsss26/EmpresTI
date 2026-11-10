# E11 — Publicação e integração real

Em 09/nov/2026 o responsável autorizou a próxima etapa após a E10. ADR-010 registra a delegação antes da execução. Destinos existentes: Supabase gverauqgerwjwwjkoybl e Vercel empresti, domínio https://empresti-mauve.vercel.app. Conta do professor continua adiada; nenhum push, tag, merge ou novo projeto.

## Execução

1. Confirmados o projeto vinculado, autenticação da CLI Vercel 64.5.0 e as quatro variáveis Production por nomes. Nenhum valor secreto foi exportado/impresso ou enviado como argumento.
2. Tentativa local de leitura retornou P1001 na conexão direta e no Session Pooler; testes TCP 5432/6543 expiraram, mas HTTPS Supabase respondeu 200 com cadastro público fechado e /health publicado respondeu 200. Diagnóstico não foi tratado como falha de senha nem corrigido alterando credenciais.
3. Registrado no plano o executor scripts/publicar-e11.mjs e seus testes de guardas. O build valida destino, execução explícita em Vercel Production, exatamente três migrations aprovadas e checksums anteriores. Deriva o Session Pooler do DATABASE_URL existente, exige TLS e usa Prisma Migrate; não amplia o publicador D08.
4. Nove testes novos de guardas passaram, total 41 unitários. Primeiro typecheck falhou por diretiva TypeScript na linha errada do import ESM; corrigida a importação no teste, sem reduzir guardas. Unitários/lint/tipos/formatação repetidos e aprovados.
5. Dry run Vercel confirmou exclusão de ambientes reais, .git, .local, resultados, aulas e dependências. Aplicação e SQL estavam idênticos aos hashes E10. Configuração temporária .local/e11-vercel.json mandou executar migration seguida de build, somente neste deploy.
6. Deploy Production com --skip-domain. Executor real na Vercel leu migrations/contagens/fingerprints, aplicou somente 202611090001_loan_due_rules e confirmou preservação das nove tabelas observadas. Antes havia inicial+D04; depois três migrations aplicadas e default BUSINESS_14_SP. Não havia empréstimos anteriores. Sem seed, alteração de fotos, conta ou senha.
7. Prisma saiu com código 0; recibo historyPreserved=true. Build Next completo terminou e deploy dpl_3aSE1YQFhNGrtrWi224RgkAtmrv4 ficou READY. Só então foi promovido ao domínio principal. URL exclusiva empresti-ftfhrfeoz-empresta-ai.vercel.app.

## Conferência real

Browser cua_repl, sem interceptação/mocks, login com conta existente do responsável e acesso permitido a Operações. Catálogo exibiu 12 itens; TI-0004/TI-0007/TI-0010 em manutenção, sem ação. As 12 imagens carregaram 800×600; seus URLs foram capturados do DOM real e 12 GETs públicos tiveram SHA-256 idêntico ao manifesto D03.

TI-0008 foi usado para a integração: primeiro pedido pendente às 17:20, zero ativos; rejeição com motivo de validação persistiu no histórico e liberou novo pedido. Segundo pedido às 17:21 aprovado na tela de Operações. Após recarregar, Meus empréstimos mostrou um ativo e os dois pedidos (rejeitado/aprovado) separados. Vencimento exibido 27/nov/2026 17:21; atributo datetime 2026-11-27T20:21:51.227Z. Catálogo passou a Emprestado, desabilitado, com resumo um de três.

O empréstimo de validação TI-0008 permanece na conta do responsável; não foi apagado, devolvido por SQL ou confundido com retirada física. Logout confirmado; catálogo, Meus empréstimos e Operações voltaram ao login sem sessão. Resolução desktop 1440×820 conferida e override restaurado. Captura local test-results/e11-production.png; hash e DOM sanitizado estão no recibo de integração, sem senha/cookies/tokens. Uma captura intermediária ainda estava no catálogo durante navegação; não foi usada como prova de Meus empréstimos. Registro definitivo aguardou URL/estado corretos.

## Evidências e limites

Recibo docs/verificacoes/e11-integracao.json reúne deploy/migration, fingerprints, HTTP, imagens, DOM e sequência observada. docs/verificacoes/e11-evidencias.json reúne checks novos e hashes; evidências E10 comprovam banco descartável, concorrência, rollback, isolamento e mecanismo independente. Código de produto/schema não mudou desde E10; não se repete a suíte de banco contra Supabase. Publicação não comprova isolamento global nem conclui spec 004.

Primeira revisão E11 interrompida por limite de uso do cliente em 09/nov/2026, código de saída 1, sem parecer final; não foi tratada como aprovação/reprovação técnica. Retomada em 10/nov/2026 confirmou mesmo deploy READY e novo login real/catalogo sem repetir mutações. O responsável esclareceu que o problema de ontem não se repetiu. Nova revisão isolada concluiu CA-E01–CA-E13 ATENDE: PRONTA. Parecer original e delegação em verificador/e11-integral-r2.md e e11-delegacao-integral-r2.json. Relatórios E10/E11, recibos e snapshots permanecem históricos, sem reescrita. Atualizados somente estados/continuidade e pendência temporal do PRD após o parecer; e11-prd-revisado.md preserva os bytes conferidos.
