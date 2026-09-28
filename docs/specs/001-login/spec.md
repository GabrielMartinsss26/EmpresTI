# Spec — Login

Status: rascunho; não aprovado para implementação enquanto houver perguntas em aberto que alterem o comportamento.

## Escolha da primeira funcionalidade

O login vem primeiro porque identifica a pessoa antes de o sistema mostrar os empréstimos dela ou liberar as ações de Colaborador e Operações.

## Objetivo

Permitir que uma pessoa convidada entre no EmpresTI com e-mail e senha e seja identificada pelo sistema.

## Vínculo

- PRD: “Login; cada pessoa vê os próprios empréstimos”.
- ADR-001: Supabase Auth com e-mail e senha; cadastro fechado por convite; integração com `@supabase/ssr`; sessão em cookie `httpOnly`; renovação pelo middleware do Next; autorização pelos middlewares do tRPC; Server Actions não usadas.
- Layout: tela `01 · Login`, rota `/login`, modo escuro e referência desktop de 1440 × 820.

## Decisões já fechadas

1. A tela inicial do sistema é a tela de login.
2. A tela de login é feita para desktop, usando 1440 × 820 como referência do layout.
3. O gerenciador de pacotes do projeto será npm. Esta é uma restrição para o plano, não um comportamento da funcionalidade.
4. O acesso usa e-mail e senha.
5. O cadastro é fechado e acontece somente por convite de administrador.
6. A sessão fica em cookie `httpOnly` escrito pelo `@supabase/ssr`, nunca em `localStorage`.
7. Não existe modo claro nem alternador de tema.

## Regras

1. Quando uma pessoa não autenticada abre o sistema, o sistema deve apresentar a tela de login.
2. A tela deve ter duas áreas: hero de 560px à esquerda e formulário ocupando o restante à direita.
3. O hero deve mostrar a marca EmpresTI, uma apresentação curta do sistema, os números “3 itens por pessoa” e “14 dias de prazo” e o rodapé “Operações · v1”.
4. O formulário deve mostrar o título “Entrar”, um subtítulo, os campos “E-mail” e “Senha”, o botão contornado “Entrar” com ícone de avanço e uma nota de suporte.
5. O campo de senha deve ocultar os caracteres digitados.
6. A tela deve usar somente o modo escuro, a paleta, a tipografia, os espaçamentos, os raios e os estados de foco definidos em `docs/layout.md`.
7. O foco de teclado deve ficar visível em campos, links e botão.
8. A tela não deve oferecer cadastro aberto.
9. A autenticação deve aceitar somente contas criadas pelo fluxo fechado de convite.
10. A aplicação não deve guardar token de sessão em armazenamento legível por JavaScript.
11. A implementação não deve usar Server Actions como caminho de autenticação.

## Critérios de aceitação

- CA-01 · Ao abrir o sistema sem sessão autenticada, a pessoa vê a tela de login como tela inicial.
- CA-02 · Em uma viewport desktop de 1440 × 820, a tela apresenta o split de 560px para o hero e o restante para o formulário, sem rolagem horizontal.
- CA-03 · O hero apresenta a marca EmpresTI, os indicadores “3 itens por pessoa” e “14 dias de prazo” e o rodapé “Operações · v1”.
- CA-04 · O formulário apresenta os campos de e-mail e senha, o botão “Entrar” e a nota de suporte; o campo de senha não exibe os caracteres digitados.
- CA-05 · A tela não apresenta ação de cadastro, reserva futura, notificação por e-mail ou importação de planilha.
- CA-06 · Ao navegar somente por teclado, todos os controles interativos recebem foco visível conforme `docs/layout.md`.
- CA-07 · A tela permanece somente em modo escuro e não apresenta alternador de tema.
- CA-08 · Nenhum token ou segredo de autenticação é gravado em `localStorage`, `sessionStorage` ou variável com prefixo `NEXT_PUBLIC_`.
- CA-09 · A sessão autenticada é armazenada em cookie `httpOnly` e sua renovação acontece pelo middleware do Next.

Os critérios de sucesso, falha e redirecionamento do envio do formulário serão adicionados depois das respostas às perguntas em aberto.

## Fora de escopo / não decidido

### Fora de escopo desta spec

