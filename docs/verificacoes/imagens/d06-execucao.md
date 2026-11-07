# D06 — Preparação da conta de correção

## Autorização e política

Em 07/nov/2026 o responsável autorizou a próxima etapa. Após esclarecer que reutilizar significa reconhecer a conta na reexecução, confirmou criar ausentes e reutilizar existentes ativos/compatíveis, sem redefinir senha. A regra 9 da spec 004 foi registrada antes do código. Conta bloqueada/inativa, nome/papel divergentes ou empréstimos registrados interrompem a preparação; não apagar histórico ou reativar silenciosamente.

O plano D06 foi registrado antes da implementação em `docs/specs/004-dados-iniciais/plan.md`. Não altera schema Prisma, migrations, seed original, UI ou dependências. Não cria fluxo de cadastro/convites para a aplicação.

## O que foi preparado

- `prisma/conta-correcao.ts`: valida configuração explicitamente recebida, consulta identidade e domínio, identifica conflitos e cria somente identidade/perfil/vínculo ausentes. Mantém nome/papel/tenant confirmados na spec. Departamento e outros vínculos são preservados. Perfil e vínculo são transacionais; não há método de reset de senha no contrato de identidade.
- `tests/db/auth-fixture.ts`: identidade simulada somente no container, com estado de confirmação/bloqueio e hash de segredo efêmero. Os campos extras são apenas fixtures em `auth.users`; não são migration, contrato interno do Supabase ou instrução para escrever no Auth real.
- `tests/db/conta-correcao.test.ts`: PostgreSQL real para domínio/FKs/transações, com identidade simulada. Os empréstimos usados para testar conflitos são fixtures locais, nunca operações da conta real do professor. Usam o prazo antigo ainda exigido pela migration inicial; novo prazo é da spec 005.
- `tests/db/d06-local.ts`: cria seu próprio container, prepara tenant e conta simulada, executa duas vezes e confere identidade/perfil/vínculo e zero pedidos/empréstimos; encerra o container. Não aceita URL, senha por argumento ou destino remoto; não carrega `.env`.

## Falhas e recuperação

As pré-condições são verificadas antes da criação. Depois da identidade, o domínio é novamente validado na transação. Auth e banco não compartilham transação distribuída: se a criação de identidade funcionar e a escrita de domínio falhar, a identidade permanece e perfil/vínculo são revertidos juntos. A falha informa a etapa e o estado da identidade, sem conteúdo do erro do provedor/driver. Não há DELETE compensatório nem retry silencioso.

Se a resposta da criação se perder, o estado é `unknown`. Uma nova execução primeiro consulta a identidade e, se compatível, completa o domínio sem trocar senha. Esse comportamento foi exercitado por falhas injetadas; não é uma prova de integração real do Supabase.

## Configuração

`CORRECTION_ACCOUNT_PASSWORD` é **segredo de servidor**, somente necessário ao criar uma nova identidade. Nome registrado em `.env.example`, sem valor. Não é usado pelo login da aplicação. A função recebe um objeto de configuração validado por Zod; não lê o ambiente implicitamente nem retorna a senha. Com identidade existente, a senha não é exigida, comparada ou atualizada.

`npm run conta:local` usa um segredo efêmero gerado em memória, não a senha da turma. Nenhuma variável externa precisa ser preenchida para executar esse comando; apenas Docker disponível. A configuração real é do operador em D08, em ambiente não versionado. Não cadastrar essa variável na Vercel por causa deste teste local.

## Evidências e limites

Resultado do comando local: uma identidade, um perfil e um vínculo `COLLABORATOR` na primeira execução; zero novos registros na segunda, com IDs/timestamps/hash preservados. Zero pedidos/empréstimos. Recibo em `d06-recibo.json`, sem UUIDs, hashes de senha, senha ou chave.

O único provedor executável entregue nesta tarefa é a fixture local. Não há adaptador HTTP de administração remoto nem comando que aceite conexão Supabase. A criação/confirmação da conta real deve ser feita pelo operador pela administração do Auth em D08, preservando os mesmos critérios; não inserir senha/hash por SQL nas tabelas internas do serviço. O roteiro e as evidências de publicação serão entregues na tarefa correspondente.

## Checks executados

| Comando | Resultado |
|---|---|
| `npm run conta:local` | Duas execuções; uma identidade/perfil/vínculo, depois zero novos; zero pedidos/empréstimos; container encerrado |
| `npm run test:db` | 96 testes passaram em quatro arquivos, sendo 23 D06 |
| `npm test` | 11 testes passaram |
| `npm run test:imagens` | Dez testes passaram |
| `npm run test:verificador` | Sete testes passaram; não substitui a rodada integral D07 |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou |
| `npm run format:check` | Passou |
| `npm run build` | Passou; aviso preexistente de depreciação de `package.json#prisma` |

Sem mudança de UI/rotas, E2E de login não foi repetido. Servidor do projeto pausado para gerar Prisma/build e reiniciado depois. Revisão final inclui `git diff --check`, escopo e arquivos selecionados; HTMLs do usuário em `Aulas/` ficam fora do commit.

Não foi provado envio de e-mail, convite, senha aceita pelo Supabase, sessão, cookie ou login real. CA-D06 fica parcialmente verificado no ambiente local; sua parte real depende de D08. CA-D07 local cobre ausência de credencial versionada/relatada e ausência de executor remoto nesta etapa; não constitui isolamento global de todas as ferramentas da sessão. A spec 004 inteira permanece NÃO PRONTA. A rodada independente integral é D07.
