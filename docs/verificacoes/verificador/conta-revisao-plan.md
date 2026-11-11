# Plano 004 — Dados iniciais

Status atual: D01–D07 executadas; dados/imagens publicados em 07/nov e conta do professor criada/conferida em 10/nov/2026. Revisão histórica D08-R2: CA-D01/D02/D03/D04/D05/D08 ATENDE; CA-D06 SEM TESTE antes da criação da conta, e CA-D07 NÃO ATENDE. A nova prova de CA-D06 aguarda avaliação independente; o isolamento original permanece pendente e a spec NÃO PRONTA. Critérios e pareceres históricos preservados.

1. Resolver lacunas da spec e registrar alternativas; apresentar modelo de metadados/policies/DDL. Biblioteca e processamento foram aprovados na proposta da skill e registrados no ADR-005; sharp não foi instalado por mera menção no enunciado.
2. Preparar verificador e skill conforme `docs/pratica.md`, com restrição efetiva de produção. Respeitar ADR-001 e ADR-002; skill não cria paleta nem altera landing.
3. Preparar busca Pixabay, cache, seleção, download e transformação local. Separar roteiro da skill, referências do provedor e scripts determinísticos. Validar dimensão, duplicação, origem e revisão visual.
4. Implementar referências de imagem aprovadas via Prisma Migrate e SQL de proteção versionado. Testar do zero em PostgreSQL descartável, sem editar migration inicial.
5. Implementar população idempotente e provisionamento por configuração segura, com pré-validação do destino. Não herdar conexão remota da aplicação local.
6. Rodar checks aplicáveis e verificador. Fazer erro plantado somente em teste local isolado, registrar reprovação e restauração em commits separados. Verificador não corrige.
7. Entregar comandos e artefatos para o operador publicar dados/conta/imagens. Registrar evidências de produção separadas de testes locais e preencher ENTREGA.md.

Nenhum passo externo será executado pelo agente. Tarefas em `tasks.md`.

## Recorte de execução D05

- `prisma/dados-pratica.ts`: inventário confirmado, validação dos arquivos/manifesto e população transacional; sem cliente global nem leitura de conexão do ambiente.
- `tests/db/dados-pratica.test.ts`: PostgreSQL descartável, reexecução, preservação e conflitos; imagens sintéticas nos testes.
- `tests/db/d05-local.ts`: comando separado que cria seu próprio container, confere o pacote real D03, popula duas vezes e encerra o container. Não recebe URL de banco nem importa o cliente da aplicação.
- Evidências em `docs/verificacoes/imagens/d05-*`; documentação e handoff atualizados. Seed atual permanece somente com o tenant. Sem migration, dependência, upload ou interface nova.

Validação completa do pacote antes da transação; dentro dela, conferir todos os registros e somente então criar ausentes. Transação serializável, sem retry silencioso; colisão concorrente também aborta o lote. Campos não definidos pela prática não são comparados nem atualizados. Relatório técnico local não define o conteúdo futuro da auditoria de população da aplicação, pendente no ADR-006.

## Recorte de execução D06

- `prisma/conta-correcao.ts`: configuração validada por Zod, contrato mínimo de identidade e preparação de perfil/membership via Prisma. Sem cliente global, leitura implícita do ambiente ou implementação HTTP de administração do Supabase.
- `tests/db/auth-fixture.ts`: implementação de identidade simulada em `auth.users` somente no container. Não é GoTrue; não fornece login/token/cookie. Guarda hash de segredo efêmero para provar preservação na reexecução.
- `tests/db/conta-correcao.test.ts`: banco real para perfil/vínculo/FK, identidade simulada, conflitos, reexecução, falha parcial e recuperação; fixtures sem senha literal.
- `tests/db/d06-local.ts`: cria container próprio, tenant e identidade de teste; prepara duas vezes, confere resultado e encerra. Não aceita destino nem credencial remota. Relatório ignorado `.local/d06-local.json`.
- `npm run conta:local`, documentado em AGENTS; recibo e execução em `docs/verificacoes/imagens/d06-*`. Sem schema/migration/dependência/UI nova; seed atual intacto.

Pré-validar tenant ativo, identidade compatível e dados existentes antes de criar. Apenas perfil/membership compartilham transação serializável: Auth e domínio não possuem transação distribuída. Se criar identidade e a etapa de domínio falhar, informar estado parcial sem apagar a identidade ou trocar senha; reexecução consulta o estado e completa somente os ausentes após nova validação. Falha ambígua de criação exige nova consulta, nunca criar de novo às cegas. Erros externos não propagam payload, causa, senha ou URL; relatórios contêm somente etapa, estado e contagens.

