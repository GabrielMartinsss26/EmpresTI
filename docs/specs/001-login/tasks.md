# Tarefas — Login

## Executadas e verificadas

- [x] T1 · Interface desktop e navegação: CA-01, CA-02, CA-02a, CA-04, CA-16. Verificação: E2E com navegação, senha oculta e ausência de scroll em três resoluções.
- [x] T2 · Validação e mensagens: CA-10, CA-13. Verificação: testes unitários de entrada/service e E2E da resposta inválida interceptada.
- [x] T3 · Sessão, vínculo e saída: CA-11, CA-12, CA-14. Verificação: testes de contexto e smoke real com ADMIN, cookies, recarga e logout em produção.
- [x] T4 · Migration e seed: CA-15. Verificação: seis testes em PostgreSQL local descartável e conferência de nove tabelas/policies no destino autorizado.
- [x] T5 · Fechar cadastro público no Supabase Auth: CA-05. Configuração alterada pelo usuário no painel e conferida em 05/nov/2026: `/auth/v1/settings` respondeu HTTP 200 com `disable_signup: true`. Nenhuma conta de teste criada.

## Pendentes

- [ ] T6 · Completar rastreabilidade automatizada: CA-03, CA-06, CA-07, CA-08, CA-09 e identificação dos demais testes por critério. Conferir cobertura real, sem renomear teste como se provasse comportamento que não exercita.
- [ ] T7 · Revisão independente contra a spec após configurar o verificador. Sem agente configurado, não afirmar que essa revisão ocorreu.

Tarefas concluídas registram evidência já observada, não a ausência de trabalho futuro nas demais funcionalidades.
