# Tarefas 004 — Dados iniciais

Implementação de dados/imagens pendente. D01 concluída separadamente por autorização explícita; evidência abaixo não aprova a funcionalidade inteira.

- [ ] D00 · Fechar biblioteca, formato/recorte, Storage, reexecução e contas existentes. Pré-requisito de CA-D02/D03/D05/D06/D07.
- [x] D01 · Configurar e provar verificador isolado, com saída estável por critério. Pré-requisito de CA-D08: sessão separada, contexto limpo, MCP de leitura e seis testes locais; fixture reprovada em f26262e e restaurada em 27b503f. Tabelas/recibos em docs/verificacoes/verificador/. CA-D08 completo ainda depende da verificação da spec 004 implementada em D07.
- [x] D02 · Criar skill e scripts locais de busca/preparação Pixabay. Contrato de ferramenta em skill.md: oito critérios aprovados na terceira rodada independente, nove testes de imagens e consulta real de 96 candidatas para 12 patrimônios. Evidências em docs/verificacoes/imagens/. Não aprova fotos reais nem CA-D03/D07 integrais da spec 004; seleção/revisão é D03, população/publicação permanecem pendentes.
- [x] D03 · Selecionar e revisar as 12 imagens; registrar rejeições reais e manifesto. CA-D03/D04 locais: 12 WebP 800×600 distintos, preparar/verificar e reexecução passaram. TI-0003/TI-0004 substituídos por foco no notebook. TI-0012 usa foto de câmera de ação compacta e TI-0007 usa ilustração, ambas representações confirmadas pelo responsável no ADR-005. Evidências atuais em docs/verificacoes/imagens/d03-final.md, d03-final.json e d03-manifesto.json; d03-parcial preserva a etapa anterior. Sem upload; não conclui a spec 004 inteira.
- [ ] D04 · Apresentar e aprovar DDL; criar migration de imagens/policies se necessária e verificá-la do zero. CA-D01/D03/D05.
- [ ] D05 · Preparar dados idempotentes e teste de reexecução/conflitos em banco descartável. CA-D01/D02.
- [ ] D06 · Preparar provisionamento seguro e testes locais de perfil/vínculo, duplicação e conflitos. CA-D06/D07.
- [ ] D07 · Rodar checks e verificador; registrar erro plantado e restauração sem executar contra produção. CA-D08.
- [ ] D08 · Operador publica imagens, dados e conta; anexar evidências de URLs públicas, proteção de escrita, repetição e login com zero empréstimos. CA-D05/D06.
- [ ] D09 · Atualizar ENTREGA.md com caminhos/linhas, commits e tabelas reais. CA-D08.
