# Plano — Cadastro de acesso

Status: cancelado em 05/nov/2026 junto da proposta de autocadastro. Nenhuma etapa abaixo deve ser executada. Permanece o cadastro por convite; a funcionalidade de convites será especificada futuramente.

## Ordem

1. Fechar a decisão de acesso após cadastro, registrar a mudança do convite obrigatório em ADR e atualizar as specs afetadas.
2. Fechar critérios de entrada, senha, confirmação, erros e provisionamento; derivar tarefas pequenas com IDs de aceite.
3. Implementar validação e procedimento tRPC usando a stack existente. Conferir sessão e permissões no servidor; limitar tentativas de cadastro.
4. Integrar Supabase Auth e criação consistente do perfil/vínculo. Planejar recuperação de falhas entre o provedor e o banco; não considerar ambos uma transação única.
5. Implementar `/cadastro` e a ação no login, preservando a navegação pela marca e o comportamento desktop.
6. Verificar cadastro, duplicidade, confirmação, permissões, navegação e regressão do login com os checks do AGENTS.md.

## Arquivos previstos

- `src/app/cadastro/page.tsx` e `src/components/register-form.tsx`.
- Extensão de `src/lib/auth-input.ts` e router de autenticação.
- Service de cadastro em `src/server/services/`.
- Testes unitários e de navegador, com IDs da spec.
- Specs, ADR de mudança e exemplos de ambiente, se o fluxo exigir variáveis novas.

Nenhuma dependência nova é proposta. Migração e configuração externa só serão definidas quando o fluxo for fechado. Deploy é uma etapa separada da implementação local.
