# ADR-010 — Execução delegada da E11

Esclarecimento posterior do responsável: ao pedir continuidade, ele não tinha intenção de modificar a regra da prática sobre escrita em produção. A restrição não foi retomada na conversa, e o agente interpretou uma autorização anterior de ajuda como aplicável às etapas seguintes. A execução registrada ocorreu após testes em ambientes controlados; depois houve verificações reais de integração. Este esclarecimento corrige a atribuição de intenção, sem alterar os fatos.

Status: aprovado pelo pedido do responsável em 09/nov/2026 para seguir à E11, após o relato de que o próximo passo seria publicar e validar o fluxo real. Registra essa autorização antes da execução; não muda regras do produto.

## Decisões

| Item | Escolha |
|---|---|
| Executor | Agente, por delegação atual do responsável para E11 |
| Banco | Supabase gverauqgerwjwwjkoybl existente |
| Migration | Publicar somente 202611090001_loan_due_rules, já aprovada e testada, via Prisma Migrate |
| Aplicação | Publicar pasta local validada no projeto Vercel empresti existente, domínio empresti-mauve.vercel.app |
| Verificação | Integração real separada dos testes descartáveis, com conta própria do responsável |
| Professor | Continua adiado, sem criar, redefinir senha ou registrar empréstimo nessa conta |

## Justificativas

- Executor: o responsável pediu seguir para a publicação apresentada como próxima etapa.
- Banco: continuar no projeto já usado pela aplicação.
- Migration: disponibilizar os 14 dias úteis sem recalcular o histórico.
- Aplicação: publicar as telas e os serviços que passaram na E10.
- Verificação: confirmar o fluxo publicado, sem apresentar mock como integração real.
- Professor: manter o adiamento já decidido.

## Alternativas descartadas

- Reutilizar a autorização D08: ela é limitada aos dados e imagens daquela etapa.
- Publicar antes da migration: a nova aplicação exige o campo de versão do prazo.
- Recalcular ou apagar histórico: contraria o ADR-009.

## Consequências

Fica mais fácil conferir banco e aplicação na mesma etapa. Fica mais difícil manter o recorte original de execução manual da prática; a delegação precisa constar na entrega. Uma falha entre migration e deploy exige retomada registrada; não autoriza rollback destrutivo ou mudar SQL no destino. Os critérios sem prova real continuam pendentes. Autorização de publicação não comprova isolamento global da sessão.

## O que este ADR NÃO decide

Push, tag, merge, outros projetos, habilitar deploy automático, ampliar o publicador D08, criar usuários, redefinir senhas, mudanças de negócio ou novo schema. A suíte de banco continua exclusivamente descartável. Nenhuma credencial deve constar em evidências ou código versionado.
