# ADR-006: Referências de imagem e proteção do Storage

Status: aprovado pelo responsável em 06/nov/2026, após a proposta D04 do commit `c2f4b28`. Autoriza implementação e testes locais da D04; produção continua com o operador. Complementa ADR-001, ADR-003 e ADR-005.

## Decisões

| Item | Escolha |
|---|---|
| Metadados | Tabela `equipment_images`, com tenant e referência composta ao equipamento do mesmo tenant |
| Quantidade | Zero ou uma imagem principal por equipamento |
| Conteúdo | Caminho, origem/autor/licença, tipo, dimensões, tamanho, hashes e revisão identificada, conforme proposta D04 aprovada |
| Destino | Bucket `equipamentos`, caminho relativo estável por tenant/patrimônio; sem FK para tabelas internas do Storage |
| URL | Compor com a URL pública do ambiente; não gravar domínio na tabela |
| Leitura de domínio | Backend tRPC/Prisma com tenant; acesso direto negado por privilégios e RLS |
| Exclusão de referência | Desativação; trigger impede DELETE físico |
| Acesso ao arquivo | Download público do bucket; clientes `anon`/`authenticated` não listam nem escrevem objetos desse bucket |
| Publicação da prática | Somente operador; a sessão Admin da aplicação não recebe upload |
| Policy de Storage | Guard restritivo específico para `equipamentos`, preservando as permissões dos demais buckets |
| Formato/tamanho no bucket | `image/webp`, até 1.048.576 bytes; configuração futura pelo operador |
| Migração | Nova migration Prisma com DDL, checks, RLS e trigger; não editar a migration inicial |
| Prova local | PostgreSQL 16 descartável por Testcontainers; fixtures explícitas do Auth/Storage, sem alegar servidor Storage real |

## Justificativas

- Metadados: não espalhar créditos e revisão no cadastro do equipamento.
- Quantidade: atende a prática e mantém equipamentos antigos sem imagem válidos.
- Conteúdo: permite conferir origem, bytes e revisão do arquivo usado.
- Destino: mantém os caminhos da D03 e o ciclo de vida dos arquivos na API do serviço.
- URL: mudar o ambiente não exige atualizar cada linha.
- Leitura: preserva a autorização principal e o isolamento definidos no projeto.
- Exclusão: mantém a referência e o histórico quando deixa de ser usada.
- Acesso: abrir uma foto pública não precisa liberar listagem ou alteração de arquivos.
- Publicação: mantém a escrita de produção com o operador, conforme o recorte da prática.
- Policy: uma policy permissiva ampla não deve liberar esse bucket pelo OR.
- Formato: corresponde ao pacote aprovado em D03.
- Migração: mantém schema e proteção na mesma linha do tempo.
- Prova: constraints e policies precisam ser exercitadas no PostgreSQL real, com papel sem owner.

## Alternativas descartadas

- Todos os campos em `equipment`: mistura cadastro, créditos e revisão e cria campos opcionais para os dados antigos.
- Somente URL: perde origem, licença e hashes e acopla o registro ao domínio do ambiente.
- Bytes/base64 no banco: contraria o Storage escolhido e aumenta o volume de leitura e backup.
- Várias imagens agora: exige ordenação e escolha de principal que a prática não pede.
- Upload por Admin/Operações da aplicação: cria um fluxo fora do recorte autorizado.
- Bucket privado: contraria a leitura pública do ADR-005.
- Negação apenas permissiva no Storage: outra policy permissiva pode conceder acesso.

## Consequências

Fica mais fácil conferir imagem/créditos e preservar equipamentos existentes. Fica mais difícil coordenar arquivos e referências: Storage e PostgreSQL não compartilham uma transação. Desativar uma referência não revoga a URL pública. O banco valida metadados, mas não prova existência, conteúdo ou hashes do objeto; pipeline e importação precisam conferir isso.

Várias imagens exigirão mudar a unicidade e o contrato. Trocar no mesmo caminho exige tratar cache; renomear tenant/patrimônio pode exigir mover objetos e referências. Não há unicidade global de ID/hash da origem; a importação deverá verificar o conjunto inicial sem proibir o uso da mesma foto pública por outro tenant.

As tabelas do serviço Storage não são criadas pela migration da aplicação. O teste prepara fixtures locais dessa infraestrutura, assim como já faz para Auth. Privilégios de owner/bypass de RLS não são bloqueados pelo guard; isso não constitui isolamento global da sessão do agente.

Na geração local, o Prisma exigiu também `UNIQUE (equipment_id, tenant_id)` para modelar a relação composta como um-para-um. Ela é redundante com a unicidade de `equipment_id` e não muda a cardinalidade ou o acesso aprovados; integra a migration e seus testes.

O SQL final usa uma única instrução `DO`, atômica, em vez do `BEGIN/COMMIT` externo do rascunho. Nos testes de pré-condição, o Prisma ocultava a causa ao tentar registrar falha numa conexão abortada pelo `BEGIN`; o bloco único preserva rollback e a mensagem original. A comparação global por `migrate diff --from-url` também esbarrou na FK manual já existente de `profiles` para `auth.users`. Ela foi preservada; os testes conferem colunas/tipos/nulabilidade do modelo novo contra o catálogo real, além de índices, FKs e comportamento, sem remover a proteção de Auth.

## O que este ADR NÃO decide

- Conflitos com equipamentos/imagens existentes alterados ou inativos e política detalhada de população, em D05.
- Conta existente/inativa do professor, em D06, ou alteração de prazos antigos, na spec 005.
- Conteúdo exato da auditoria de população, upload por interface, múltiplas imagens ou histórico de versões de arquivos.
- Autorizar o agente a criar bucket, publicar objetos, executar migration remota ou fazer push.

## Registro dos passos

1. A proposta foi criada e apresentada em `c2f4b28`, antes de alterar schema/migrations, atendendo `rules/migration.md`.
2. O responsável aprovou explicitamente a implementação e os testes locais nesta conversa.
3. Este ADR registra a aprovação antes do código; execução e resultados reais serão anexados à D04. Não houve execução anterior à proposta/aprovação a ser declarada no histórico.
