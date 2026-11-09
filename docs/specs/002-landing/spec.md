# Landing page

O pedido de criar e publicar uma landing page autoriza esta entrega na mesma sessão.

## Escopo e plano

1. Substituir o redirecionamento de `/` por uma apresentação pública do EmpresTI em `src/app/page.tsx`.
2. Manter a identidade escura, Open Sans, Phosphor e ações contornadas dos ADRs existentes, sem novas dependências.
3. Apresentar proposta do produto, etapas de solicitação/aprovação/uso e regras vigentes: três empréstimos ativos, 14 dias úteis após aprovação (seg–sex, sem descontar feriados, a partir do dia útil seguinte), bloqueio por atraso e manutenção indisponível. Não prometer botão de devolução no recorte da spec 005.
4. Usar links internos para as seções e ações de acesso a `/login`. Não oferecer cadastro aberto, coleta de contato ou funcionalidades não implementadas.
5. Adaptar a composição da landing a telas estreitas, preservando o login desktop existente.
6. Atualizar os testes de navegação e verificar layout, build, tipos, lint e formatação; publicar no projeto Vercel existente com `APP_MODE=showcase`.

## Critérios de aceitação

- CA-L01: `/` responde com a landing e apresenta título, marca, como funciona e regras. E09/CA-E11: três ativos e 14 dias úteis após aprovação; não anunciar cinco ativos ou dias corridos como regra atual.
- CA-L02: ações “Acessar sistema” e “Entrar” levam a `/login`; links de seção levam aos respectivos conteúdos.
- CA-L03: a composição não cria rolagem horizontal em 1440px ou 390px.
- CA-L04: a landing permanece pública sem consultar dados de inventário. Em `APP_MODE=showcase`, o login é desabilitado; na produção conectada, o formulário usa a autenticação da spec 001.
- CA-L05: a URL de produção mantém a landing na raiz e o login em `/login`.

## Precedência e limites

O pedido atual substitui a decisão anterior de usar o login como entrada pública em `/`. O login continua sendo a primeira tela do sistema autenticado. As regras de identidade, convite, banco e domínio não mudam.

Sem estatísticas de uso, depoimentos ou inventário fictício. O painel ilustrativo representa o processo, não dados reais. Nenhuma migration, commit ou push integra a entrega original descrita abaixo. E09 altera somente apresentação local na tarefa autorizada da spec 005; commits locais seguem rules/operacao.md e publicação continua pendente.

## Evidências e situação

- Build de produção e checagem TypeScript passaram.
- Lint e formatação passaram.
- Teste do modo visual passou, verificando landing, acesso ao login, ausência de chamadas de autenticação e de rolagem horizontal em 1440px e 390px.
- Capturas desktop e celular foram conferidas em `test-results/landing-desktop.png` e `test-results/landing-mobile.png`.
- A primeira tentativa foi bloqueada por vínculo do autor do commit. Após o usuário confirmar a conexão GitHub/Vercel, o deploy `dpl_48JUKvsFw1QDDwAvr7Djp74JZA7e` terminou como `READY`.
- https://empresti-mauve.vercel.app/ respondeu HTTP 200 com a landing, sem redirecionar; `/login` respondeu HTTP 200 com a demonstração de login.

## E09 — sincronização local da apresentação

Em 09/nov/2026 a tarefa E09 da spec 005 atualizou o prazo para 14 dias úteis e preservou três ativos/aprovação. Assert de navegador verifica números/rótulos e ausência do texto antigo; evidências em docs/verificacoes/e09-apresentacao.md. Não foi feito novo deploy, e as evidências históricas acima não provam a publicação do novo texto.
