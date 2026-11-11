# Handoff — 10/nov/2026

- Correção CI autorizada: Open Sans oficial local via next/font/local, licença e fonte em src/app/fonts; build com valores fictícios, 41 unitários, lint/tipos/formatação, sete verificador, dez imagens, 23 E2E e showcase separado passaram. docs/verificacoes/ci-fonte-local-20261110.md. Push da correção para dev autorizado; acompanhar o job do PR antes do merge.

- Branch dev; E11 concluída e spec 005 PRONTA, parecer independente verificador/e11-integral-r2.md: CA-E01–CA-E13 ATENDE.
- Publicação delegada pelo responsável (ADR-010); sem push/tag/merge ou habilitar CI. Depois, responsável autorizou criar a conta do professor.
- Migration E01 aplicada em 09/nov/2026 via Prisma Migrate no build Vercel; inicial+D04 intactas, nove tabelas com contagens/fingerprints preservados.
- Deploy dpl_3aSE1YQFhNGrtrWi224RgkAtmrv4 READY/promovido; https://empresti-mauve.vercel.app/login.
- Portas PostgreSQL locais 5432/6543 expiraram/P1001; HTTPS e produção saudáveis. Session Pooler usado no build, sem mudar credenciais externas.
- scripts/publicar-e11.mjs exige destino/Vercel Production/aplicar explícitos, três migrations/checksums e preservação; não ampliar D08.
- .local/e11-vercel.json foi configuração temporária deste deploy; não executar publicação remota de novo sem autorização própria.
- Nove testes novos/41 unitários, lint/tipos/formatação passaram; build completo remoto passou. Primeiro typecheck do teste corrigido e repetido.
- src/ e prisma/ idênticos à E10. Banco 241/E2E 24/imagens 10/verificador 7 são provas E10; nove catálogo estritos reexecutados naquela etapa.
- Integração real com conta própria: login, 12 imagens por hash, manutenção, pedir/rejeitar/pedir/aprovar, persistência, logout e proteção de rotas.
- TI-0008 permanece ativo como empréstimo de validação na conta do responsável; vence 27/nov/2026 17:21. Não apagar/devolver por SQL.
- Recibos docs/verificacoes/e11-integracao.json/e11-evidencias.json; relato e11-publicacao.md; fontes/snapshots/parecer preservados.
- Primeira revisão E11 parou por limite de uso, sem parecer; registro e11-tentativa-interrompida.json. Nova revisão real teve contexto limpo/read-only/never.
- Retomada 10/nov: mesmo deploy READY, login/catalogo funcionando; usuário esclareceu que não há erro atual. Nenhuma nova mutação de empréstimo.
- PRD/prática/ENTREGA/README/producao/spec/plan/tasks/AGENTS atualizados só depois de preservar snapshots e pareceres originais.
- Conta do professor criada em 10/nov: COLLABORATOR ativo, Auth e GET autenticado /catalogo 200, zero empréstimos; reexecução zero criações. Nova revisão conta-revisao-integral.md: CA-D06 ATENDE, CA-D07 NÃO ATENDE e spec 004 permanece NÃO PRONTA. Senha era compartilhada na turma segundo o responsável; valor removido localmente do enunciado, mas permanece no histórico remoto.
- Futuras funcionalidades fora da spec 005: devolução, convites, cadastro por UI e painel completo; não iniciar sem spec/autorização.
- Três ativos ADR-008; aprovação mantida; 14 úteis seg–sex sem descontar feriados/São Paulo ADR-004, versão ADR-009.
- Snapshot visual test-results/e11-production.png; nova captura e11-production-20261110.png, ignoradas; aba produção deixada aberta.
- Três HTMLs não rastreados em Aulas/ são do usuário; fora dos commits. Ambientes reais ignorados e sem credenciais nas evidências.
