# Spec — Cadastro de acesso

Status: cancelada em 05/nov/2026 por decisão do usuário. Autocadastro não será implementado; permanece o cadastro fechado por convite do ADR-001. O fluxo administrativo de convites será tratado futuramente em outra spec.

O conteúdo abaixo é uma proposta histórica, sem requisitos ou critérios vigentes. Não autoriza criar `/cadastro` nem adicionar botão de autocadastro ao login.

## Objetivo

Permitir que a pessoa crie seu login a partir de uma ação de cadastro na tela de entrada.

## Vínculo

- Pedido do usuário em 05/nov/2026: botão de cadastro no login e tela semelhante para criação de acesso.
- `docs/PRD.md`: identificação dos usuários e acesso aos próprios empréstimos.
- `docs/adr/001-stack.md`: Supabase Auth, tRPC, Zod, React Hook Form e cadastro fechado por convite.
- `docs/adr/002-design-system.md`: modo escuro, tipografia, controles e identidade visual.
- `docs/adr/003-modelo-de-dados.md`: profiles, memberships e papéis.

## Regras da proposta cancelada

1. O login terá uma ação para abrir o cadastro.
2. A tela de cadastro seguirá a identidade e a composição visual do login.
3. A pessoa poderá criar suas próprias credenciais.
4. A navegação de volta à landing e ao login deve continuar disponível.

## Proposta para revisão

- Rota `/cadastro`, com nome, e-mail, senha e confirmação de senha.
- Departamento opcional, conforme o modelo existente.
- Papel inicial `COLLABORATOR`, definido pelo servidor; nenhum campo permite escolher papel ou tenant.
- Tenant inicial `suporte_ti`, resolvido no servidor.
- Confirmação de e-mail antes de permitir acesso.
- Reutilizar controles, validação compartilhada Zod, tRPC e Supabase Auth.
- Senha armazenada somente pelo provedor de identidade.

Esses pontos são propostas; não substituem decisões vigentes sem revisão.

## Critérios da proposta cancelada

- CA-C01 · A ação “Cadastrar” no login abre a tela de criação de acesso.
- CA-C02 · O cadastro usa o design system existente e oferece retorno ao login e à landing.

Os critérios de criação, confirmação, acesso inicial, falhas e permissões serão fechados após a decisão abaixo.

## Pergunta histórica, encerrada com o cancelamento

Depois de criar a conta e confirmar o e-mail, a pessoa entra automaticamente como colaborador ou aguarda aprovação de Operações?

## Conflito com decisão vigente

O ADR-001 determina cadastro somente por convite, e a spec de login proíbe cadastro aberto. O pedido introduz autoinscrição. A escolha do novo fluxo precisa ser registrada em ADR que substitua esse ponto e refletida na spec de login antes de implementar o comportamento.

## Fora de escopo

- Escolha pública de papel ADMIN ou OPERATIONS.
- Criação de tenants pelo formulário.
- SSO, login social e MFA.
- Publicação ou alteração de configurações externas nesta etapa documental.

## Contrato afetado

- `/login`, nova tela de cadastro e procedimentos de autenticação.
- Supabase Auth e provisionamento de profiles/memberships.
- O cadastro não pode alterar contas, permissões ou empréstimos existentes.
