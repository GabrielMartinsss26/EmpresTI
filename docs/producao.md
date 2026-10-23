# Publicação na Vercel e Supabase

## Landing publicada

A landing está na raiz https://empresti-mauve.vercel.app/ e o login permanece em `/login`. Deploy `dpl_48JUKvsFw1QDDwAvr7Djp74JZA7e` confirmado como `READY`; as duas rotas responderam HTTP 200. A publicação continua em `APP_MODE=showcase`.

## Primeira publicação: somente a página inicial

Publicado em https://empresti-mauve.vercel.app/login. Deploy `dpl_9NR4uxwtXj1rhKGfxxWQ5Hv2XSfY` confirmado como `READY`; `/login` e `/health` responderam HTTP 200 sem autenticação da Vercel. O health confirmou `mode: showcase`.

O usuário pediu publicar primeiro somente a interface, sem variáveis de banco. Esta publicação usa `APP_MODE=showcase` tanto no build quanto na execução. Não envia arquivos `.env` nem credenciais locais para a Vercel; `.vercelignore` exclui os arquivos de ambiente. O formulário fica desabilitado com aviso de demonstração, as rotas protegidas voltam ao login e a API retorna 503. Nenhuma migration é aplicada.

Para testar esse modo: definir `APP_MODE=showcase`, executar build e `npm run test:e2e`. O teste usa a porta 3001 para não reutilizar uma instância de login funcional. Ao ativar a integração completa depois, remover o modo visual e cadastrar as variáveis necessárias.

O usuário informou que corrigiu o `.env` local após a verificação anterior. A conexão corrigida ainda não foi verificada, pois não faz parte desta publicação visual.

O usuário autorizou publicar esta primeira entrega. Commit e push continuam sob responsabilidade dele.

## Situação verificada nesta execução

- Vercel: login concluído; nenhum projeto existente encontrado no escopo ativo.
- Supabase: o endereço configurado em `NEXT_PUBLIC_SUPABASE_URL` não resolve no DNS. O domínio principal do serviço e o host do pooler resolvem, mas a conexão PostgreSQL também falhou.
- O acesso ao painel pelo controle do navegador foi interrompido pela ferramenta, que não conseguiu confirmar a URL. Nenhuma alteração foi aplicada ao Supabase remoto.
- A aplicação compila para produção, mas autenticação real e publicação com banco conectado dependem de corrigir esse acesso.
- `npm audit` encontrou oito alertas altos em dependências transitivas das ferramentas Prisma e ESLint. As correções sugeridas exigem mudanças principais; a atualização precisa ser verificada antes de encerrar essa pendência.

## Como corrigir as variáveis locais

1. Abrir o projeto correto no painel Supabase e conferir se está ativo. Se estiver pausado, restaurá-lo antes de continuar.
2. No diálogo **Connect**, copiar a **Project URL** do projeto e substituir `NEXT_PUBLIC_SUPABASE_URL` no `.env`. Não montar a URL digitando o identificador de memória.
3. Em **Settings → API Keys**, copiar a chave **publishable** do mesmo projeto para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Em **Connect → Transaction pooler**, copiar a conexão na porta **6543** para `DATABASE_URL`; substituir o marcador da senha pela senha do banco, codificada para URL, e manter `?pgbouncer=true&connection_limit=1`.
5. Em **Connect → Direct connection**, copiar a conexão na porta **5432** para `DIRECT_URL`. Conexão direta pode exigir IPv6; em rede apenas IPv4, o pooler em modo **Session**, porta **5432**, é a alternativa documentada pelo Supabase, que precisa ser reconciliada com a decisão de conexão direta do ADR-001 antes de usar.
6. Salvar apenas no `.env` local, que está ignorado pelo Git, e avisar que a configuração foi atualizada. Não enviar senha, chave ou connection string pelo chat.

Referências: [conexões PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres) e [chaves da API](https://supabase.com/docs/guides/getting-started/api-keys).

## Antes da publicação

1. Executar os checks do `AGENTS.md`, incluindo a migration em PostgreSQL local vazio.
2. Confirmar que o destino Supabase é o projeto esperado e revisar o estado de migrations antes de aplicar.
3. Usar `npm run db:deploy` e `npm run db:seed` com conexão direta do Supabase; nunca usar Studio como segundo dono do schema.
4. Configurar a Vercel com Next.js, Node 24, instalação `npm ci` e build `npm run build`.
5. Cadastrar `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel como variáveis do projeto. Connection strings são segredos.
6. Fechar cadastro público no Supabase Auth. Manter somente e-mail e senha nesta entrega.
7. Configurar Site URL e URLs de retorno do Auth para o domínio publicado antes de usar convites.
8. Provisionar o primeiro administrador pelo Supabase Auth e criar seu perfil e membership no tenant `suporte_ti`. O seed não cria contas nem senha padrão.

## CI

Para rodar localmente e configurar publicação automática da versão visual, seguir o [README](../README.md). O job abaixo permanece desativado até `ENABLE_DATABASE_DEPLOY=true` nas variáveis do repositório GitHub; essa configuração só deve ser ligada ao preparar a integração completa com banco.

O workflow `.github/workflows/ci.yml` verifica o código e o banco local, aplica migrations no job de produção e só depois solicita deploy na Vercel. O ambiente `production` precisa dos secrets `DATABASE_URL`, `DIRECT_URL` e `VERCEL_TOKEN`, e das variables `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.

As quatro variáveis de execução da aplicação também precisam existir no projeto da Vercel. `SUPABASE_SERVICE_ROLE_KEY` não é necessária ao login e não deve ser enviada ao navegador. Sentry permanece pendente até existir DSN válido.

Desabilitar deploy automático por Git no projeto da Vercel quando usar este workflow, para evitar publicar antes da migration.

## Verificação publicada

- `/login` abre com o layout desktop.
- `/health` responde somente `status: ok` quando o PostgreSQL está acessível.
- `/catalogo` sem sessão redireciona ao login.
- Acesso válido exige perfil, vínculo e tenant ativos.
- Credenciais erradas não criam sessão e o limite de tentativas usa PostgreSQL.
- Sessões usam cookies `httpOnly`, `secure` em produção e `sameSite=lax`.

## Alcance

A entrega inclui a tela inicial de login, autenticação, logout, destino protegido mínimo e schema inicial. As telas de cadastro, catálogo completo, aprovação e devolução ainda precisam ser implementadas.
