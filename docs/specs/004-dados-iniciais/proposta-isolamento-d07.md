# Proposta pendente — Isolamento exigido por CA-D07

Status: proposta para decisão, não implementação aprovada. Nenhum ADR, permissão do computador ou ambiente foi alterado. Origem: parecer independente `docs/verificacoes/verificador/d07-integral.md`.

## Problema constatado

Os executores de dados/conta criam containers próprios e o verificador tem ferramentas de leitura. Isso não comprova que **a sessão principal inteira** está impedida de escrever em produção. A sessão atual possui ferramentas amplas; a aplicação local usa configuração do mesmo Supabase de produção. Não podemos transformar restrição escrita em prova de bloqueio técnico.

A auditoria adicional `d07-auditoria.json` não encontrou os padrões pesquisados em 267 blobs textuais históricos ou quatro logs dedicados, nem caminhos de ambientes reais versionados. É uma auditoria limitada por padrões e referências locais, não uma prova de ausência de toda credencial possível ou de isolamento de execução. O parecer original e CA-D07 BLOQUEADO são preservados.

## Caminho proposto para aprovação

Preparar um ambiente separado, controlado externamente pelo operador, antes de continuar qualquer etapa que dependa da aprovação integral:

1. Exportar somente fontes/fixtures/artefatos públicos necessários, sem ambientes reais, histórico Git ou autenticações/sessões de Supabase/Vercel/GitHub. Não copiar esta conversa para o agente do ambiente separado. A cópia original e o servidor atual ficam preservados.
2. Instalar previamente dependências/imagens necessárias e executar os testes com PostgreSQL descartável dentro do ambiente separado; sem acesso ao Docker ou aos arquivos do host de produção.
3. Aplicar bloqueio efetivo de saída para os serviços de produção por controle fora do alcance das ferramentas do agente. Permitir somente o necessário à inferência e ao ambiente local de testes; o agente não pode liberar suas próprias permissões. O mecanismo concreto (VM/sandbox e política externa) ainda precisa de escolha e prova pelo operador.
4. Conferir ausência de configuração de produção e demonstrar bloqueios com alvos controlados, sem credenciais nem operação de escrita no destino real. Guardar configurações sanitizadas e resultados do controle externo, além dos recibos locais.
5. Abrir sessão limpa com apenas os caminhos da spec/artefatos; executar novamente os checks e o verificador independente. Só a nova evidência pode desbloquear CA-D07; não reclassificar o parecer antigo.

Esta proposta não contém um comando que configure a proteção, não afirma compatibilidade já testada do mecanismo e não autoriza instalar infraestrutura ou mudar permissões nesta sessão. Se aprovada como decisão estrutural, registrar em ADR antes de configurar, conforme `rules/restrictions.md`.

## Alternativas e consequências

| Alternativa | Consequência |
|---|---|
| Ambiente separado com controle externo efetivo | Permite produzir a prova faltante, mas exige preparação do operador, nova execução e evidências do mecanismo escolhido |
| Manter o bloqueio registrado por enquanto | Preserva o estado atual sem mudança de infraestrutura; a spec continua NÃO PRONTA e CA-D07 não pode ser declarado atendido |
| Somente nova regra escrita ou outro banco de desenvolvimento | Considerada insuficiente isoladamente: não impede a sessão atual de usar outras ferramentas ou configurações de produção |

Escolha do ambiente, política concreta, execução e autorização de publicação: **não decidido nesta proposta**. Não reduzir o critério nem alterar a spec para obter aprovação.
