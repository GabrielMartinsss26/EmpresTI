---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "src/**/*.ts", "src/**/*.tsx", "prisma/**", "next.config.*"]
alwaysApply: false
---

# Variáveis de ambiente e chaves

> leitor: agente

## Quando

Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento

1. Classifique cada variável antes de usá-la como pública, configuração de
   servidor ou segredo de servidor.
2. Somente valores deliberadamente públicos podem usar o prefixo
   `NEXT_PUBLIC_`. Esse prefixo envia o valor para o bundle do navegador.
3. Credenciais do banco, connection strings com senha e a chave
   `service_role` do Supabase são segredos de servidor. Nunca podem aparecer em
   Client Components, código importável pelo cliente ou variáveis públicas.
4. Antes de criar qualquer arquivo real de ambiente, confirme que `.env`,
   `.env.local` e variantes locais estão ignorados pelo Git.
5. Registre o nome de cada variável em `.env.example`, sem credencial ou valor
   real. Use somente marcador claramente fictício quando o formato precisar ser
   demonstrado.
6. Leia e valide as variáveis de ambiente com o schema Zod de configuração
   definido pelo projeto. Variável obrigatória ausente deve causar erro claro na
   inicialização.
7. O agente pode criar nomes e placeholders locais, mas não pode inventar
   credenciais nem alterar Supabase ou Vercel sem solicitação explícita.
8. Ao concluir, informe quais arquivos locais foram preparados e liste apenas os
   nomes das variáveis que o usuário ainda precisa cadastrar manualmente nos
   ambientes externos.

## Verificação

- Os arquivos reais de ambiente estão ignorados e não aparecem no `git status`.
- `.env.example` contém todos os nomes usados pelo código e nenhum segredo real.
- Segredos de servidor não são importados por Client Components nem incluídos no
  bundle do navegador.
- A aplicação falha com uma mensagem clara quando uma variável obrigatória está
  ausente.
- Os checks aplicáveis de `rules/checks.md` passaram sem usar banco remoto.

## Não faça

- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não leia, imprima ou copie o conteúdo completo de um arquivo real de ambiente.
- Não adicione segredo a `.env.example` nem a variável com prefixo
  `NEXT_PUBLIC_`.
- Não use a chave `service_role` para contornar autorização, middleware ou RLS.
- Não cadastre variável somente no ambiente local e declare a configuração
  pronta; informe o que ainda precisa ser feito manualmente na Vercel.
- Não configure ou altere ambientes externos sem pedido explícito do usuário.
- Se encontrar um segredo exposto ou versionado, não o repita. Informe apenas o
  arquivo e o nome da variável, pare e oriente o usuário a revogar ou rotacionar
  a credencial; apagar o arquivo não remove o segredo do histórico.
