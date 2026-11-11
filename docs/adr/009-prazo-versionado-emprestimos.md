# ADR-009 — Prazo versionado dos empréstimos

Status: aprovado explicitamente pelo responsável em 09/nov/2026 após a proposta E01 do commit `86d8127`. Autoriza implementação e testes em PostgreSQL descartável; nenhuma publicação remota.

## Decisões

| Item | Escolha |
|---|---|
| Versão | Enum `LoanDueRule` e campo obrigatório `loans.due_rule` |
| Existentes | `LEGACY_CALENDAR_14`, preservando todos os valores anteriores |
| Novos | Default `BUSINESS_14_SP`, 14 dias úteis em São Paulo conforme ADR-004 |
| Validação | Função versionada v1 e CHECK por regra, sem reinterpretar datas legadas |
| Proteção | Trigger impede inserir legado novo e alterar início, vencimento ou regra após criação |
| Migration | Nova migration Prisma atômica, lock com timeout 5 s; anteriores intactas |
| Execução | PostgreSQL 16 descartável; SQL completo e plano de provas em proposta-e01.md |

## Justificativas

- Versão: distinguir o prazo usado sem recalcular o passado.
- Existentes: manter o vencimento que já foi combinado.
- Novos: aplicar os 14 dias úteis já decididos.
- Validação: não depender só do código da aplicação.
- Proteção: não permitir usar legado como escape ou mudar datas silenciosamente.
- Migration: preservar dados e falhar sem alteração parcial se não conseguir aplicar.
- Execução: testar upgrade e banco vazio antes de publicar.

## Alternativas descartadas

- Trocar a CHECK de todas as linhas: reinterpreta histórico e pode bloquear devoluções.
- Somente NOT VALID: a condição nova ainda se aplica a updates antigos.
- Somente TypeScript: remove validação de prazo no banco.
- Versionar sem guard: permite legado novo e alteração silenciosa de datas.

## Consequências

Fica mais fácil preservar empréstimos antigos e verificar os novos. Fica mais difícil manter cálculo SQL e TypeScript alinhados; testes precisam usar expectativas fixas. Renovação/correção de datas exigirá desenho próprio. Não alterar a função v1 para mudar a regra histórica; mudanças de calendário/fuso exigem revisão/versionamento, inclusive diante de mudanças externas de tzdata.

O SQL aprovado está em `docs/specs/005-solicitar-emprestimo/proposta-e01.md`. A autorização foi recebida depois da proposta e registrada neste ADR antes do schema/migration. Testes e ajustes técnicos serão registrados separadamente, sem fingir que já foram executados.

## O que este ADR NÃO decide

- Alterar o limite de três, aprovação, feriados ou o horário confirmado.
- Implementar E02, APIs, telas ou devolução.
- Ampliar a whitelist do publicador D08, aplicar no Supabase, fazer push ou deploy.
