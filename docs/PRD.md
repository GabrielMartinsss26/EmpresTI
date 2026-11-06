# PRD — Empréstimo de Equipamentos Internos

Versão 2 — regras revisadas pelo responsável pelo projeto em 06/nov/2026 para a prática. O texto original foi escrito pelo time de Operações; histórico das mudanças no ADR-004.

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

- Cada pessoa pode estar com, no máximo, cinco empréstimos ativos ao mesmo tempo.
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

O limite anterior era de três itens, e o ADR-003 detalhava o prazo como 14 dias corridos. A revisão adota cinco empréstimos e 14 dias úteis do briefing, mas mantém a aprovação já decidida no projeto. Essa escolha é do responsável pelo projeto, não uma decisão do agente. Detalhes e alternativas no ADR-004; implementação nas specs 004 e 005. A atualização documental não significa que o fluxo já esteja implementado ou publicado.
