# Plano 004 — Dados iniciais

Status: proposta documental; aguarda revisão antes do código.

1. Resolver lacunas da spec e registrar alternativas; apresentar modelo de metadados/policies/DDL e biblioteca de imagens. Não instalar sharp por estar citado no enunciado.
2. Preparar verificador e skill conforme `docs/pratica.md`, com restrição efetiva de produção. Respeitar ADR-001 e ADR-002; skill não cria paleta nem altera landing.
3. Preparar busca Pixabay, cache, seleção, download e transformação local. Separar roteiro da skill, referências do provedor e scripts determinísticos. Validar dimensão, duplicação, origem e revisão visual.
4. Implementar referências de imagem aprovadas via Prisma Migrate e SQL de proteção versionado. Testar do zero em PostgreSQL descartável, sem editar migration inicial.
5. Implementar população idempotente e provisionamento por configuração segura, com pré-validação do destino. Não herdar conexão remota da aplicação local.
6. Rodar checks aplicáveis e verificador. Fazer erro plantado somente em teste local isolado, registrar reprovação e restauração em commits separados. Verificador não corrige.
7. Entregar comandos e artefatos para o operador publicar dados/conta/imagens. Registrar evidências de produção separadas de testes locais e preencher ENTREGA.md.

Nenhum passo externo será executado pelo agente. Tarefas em `tasks.md`.
