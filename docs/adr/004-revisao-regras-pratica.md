# ADR-004: Revisão das regras para a prática

Status: decisões de negócio aprovadas pelo responsável pelo projeto em 06/nov/2026. Implementação pendente. Substitui parcialmente o ADR-003 quanto ao limite e ao prazo; demais decisões permanecem.

## Contexto

A prática apresenta empréstimo imediato, cinco empréstimos em aberto e 14 dias úteis. O projeto havia decidido aprovação por Operações, limite de três e 14 dias corridos. O responsável avaliou os conflitos, manteve a aprovação e adotou o novo limite e prazo. Sua resposta final substitui a proposta inicial de aceitar empréstimo imediato.

## Decisões

| Item | Decisão anterior | Decisão vigente |
|---|---|---|
| Aprovação | Operações aprova ou rejeita | Mantida; Operações ou Admin do mesmo tenant aprova ou rejeita |
| Criação do empréstimo | Na aprovação | Mantida; solicitar cria somente pedido pendente |
| Limite por pessoa | Três empréstimos ativos | Cinco empréstimos ativos |
| Prazo | 14 dias corridos após aprovação | 14 dias úteis após aprovação |
| Dia útil | Não se aplicava | Segunda a sexta, sem descontar feriados |
| Contagem | Soma de 14 dias corridos | Primeiro dia contado é o dia útil posterior à aprovação; manter horário no fuso America/Sao_Paulo |
| Manutenção inicial | Não havia inventário populado | TI-0004, TI-0007 e TI-0010 em manutenção; nove disponíveis |
| Aprovação na prática | Tela de Operações prevista para versão completa | Incluir tela mínima de aprovação/rejeição nesta prática |

## Justificativas

- Aprovação: fazer empréstimo a bel prazer não necessariamente seria bom; manter a aprovação também preserva o modelo que já fizemos.
- Criação: o empréstimo começa depois da decisão de Operações, não quando alguém apenas solicita.
- Limite: cinco é a sugestão da prática e foi aceita para esta revisão.
- Prazo: 14 dias úteis faz mais sentido para o projeto do que corridos.
- Calendário: contar segunda a sexta, sem feriados, como confirmado pelo responsável.
- Contagem: começar no dia seguinte e manter o horário de São Paulo, conforme confirmação.
- Manutenção: manter os três da lista, inclusive o cabo de rede TI-0010.
- Interface: aprovação precisa poder ser executada; uma tela mínima basta nesta etapa.

## Alternativas descartadas

- Empréstimo imediato sem aprovação: recusado pelo responsável; abriria mão do controle definido e exigiria rever referências e validações do banco.
- Manter três empréstimos: substituído pela escolha explícita de cinco.
- Manter 14 dias corridos: substituído pela escolha explícita de dias úteis.
- Calendário com feriados: não adotado; o responsável confirmou apenas segunda a sexta.
- Somente TI-0004 e TI-0007 em manutenção: recusado em favor da lista completa, que também inclui TI-0010.
- Tela completa de Operações nesta prática: fica para depois; aprovação/rejeição mínima entra agora.

## Consequências

### Fica mais fácil

- Manter a rastreabilidade de quem aprovou cada empréstimo.
- Reaproveitar pedidos pendentes, vínculos, índices e a criação transacional já previstos.
- Explicar na correção quais sugestões foram aceitas e qual foi rejeitada.

### Fica mais difícil

- A prática exige tela e testes de aprovação, além dos pedidos do colaborador.
- Calcular dias úteis e testar fins de semana e mudança de mês/ano.
- A constraint `loan_due_14_days` precisa de revisão por nova migration. Manter aprovação não elimina essa mudança.
- Login, landing, indicadores e testes precisam deixar de informar três itens ou dias corridos como regra vigente.

### O que isso impede de fazer depois sem custo

- Adotar feriados ou outro fuso sem rever cálculo, testes e comunicação.
- Retirar aprovação sem migrar o contrato das solicitações e dos empréstimos.
- Recalcular prazos de empréstimos existentes sem política específica aprovada; esta decisão não autoriza alterar datas históricas.

## O que este ADR NÃO decide

- DDL da nova constraint e política para empréstimos já existentes; apresentar antes de implementar a migration.
- Modelo de metadados das imagens, bucket, formato e recorte das fotos.
- Biblioteca de processamento; `sharp` ainda precisa de aprovação específica.
- Alterar o fluxo de devolução, implantar convites ou cadastro público.
- Autorizar escrita pelo agente no banco ou Storage de produção.
