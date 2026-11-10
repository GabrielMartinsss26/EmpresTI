# Conta do professor — 10/nov/2026

Após o adiamento anterior, o responsável pediu explicitamente a criação da conta prevista na prática. Destino: projeto Supabase existente, organização suporte_ti; nome e papel COLLABORATOR conforme spec 004. Autorização restrita a esta conta.

A consulta anterior encontrou zero identidades para o e-mail esperado e organização ativa. O principal executou `provisionCorrectionAccount`, implementação D06 já testada, com adaptador Supabase Auth e PostgreSQL via Session Pooler. Criados uma identidade confirmada, um perfil e um vínculo. Uma segunda execução retornou zero criações, sem trocar senha ou dados. A senha padrão foi obtida em execução do enunciado e não foi escrita em novo arquivo versionado ou log.

A autenticação com a senha prevista passou no Supabase Auth; usando a sessão autenticada e cookies de servidor, GET da rota publicada `/catalogo` retornou HTTP 200. A consulta ao banco confirmou perfil, vínculo e organização ativos, papel COLLABORATOR e zero empréstimos. Nenhum pedido ou empréstimo foi criado para esta conta. Isso confirma autenticação e acesso HTTP, sem afirmar que houve teste manual do formulário no navegador.

Recibo sanitizado: `docs/verificacoes/conta-professor-20261110.json`. Relatórios D08 anteriores são históricos e não foram reescritos; uma nova revisão independente é necessária para atualizar a classificação formal de CA-D06. CA-D07 continua NÃO ATENDE por isolamento global; a spec 004 inteira permanece NÃO PRONTA. Sem alterar schema, publicar nova versão, push ou tag.
