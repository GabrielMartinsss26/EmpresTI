# Correção do build do Pull Request — 10/nov/2026

O job do GitHub Actions falhou em `npm run build` ao processar Open Sans por `next/font/google` e Turbopack; as variáveis fictícias de CI já estavam definidas. A mensagem coincide com um problema relatado no Next.js: https://github.com/vercel/next.js/issues/99114. A associação é diagnóstico provável, não prova da causa interna exata da resposta do Google naquela execução.

Após autorização do responsável, Open Sans passou a ser carregada por `next/font/local` de `src/app/fonts/OpenSans-Variable.ttf`, preservando variável CSS, pesos usados 400/600 e `display: swap`, conforme ADR-002. Arquivo oficial de https://github.com/google/fonts/tree/main/ofl/opensans; licença SIL OFL 1.1 incluída ao lado. SHA-256: `36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878`. Nenhuma dependência ou regra de produto foi alterada.

Verificações locais: `npm test` 41; `npm run lint`, `npm run typecheck`, `npm run format:check` e `npm run build` passaram. O build usou os mesmos valores fictícios de ambiente do workflow. `npm run test:verificador` sete e `npm run test:imagens` dez passaram. `npm run test:e2e -- --workers=1` passou 23 cenários e pulou showcase por modo; `APP_MODE=showcase npm run test:e2e -- tests/e2e/showcase.spec.ts --workers=1` passou esse cenário separadamente. E2E de catálogo/operações usaram PostgreSQL descartável e Auth/Storage simulados. A suíte de banco isolada não foi repetida por não haver alteração de schema, serviços ou regras; seus resultados anteriores permanecem em E10.

O build local não substitui o resultado do novo job GitHub. O Push de correção atualiza somente a branch dev e o Pull Request já aberto; merge e deploy dependem de ações e verificações separadas.