- Cadastro aberto de usuário.
- SSO corporativo.
- Catálogo, solicitação de empréstimo, devolução e telas de Operações.
- Reserva com data futura, notificação por e-mail e importação da planilha atual.
- Layout para celular ou tablet.
- Alteração do limite de três itens ou do prazo de 14 dias.

### Não decidido

- Texto exato do título e do subtítulo do hero.
- Texto exato do subtítulo do formulário e da nota de suporte.
- Destino depois de uma autenticação válida.
- Mensagem e comportamento depois de credenciais inválidas.
- Duração da sessão.
- Comportamento de uma pessoa autenticada que abre `/login`.
- Comportamento de uma pessoa não autenticada que tenta abrir uma rota protegida.
- Comportamento da raiz `/` em relação à rota `/login`.
- Estado visual do formulário enquanto a autenticação está em andamento.
- Regras de validação local para e-mail e senha antes do envio.
- Limites e resposta do rate limit no login.
- Se recuperação de senha faz parte da primeira versão.
- Se logout faz parte desta funcionalidade ou de uma spec posterior.
- Se o endpoint `/health`, quando existir, permanece público.

## Perguntas em aberto

### Negócio

1. Depois de entrar com credenciais válidas, a pessoa vai para o Catálogo, para Meus empréstimos ou para uma tela diferente conforme o papel?
2. Qual texto deve aparecer quando o e-mail ou a senha estiverem errados? A mensagem deve ser a mesma para os dois casos?
3. O que a pessoa deve fazer quando ainda não recebeu convite ou quando a conta estiver desativada?
4. Qual é o texto exato do título e do subtítulo do hero?
5. Qual é o texto exato do subtítulo do formulário e da nota de suporte? A nota aponta para qual canal de atendimento?
6. Recuperação de senha entra na primeira versão ou fica fora de escopo?
7. Logout pertence à spec de login ou terá uma spec separada?

### Técnica com comportamento observável

1. Quanto tempo a sessão dura antes de exigir novo login?
2. Uma pessoa autenticada que abre `/login` deve ser redirecionada? Para onde?
3. Uma pessoa não autenticada que abre uma rota protegida deve ser redirecionada para `/login` e voltar à rota original depois de entrar, ou sempre seguir para o destino padrão?
4. A raiz `/` renderiza o login ou redireciona para `/login`?
5. Durante o envio, o botão fica desabilitado e troca o texto? Qual texto deve aparecer?
6. Quais erros são validados antes do envio: campo vazio, formato de e-mail e tamanho mínimo da senha?
7. Depois de quantas tentativas o rate limit bloqueia o login, por quanto tempo e qual mensagem aparece?
8. O endpoint `/health`, quando for criado pelo andar zero, deve continuar acessível sem autenticação?

### Fora de escopo a confirmar

1. O projeto precisa apenas da referência desktop de 1440 × 820 ou deve definir também um intervalo mínimo e máximo de largura para desktop?
2. Login social, autenticação multifator e opção “lembrar de mim” ficam fora da primeira versão?

## Contrato afetado

- Tela `/login`.
- Entrada inicial de uma pessoa não autenticada no sistema.
- Sessão de autenticação em cookie `httpOnly`.
- Proteção das rotas `/catalogo`, `/catalogo/:patrimonio`, `/meus-emprestimos`, `/operacoes/emprestimos` e `/operacoes/equipamentos/novo`.

Não pode mudar sem revisão desta spec:

- O cadastro continua fechado por convite.
- A sessão não pode migrar para `localStorage` ou `sessionStorage`.
- A interface continua somente em modo escuro.
- A tela inicial continua sendo a de login.

## O que o andar zero já garante

Nada ainda. O repositório não possui aplicação, comandos documentados, `docs/andar-zero.md` nem evidência de execução dos critérios AZ.

Antes da implementação desta spec, o andar zero ainda precisa provar:

- AZ-02 · a aplicação conecta no banco e falha de forma clara sem conexão.
- AZ-03 · existe uma migration versionada e aplicável.
- AZ-05 · o front consome o backend.
- AZ-06 · existe uma suíte de testes executável por um comando.

Esses critérios não serão duplicados como comportamento do login depois que estiverem comprovados pelo andar zero.
