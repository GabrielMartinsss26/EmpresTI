# E09 — Apresentação das regras vigentes

Em 09/nov/2026 o responsável autorizou E09 após E08. Plano e arquivos registrados antes do código. Nenhuma nova decisão de negócio: três empréstimos ativos pelo ADR-008, aprovação mantida e 14 dias úteis conforme ADR-004/009. Sem dependência, schema, serviço/API ou publicação.

## Sincronização CA-E11

- Login passa de "dias de prazo" para "dias úteis de prazo", mantendo 3/14, tipografia/tokens e composição desktop.
- Landing substitui "dias corridos" por "dias úteis" e informa contagem do dia útil seguinte à aprovação, sem descontar feriados. Etapa de acompanhamento não promete solicitação de devolução por interface ainda fora do recorte.
- Catálogo já anuncia até três equipamentos e 14 dias úteis após aprovação; indicador continua com exatamente três segmentos e contagem real, sem mudar a regra. Novos asserts de navegador confirmam esses pontos.
- Layout documenta as telas/rotas atuais versus detalhe/cadastro/painel completo/devolução/histórico futuros. Remove prazo antecipado de pedido e corrige manutenção para visível/indisponível, conforme decisões existentes E00/ADR-003. Não implementa funcionalidades futuras.
- PRD explicita a revisão intermediária de cinco como histórica/substituída e a implementação local versus publicação pendente. Prática corrige pendência antiga do DDL já aprovado e diferencia D04 local de D08 publicada.
- Specs de login/landing acompanham o texto; T8 do login concluída localmente, demais pendências de login preservadas. ADRs, propostas aprovadas, evidências antigas e migrations não foram reescritos. Rate limit de cinco e fixture do verificador continuam com cinco, pois não são limite de empréstimos.

## Provas e checks

Testes existentes ampliados com verificações reais de DOM e identificação dos critérios, sem testes de espelho do código-fonte:

- Login: números 3/14, rótulo dias úteis, rodapé; navegação/validação e ausência de scroll em 1440×820, 1366×768 e 1280×720 preservadas. Dois passaram (4,4 s). Login inválido usa resposta interceptada, não autenticação real.
- Showcase: landing pública com 03/14 e dias úteis, sem texto corrente antigo, sem inventário/autenticação; desktop e 390px sem overflow horizontal. Um passou (4,3 s).
- Catálogo: CA-E01/CA-E11 verifica banner três/14 úteis e exatamente três segmentos, além dos 12 itens/fotos/estados. Um passou (15,0 s), com Next/API/PostgreSQL reais isolados, Auth/Storage simulados, sem Supabase. Não é nova publicação ou login real.

`npm test`: 32 testes em oito arquivos. `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build` e `git diff --check` passaram. Capturas login-desktop.png, landing-desktop.png/landing-mobile.png e e07-catalogue.png ficam ignoradas em test-results; capturas desktop conferidas visualmente. Busca em src/app e src/components não encontrou dias corridos/dias de prazo/cinco equipamentos como texto vigente; exit 1 de rg significou ausência esperada, não falha de check.

Build inicial encontrou EPERM do Windows/OneDrive em .next/server/app/operacoes. Diretórios absolutos conferidos dentro do workspace, sem junction/symlink; artefato anterior preservado por Move-Item em .local/e09-build-*, sem exclusão. Build seguinte passou, mantendo aviso pré-existente de depreciação da configuração Prisma em package.json.

Suítes completas de banco/imagens/verificador não foram repetidas: mudança só em texto/documentação/apresentação e asserts existentes, sem alteração nesses caminhos. Os 241 testes de banco da E08 continuam como evidência histórica, não são apresentados como nova execução E09. E10 fará a rodada integral própria.

## Limites e próximo passo

CA-E11 tem prova local; spec 005 inteira NÃO PRONTA. E10 ainda exige verificador independente e prova plantada/restaurada; publicação E11 depende de autorização própria. Sem push, deploy ou escrita remota; E01 não foi publicada no Supabase e conta do professor permanece adiada. Servidor principal reiniciado na porta 3000; login sem sessão HTTP 200. Não afirmar que o texto ou novo fluxo já chegou à produção.
