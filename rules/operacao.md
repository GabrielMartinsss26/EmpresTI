# Contrato de operação

> leitor: agente e operador humano

## Quando

Durante qualquer tarefa do projeto.

## Procedimento

1. O agente pode criar commits locais das tarefas autorizadas, depois dos checks e da revisão do diff. Selecionar os arquivos explicitamente e citar o critério ou tarefa na mensagem. Push continua com o usuário, salvo pedido explícito.
2. Edições e verificações locais pertencentes à tarefa autorizada podem ser executadas pelo agente.
3. Mudança de schema segue `migration.md`; dependência nova ou decisão estrutural segue `restrictions.md`.
4. Escrita em serviço externo depende de pedido explícito com o destino e a ação definidos.
5. A escolha de modelo e raciocínio por fase pertence ao operador; ainda não existe matriz de modelos aprovada.
6. Na prática de `novas-orientacoes/`, aplicar o limite de execução externa e os cuidados de isolamento definidos em `docs/pratica.md`, seção “Produção e segredos nesta prática”.

## Verificação

O relato identifica o escopo executado e as pendências externas; não confunde teste local com publicação.

## Não faça

- Não interprete uma autorização pontual como permissão permanente para publicar ou administrar outros ambientes.
