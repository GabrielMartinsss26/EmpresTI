# Testes

> leitor: agente

## Quando

Ao criar, alterar ou remover testes.

## Procedimento

1. Identifique na spec o critério exercitado e cite seu ID no nome do teste quando houver critério aplicável.
2. Use os comandos do `AGENTS.md`; testes de banco usam PostgreSQL descartável por Testcontainers.
3. Teste de endpoint verifica status e corpo; teste de isolamento verifica o dado inacessível pelo contexto errado.
4. Policies são verificadas contra PostgreSQL real, usando role sem privilégios de owner.
5. Verificações manuais de integração no Supabase devem ser declaradas separadamente da suíte local.

## Verificação

Os testes aplicáveis passam e cada resultado declara se usou mock, banco local ou integração autorizada.

## Não faça

- Não execute a suíte de banco contra o Supabase remoto.
- Não apresente teste com resposta interceptada como prova de autenticação real.
