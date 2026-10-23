# Landing page

O pedido de criar e publicar uma landing page autoriza esta entrega na mesma sessão.

## Escopo e plano

1. Substituir o redirecionamento de `/` por uma apresentação pública do EmpresTI em `src/app/page.tsx`.
2. Manter a identidade escura, Open Sans, Phosphor e ações contornadas dos ADRs existentes, sem novas dependências.
3. Apresentar proposta do produto, etapas de solicitação/aprovação/devolução e regras já aprovadas: três itens, 14 dias a partir da aprovação, bloqueio por atraso e manutenção indisponível.
4. Usar links internos para as seções e ações de acesso a `/login`. Não oferecer cadastro aberto, coleta de contato ou funcionalidades não implementadas.
5. Adaptar a composição da landing a telas estreitas, preservando o login desktop existente.
6. Atualizar os testes de navegação e verificar layout, build, tipos, lint e formatação; publicar no projeto Vercel existente com `APP_MODE=showcase`.

## Critérios de aceitação

- CA-L01: `/` responde com a landing e apresenta título, marca, como funciona e regras.
- CA-L02: ações “Acessar sistema” e “Entrar” levam a `/login`; links de seção levam aos respectivos conteúdos.
- CA-L03: a composição não cria rolagem horizontal em 1440px ou 390px.
- CA-L04: a publicação permanece visual, sem depender de banco; o formulário continua indicando que o login ainda não está disponível.
- CA-L05: a URL de produção mantém a landing na raiz e o login em `/login`.

## Precedência e limites

O pedido atual substitui a decisão anterior de usar o login como entrada pública em `/`. O login continua sendo a primeira tela do sistema autenticado. As regras de identidade, convite, banco e domínio não mudam.

Sem estatísticas de uso, depoimentos ou inventário fictício. O painel ilustrativo representa o processo, não dados reais. Nenhuma migration, commit ou push integra esta entrega.

## Evidências e situação

- Build de produção e checagem TypeScript passaram.
- Lint e formatação passaram.
- Teste do modo visual passou, verificando landing, acesso ao login, ausência de chamadas de autenticação e de rolagem horizontal em 1440px e 390px.
- Capturas desktop e celular foram conferidas em `test-results/landing-desktop.png` e `test-results/landing-mobile.png`.
- A primeira tentativa foi bloqueada por vínculo do autor do commit. Após o usuário confirmar a conexão GitHub/Vercel, o deploy `dpl_48JUKvsFw1QDDwAvr7Djp74JZA7e` terminou como `READY`.
- https://empresti-mauve.vercel.app/ respondeu HTTP 200 com a landing, sem redirecionar; `/login` respondeu HTTP 200 com a demonstração de login.
