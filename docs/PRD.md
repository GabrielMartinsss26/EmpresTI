# PRD — Empréstimo de Equipamentos Internos

Versão 1 — escrito pelo time de Operações

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

- Cada pessoa pode estar com, no máximo, três itens ao mesmo tempo.
- O prazo padrão de devolução é de 14 dias.
- Quem tem item em atraso não pode pegar outro item emprestado.
- Equipamento em manutenção não aparece como disponível.

## Fora de escopo da primeira versão

- Reserva com data futura.
- Notificação por e-mail.
- Importação da planilha atual.

## Como saberemos que deu certo

Operações consegue abandonar a planilha depois de duas semanas de uso.
