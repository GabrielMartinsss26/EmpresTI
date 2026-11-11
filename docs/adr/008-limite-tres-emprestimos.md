# ADR-008 — Retorno ao limite de três empréstimos

Status: aprovado por instrução explícita do responsável em 09/nov/2026. Substitui somente o limite de cinco do ADR-004; aprovação e prazo permanecem vigentes.

## Decisão

| Item | Escolha |
|---|---|
| Limite por pessoa | No máximo três empréstimos ativos |

## Justificativa

Cinco empréstimos são muitas coisas para um único CPF, além do risco de não devolverem ou gerar prejuízo; voltar para três como era antes.

## Alternativa descartada

- Manter cinco ativos, sugestão anteriormente aceita da prática: o responsável reconsiderou pelo volume por pessoa e pelo risco de não devolução ou prejuízo.

## Consequências

Fica mais fácil limitar a quantidade de equipamentos com uma pessoa. Fica mais difícil atender quem precisa de mais de três ao mesmo tempo. Aumentar o limite depois exigirá rever validações de solicitação/aprovação, testes de concorrência e indicadores.

Com três ou mais empréstimos ativos, não permitir nova solicitação/aprovação; com dois, pode aprovar o terceiro, nunca o quarto. Não cancelar nem apagar empréstimos existentes por causa da mudança. A regra ainda será implementada na spec 005; este ADR não afirma que já existe validação no servidor ou no banco.

## O que este ADR NÃO decide

- Mudar a aprovação por Operações/Admin ou o prazo de 14 dias úteis já confirmados.
- Coletar CPF: a referência na justificativa não cria campo ou cadastro novo; a pessoa continua identificada pelo usuário/perfil/vínculo.
- Mudar o rate limit de login ou a constante da fixture isolada do verificador, que não é a regra operacional do produto.
- Exceções individuais, penalidades, renovação, exclusão ou recálculo de empréstimos existentes.
- Publicação, migration, push ou deploy nesta etapa.
