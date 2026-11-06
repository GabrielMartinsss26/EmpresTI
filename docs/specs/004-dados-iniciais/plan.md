# Plano 004 — Dados iniciais

Status: D01–D04 executadas localmente. A proposta D04 foi apresentada em c2f4b28 e depois aprovada explicitamente para implementação e testes; decisão no ADR-006 e resultados em docs/verificacoes/imagens/d04-execucao.md. D05/D06 aguardam suas decisões e autorização próprias; nenhuma autorização de produção.

1. Resolver lacunas da spec e registrar alternativas; apresentar modelo de metadados/policies/DDL. Biblioteca e processamento foram aprovados na proposta da skill e registrados no ADR-005; sharp não foi instalado por mera menção no enunciado.
2. Preparar verificador e skill conforme `docs/pratica.md`, com restrição efetiva de produção. Respeitar ADR-001 e ADR-002; skill não cria paleta nem altera landing.
3. Preparar busca Pixabay, cache, seleção, download e transformação local. Separar roteiro da skill, referências do provedor e scripts determinísticos. Validar dimensão, duplicação, origem e revisão visual.
4. Implementar referências de imagem aprovadas via Prisma Migrate e SQL de proteção versionado. Testar do zero em PostgreSQL descartável, sem editar migration inicial.
5. Implementar população idempotente e provisionamento por configuração segura, com pré-validação do destino. Não herdar conexão remota da aplicação local.
6. Rodar checks aplicáveis e verificador. Fazer erro plantado somente em teste local isolado, registrar reprovação e restauração em commits separados. Verificador não corrige.
7. Entregar comandos e artefatos para o operador publicar dados/conta/imagens. Registrar evidências de produção separadas de testes locais e preencher ENTREGA.md.

Nenhum passo externo será executado pelo agente. Tarefas em `tasks.md`.
