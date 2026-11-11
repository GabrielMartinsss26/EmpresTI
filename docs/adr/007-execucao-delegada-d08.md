# ADR-007 — Execução delegada da D08

Status: aprovado pela solicitação explícita do responsável em 07/nov/2026 para o agente seguir com segurança/publicação da D08. Depois, o responsável adiou expressamente a conta do professor. Substitui somente a exigência de execução manual pelo operador na D08 dos documentos anteriores; não aprova isolamento global nem muda regras do produto.

## Decisões

| Item | Escolha |
|---|---|
| Executor desta publicação | Agente, por delegação atual do responsável |
| Destino | Projeto Supabase `gverauqgerwjwwjkoybl` já usado pelo EmpresTI |
| Escopo imediato | Aplicar a migration D04 já revisada; publicar bucket/imagens e os 12 cadastros/referências aprovados |
| Conta do professor | Adiada pelo responsável; não criar nem redefinir credencial nesta execução |
| Preservação | Reutilizar dados/objetos idênticos; parar em divergências; sem sobrescrita ou reativação silenciosa |
| Provas | Verificações de integração registradas separadamente da suíte descartável |
| Isolamento da sessão principal | Continua não comprovado; CA-D07 permanece BLOQUEADO |

## Justificativas

- Executor: o responsável pediu que o agente também faça a D08.
- Destino: publicar no projeto que já está configurado para esta aplicação.
- Escopo: disponibilizar o que foi preparado e testado em D04/D05.
- Conta: o responsável escolheu deixá-la para depois.
- Preservação: repetir sem perder o que já existe.
- Provas: teste local não confirma serviço publicado.
- Isolamento: autorização para publicar não bloqueia tecnicamente as ferramentas da sessão.

## Alternativas descartadas

- Manter toda a D08 apenas como instruções manuais: não atende ao pedido atual de delegação.
- Marcar CA-D07 como atendido por esta autorização: confunde permissão com isolamento efetivo.
- Publicar e criar a conta junto: contraria o adiamento explícito da conta.

## Consequências

Fica mais fácil executar a publicação e conferir o resultado na mesma tarefa. Fica mais difícil manter o recorte original da prática: esta exceção de execução precisa aparecer na correção. Reexecutar exige destino explícito e conferência de conflitos. Storage e banco não compartilham transação; uma falha parcial precisa de relatório e retomada, sem apagar arquivos por conta própria.

Não será possível declarar a spec integralmente pronta sem tratar o bloqueio de CA-D07 e as provas da conta real. A publicação não é evidência retroativa de isolamento, nem altera os pareceres históricos.

Resultado posterior da revisão D08-R2: CA-D07 foi classificado como **NÃO ATENDE**, pela existência e uso do executor de produção. A classificação BLOQUEADO da D07 permanece histórica. Esta decisão autoriza a operação solicitada, mas não revoga nem satisfaz o critério original da prática.

## O que este ADR NÃO decide

- VM/sandbox, firewall ou instalação de infraestrutura no computador.
- Reduzir o critério de segurança da prática ou autorizar acesso amplo a outros projetos.
- Conta/senha do professor, convites ou cadastro de usuários.
- Push, tag, mudança de interface ou novo deploy da aplicação na Vercel.