Senha de nova identidade entra por configuração explícita de servidor; reexecução com identidade existente não exige senha nem a compara/atualiza. O comando local gera segredo efêmero em memória e não carrega `.env`. A senha real da turma e o login real permanecem em D08, por operador, sem SQL direto de criação em tabelas internas do Auth. Não apresentar a fixture como autenticação Supabase validada.

## Recorte de execução D07

Autorizado pelo responsável em 07/nov/2026: manter registro das mudanças, criações e decisões. Não muda regras do produto ou autoriza publicação.

1. Executar checks e preparar recibos atuais com comando, saída, código de saída, revisão e hashes das fontes; conferir pacote D03 e executores locais D05/D06.
2. Conferir o lançador isolado com a fixture íntegra. Não substituir delegação indisponível pela revisão do principal.
3. Plantar somente em `tests/verificador/`: limite incorreto no contrato e ausência do teste de aprovação, preservando o requisito na spec. Registrar falha esperada e commit explicitamente de demonstração; esta é a exceção controlada de teste vermelho exigida pela prática, não entrega de funcionalidade quebrada.
4. Executar verificador independente e guardar tabela/delegação reais. Restaurar pelo principal em commit separado, executar novamente testes e revisão da fixture; nunca alterar spec para aceitar o erro.
5. Executar revisão independente da spec 004 inteira com os recibos atuais; corrigir somente achados locais dentro do escopo, sem inventar prova de produção. Guardar todos os critérios/limitações e eventuais rodadas, mesmo reprovadas.
6. Registrar evidências em `docs/verificacoes/verificador/d07-*` e atualizar tarefas/handoff. Logs brutos ficam em `test-results/verificador/`; auxiliares/recibos transitórios em `.local/`. Não tocar nos HTMLs de Aulas/ do usuário.

CA-D05 e a parte remota de CA-D06 continuam dependentes de D08. Qualquer SEM TESTE/BLOQUEADO/NÃO ATENDE mantém a spec NÃO PRONTA; concluir a execução da D07 não significa publicar ou aprovar a spec inteira.

## D08 delegada — recorte atual

Autorização atual e exceção de execução no ADR-007; conta adiada expressamente. CA-D07 continua BLOQUEADO, sem mudança no critério. Pré-consulta de leitura confirmou projeto correto, tenant ativo, migration inicial aplicada, nenhum bucket e nenhum dos 12 equipamentos no destino.

1. Acrescentar simulação sem escrita ao módulo D05 (`prisma/dados-pratica.ts`), com teste de banco descartável.
2. Criar `scripts/publicar-pratica.ts`: destino fixo conferido, argumentos explícitos `--project`/`--apply`, configuração Zod e erros sanitizados; nunca importado pela aplicação. Usar SDK já instalado, sem dependência nova. Testes puros de destino/configuração em `tests/unit/publication-config.test.ts`; incluir `scripts` no check de formatação e excluir artefatos ignorados `.local` do lint.
3. Validar arquivos/manifesto D03 antes de qualquer mutação. Conferir migrations e destino; aplicar somente a linha de migrations inicial+D04 aprovada via Prisma Migrate, sem SQL de schema avulso.
4. Simular lote e conferir objetos existentes antes de upload. Criar/reutilizar somente bucket público `equipamentos`, limitado a WebP/1 MiB. Nunca tornar outro bucket público, substituir objeto divergente ou excluir dado existente.
5. Publicar ausentes e executar a população transacional aprovada. Repetir o processo, comparar arquivos/IDs/timestamps e verificar GET público/hash/dimensões. Verificação negativa de escrita anônima usa caminho de prova novo, nunca objeto de equipamento existente; limpar somente esse objeto de prova caso ocorra sucesso indevido e interromper.
6. Não criar conta do professor. Guardar recibo sanitizado e a separação entre integração real e testes locais em `docs/verificacoes/imagens/d08-*`; registrar falhas/retomada e atualizar continuidade.

O controle de destino, a simulação e a preservação são proteções do executor; não são apresentados como isolamento de todas as ferramentas da sessão. SDK/API de Storage seguem a documentação oficial do Supabase, consultada em 07/nov/2026. Sem deploy Vercel ou push nesta autorização.
