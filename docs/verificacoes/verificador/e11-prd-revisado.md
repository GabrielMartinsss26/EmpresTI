# PRD — Empréstimo de Equipamentos Internos

Versão 3 — limite revisto pelo responsável em 09/nov/2026 para três empréstimos ativos (ADR-008). Aprovação e 14 dias úteis da revisão de 06/nov permanecem. O texto original foi escrito pelo time de Operações; histórico nos ADRs 004 e 008.

## Problema

O controle de quem pegou qual equipamento — notebooks, monitores, cabos e
câmeras — é feito hoje em uma planilha compartilhada. Ninguém sabe com segurança
o que está disponível, itens somem e a devolução só é registrada quando alguém
lembra de atualizar a linha.

## Quem usa

- Colaborador: vê o catálogo, solicita um item disponível e devolve o que está com ele.
- Operações: cadastra equipamentos, vê todos os empréstimos em aberto e registra devoluções no balcão.

## O que precisa existir na primeira versão

1. Login; cada pessoa vê os próprios empréstimos.
2. Catálogo de equipamentos com a situação de cada item.
3. Solicitação de empréstimo de um item disponível.
4. Devolução de um item que está com o colaborador.
5. Tela de Operações com todos os empréstimos em aberto.

## Regras já decididas por Operações

- Cada pessoa pode estar com, no máximo, três empréstimos ativos ao mesmo tempo.
- Solicitar cria um pedido pendente; Operações ou Admin aprova antes de criar o empréstimo. Não há empréstimo imediato por autoatendimento.
- O prazo de devolução é de 14 dias úteis a partir da aprovação: segunda a sexta, sem descontar feriados, começando no dia seguinte e mantendo o horário no fuso de São Paulo.
- Quem tem item em atraso não pode pegar outro item emprestado.
- Equipamento em manutenção não aparece como disponível.

## Fora de escopo da primeira versão

- Reserva com data futura.
- Notificação por e-mail.
- Importação da planilha atual.

## Como saberemos que deu certo

Operações consegue abandonar a planilha depois de duas semanas de uso.

## Histórico da revisão para a prática

O limite anterior era de três itens, e o ADR-003 detalhava o prazo como 14 dias corridos. Em 06/nov/2026 a revisão adotou cinco empréstimos e 14 dias úteis do briefing, mantendo aprovação. Essa escolha intermediária foi do responsável e depois substituída somente no limite pelo ADR-008. Histórico no ADR-004; implementação nas specs 004 e 005. Não apresentar cinco como regra vigente.

Em 09/nov/2026 o responsável voltou ao limite de três, por considerar cinco equipamentos por pessoa um volume elevado e um risco de não devolução/prejuízo. ADR-008 registra essa decisão. Não há coleta de CPF nem mudança de identidade. E01–E08 implementaram/testaram o fluxo localmente; E09 sincroniza apresentação. Isso não publica o novo prazo/fluxo no Supabase: E11 continua pendente.
