# Entrega da prática

Status: rascunho iniciado em 06/nov/2026. Não é declaração de entrega concluída. Evidências, linhas, hashes e tabelas finais serão acrescentados conforme execução real; itens não executados permanecem assim identificados.

## Links

- Repositório: https://github.com/GabrielMartinsss26/EmpresTI
- Produção existente: https://empresti-mauve.vercel.app/ — contém a base de login/landing, ainda não as funcionalidades desta prática.
- Arquitetura: monolito Next/tRPC; uma verificação cobre frontend, backend e banco, com evidências distintas para cada camada.

## 1. Conflitos: o que foi pedido contra o que já existia

| Pedido | Contrariava o quê | O que foi decidido | Por quê | Registro | Commit/evidência |
|---|---|---|---|---|---|
| Empréstimo imediato sem aprovação | ADR-003, relações e trigger do banco existente | Manter aprovação por Operações/Admin; incluir decisão mínima na prática | Responsável não considera adequado emprestar a bel prazer e quer preservar o controle/modelo | ADR-004; spec 005, regras 3–8 | Decisão confirmada em 06/nov/2026; implementação pendente |
| Cinco empréstimos | PRD original com três | Adotar cinco ativos | Responsável aceitou a sugestão da prática | PRD v2; ADR-004; CA-E03/E06 | Implementação pendente |
| 14 dias úteis | ADR-003 e constraint de 14 corridos | Adotar 14 úteis após aprovação | Responsável considera mais adequado que corridos | ADR-004; CA-E07/E12 | Nova migration pendente |
| Somente TI-0004/TI-0007 em manutenção | Lista do mesmo enunciado também marca TI-0010 | Manter os três em manutenção | Responsável escolheu a lista completa | Spec 004, inventário e CA-D01 | População pendente |
| Pexels como única fonte | Alteração de orientação pelo responsável | Usar Pixabay como única fonte | Nova orientação para a prática | docs/pratica.md; spec 004 | Skill ainda não criada |
| Verificador corrige teste | Independência exigida no próprio enunciado | Proposta: só verificar; principal corrige | Correção própria elimina independência da conferência | docs/pratica.md, etapa 1 | Proposta; configuração pendente |
| Senha literal no script | rules/secrets.md e regra geral da prática | Não copiar credencial ao seed; operador fornece por configuração | Manter segredo fora do código/histórico | docs/pratica.md; regra 8 da spec 004 | Provisionamento pendente |
| Instalar sharp diretamente | ADR-001 e regra de aprovação de dependências | Apresentar proposta antes de instalar | Nome no briefing não equivale à aprovação da stack | docs/pratica.md, lacunas | Não decidido; nada instalado |
| Catálogo sem crédito × crédito exigido na seção de fotos | Contradição interna e mudança de provedor | Avaliar condições Pixabay antes de fechar interface | Não transportar automaticamente a condição atribuída ao Pexels | docs/pratica.md, lacunas | Não decidido |
| Agente publica dados/imagens por autorizações antigas | Limite mais restritivo da prática | Operador executa escritas em produção nesta prática | Agente prepara e testa localmente | rules/operacao.md → docs/pratica.md | Nenhuma escrita de prática executada |

## 1b. Lacunas: o que foi pedido de forma incompleta

| Spec | O que faltava | Alternativas | Decisão | Motivo | Commit/evidência |
|---|---|---|---|---|---|
| 005 | Definição de dia útil e contagem | Seg–sex; calendário com feriados | Seg–sex sem feriados, iniciar no dia seguinte e manter horário em São Paulo | Confirmado pelo responsável | ADR-004; implementação pendente |
| 004 | Local de retirada | Operações; outro local | Operações nos 12 itens | Confirmado pelo responsável | Spec 004; população pendente |
| 004 | Nome e papel do professor | Colaborador; Operações; Admin | Marcelo Grilo, COLLABORATOR | Confirmado pelo responsável | Spec 004; conta ainda não provisionada por esta prática |
| 005 | Como manter aprovação sem construir toda Operações | Decisão mínima; painel completo | Tela mínima de aprovação/rejeição | Confirmado pelo responsável | Spec 005; implementação pendente |
| 004/005 | Demais lacunas | Ver docs/pratica.md | Não decidido | Não preencher pelo agente | Sem implementação |

## 2. Onde o agente tentou decidir por você

Não registrar um exemplo inventado. A análise apresentou conflitos e opções; o responsável reconsiderou a proposta inicial de empréstimo imediato e confirmou aprovação, cinco ativos e dias úteis. Um episódio real de suposição indevida, se ocorrer, será documentado com evidência; requisito ainda pendente.

## 3. Uma decisão que merece (ou não) um ADR

ADR-004 registra manutenção da aprovação e alteração de limite/prazo. Há alternativas defensáveis e impacto na constraint do banco, nas transações, nos testes e na interface. O ADR-003 permanece como histórico, sem fingir que previa cinco itens/dias úteis desde o começo.

## 4. A skill imagens-equipamentos

Pendente: criar skill, decidir biblioteca/formato/recorte, separar roteiro/referências/scripts, comprovar 800×600 e não repetição, documentar revisão visual e garantir bloqueio de escrita em produção. Nenhuma foto selecionada ou reprovada ainda; não confundir ausência de revisão com aprovação de todas.

## 5. O subagente verificador

Pendente: configurar no harness, conectar gatilho obrigatório ao fluxo e comprovar restrições. Deve receber caminhos da spec/plan/tasks e ler as fontes, sem herdar a conversa de implementação. Não corrige testes/código; texto sozinho não comprova bloqueio de credenciais/comandos externos.

## 6. O verificador em ação

Não executado. Histórico real de reprovações, tabelas por critério e commits de erro plantado/restaurado serão registrados aqui. Tabelas finais das specs 004 e 005: pendentes. Não usar os testes anteriores do login como evidência destas funcionalidades.

## 7. Uma regra sua que esta prática pôs à prova

O contrato anterior permitia operações externas mediante pedido explícito. A prática impõe que o agente não escreva no destino de produção; rules/operacao.md agora aponta para o recorte em docs/pratica.md. A conta local ainda usa o mesmo Supabase da produção, então não é seguro chamar um script de “local” apenas por executá-lo no computador.

## 8. O que ficou de fora e o que faria diferente

Nesta etapa só foram preparados documentos. Código, migrations, skill, verificador, imagens, conta, testes das novas specs e publicação ainda não foram executados. Devolução, cadastro por interface, tela completa de Operações, convites e autocadastro ficam fora do recorte confirmado. Tag entrega-pratica e push ainda não executados; só marcar a entrega depois das evidências reais.
