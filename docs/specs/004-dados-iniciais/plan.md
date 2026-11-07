# Plano 004 — Dados iniciais

Status: D01–D06 executadas localmente. A proposta D04 foi apresentada em c2f4b28 e depois aprovada explicitamente para implementação e testes; decisão no ADR-006 e resultados em docs/verificacoes/imagens/d04-execucao.md. D05/D06 autorizadas e verificadas em 07/nov/2026, com políticas das regras 7/9 aprovadas antes do código. D06 usa identidade simulada e não comprova login real; evidências em docs/verificacoes/imagens/d06-execucao.md. Próxima tarefa: D07. Nenhuma autorização de produção.

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
