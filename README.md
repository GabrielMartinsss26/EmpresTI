# EmpresTI

Aplicação publicada com Supabase: https://empresti-mauve.vercel.app/

Login: https://empresti-mauve.vercel.app/login. Acesso exige usuário com perfil e vínculo ativos. O catálogo ainda é a área protegida inicial; os fluxos completos de equipamentos e empréstimos estão pendentes.

## Rodar localmente

Abra o PowerShell dentro da pasta `EmpresTI`, onde está `package.json`. Use Node.js 24 e npm.

```powershell
npm ci
npm run dev
```

Abra http://localhost:3000. A landing está em `/` e o login em `/login`. Se a porta estiver ocupada, o Next informa outra porta no terminal. Encerre com `Ctrl+C`.

Para usar somente a demonstração visual local, sem banco, defina `APP_MODE=showcase` antes de executar. Para voltar ao login conectado:

```powershell
Remove-Item Env:APP_MODE
```

A integração completa exige as variáveis do `.env.example`, migrations aplicadas e usuário com perfil/vínculo ativo. O `.env` local permanece ignorado pelo Git.

## Publicação atual

A versão conectada foi publicada pela CLI em 05/nov/2026, com as quatro variáveis necessárias cadastradas em Production. Não configurar `APP_MODE=showcase` em produção conectada. Evidências, ID do deploy e pendências estão em [docs/producao.md](docs/producao.md).

O deploy enviou a pasta local; não criou commit nem push. O usuário ainda precisa versionar e enviar as alterações para que uma publicação futura pelo Git contenha a mesma versão.

## Futuro deploy com banco

O workflow `.github/workflows/ci.yml` verifica o código. O job de migrations e publicação com banco fica desativado por padrão e só roda se a variável de repositório `ENABLE_DATABASE_DEPLOY` for `true`, na branch `main`.

Antes de habilitá-lo, configure os secrets/variables descritos em [docs/producao.md](docs/producao.md) e use o workflow como único caminho automático de produção com banco, aplicando migrations antes do deploy. Esse workflow não foi habilitado pela publicação manual atual.

## Verificações

Os comandos e a estrutura estão em [AGENTS.md](AGENTS.md). As specs estão em `docs/specs/` e as decisões em `docs/adr/`.
