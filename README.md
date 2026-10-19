# EmpresTI

Landing publicada: https://empresti-mauve.vercel.app/

## Rodar localmente

Abra o PowerShell dentro da pasta `EmpresTI`, onde está `package.json`. Use Node.js 24 e npm.

```powershell
npm ci
$env:APP_MODE = "showcase"
npm run dev
```

Abra http://localhost:3000. A landing está em `/` e o login visual em `/login`. Se a porta estiver ocupada, o Next informa outra porta no terminal. Encerre com `Ctrl+C`.

Esse modo não usa banco nem exige Docker. Para sair do modo visual nesta sessão do PowerShell:

```powershell
Remove-Item Env:APP_MODE
```

A integração completa exige as variáveis do `.env.example`, migrations aplicadas e usuário com perfil/vínculo ativo. O `.env` local permanece ignorado pelo Git.

## Publicar automaticamente ao fazer push

Para a versão visual atual, configure uma vez no projeto `empresti` da Vercel:

1. Em **Settings → Git**, conecte `GabrielMartinsss26/EmpresTI`.
2. Em **Settings → Environments → Production**, defina a branch de produção. Para publicar diretamente os próximos pushes da branch atual, selecione `dev`. Se preferir produção em `main`, faça merge de `dev` em `main` quando quiser publicar.
3. Em **Settings → Environment Variables**, cadastre `APP_MODE` com valor `showcase` em **Production** e **Preview**. Os valores passados nos deploys anteriores pela CLI não substituem essa configuração persistente do projeto.
4. Use a raiz do repositório como **Root Directory**, framework **Next.js**, Node **24**, instalação `npm ci` e build `npm run build`.

Depois, na branch `dev`:

```powershell
git push origin dev
```

Se `dev` for a branch de produção, esse push dispara o build e atualiza o endereço público quando o build termina. Se `main` for a branch de produção, o push em `dev` gera preview; o merge/push em `main` publica em produção.

Configuração externa ainda precisa ser feita no painel. Nenhuma dessas configurações foi alterada automaticamente por este guia.

Referências: [integração Git da Vercel](https://vercel.com/docs/git) e [variáveis por ambiente](https://vercel.com/docs/environment-variables).

## Futuro deploy com banco

O workflow `.github/workflows/ci.yml` verifica o código. O job de migrations e publicação com banco fica desativado por padrão e só roda se a variável de repositório `ENABLE_DATABASE_DEPLOY` for `true`, na branch `main`.

Antes de habilitá-lo, configure os secrets/variables descritos em [docs/producao.md](docs/producao.md), remova o modo visual na Vercel e use o workflow como único caminho de produção com banco, aplicando migrations antes do deploy. A publicação automática direta por Git é o fluxo da demonstração visual, não a configuração final do banco.

## Verificações

Os comandos e a estrutura estão em [AGENTS.md](AGENTS.md). As specs estão em `docs/specs/` e as decisões em `docs/adr/`.
