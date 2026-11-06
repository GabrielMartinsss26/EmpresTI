# Spec 004 — Dados iniciais e imagens

Status: rascunho para revisão; implementação não autorizada por este documento. Decisões confirmadas em 06/nov/2026; lacunas abertas abaixo. Nenhum dado desta spec foi populado.

## Objetivo

Preparar os 12 equipamentos da prática com imagens do Pixabay e a conta do professor para correção, de forma repetível e sem credenciais versionadas. O operador executa a etapa de produção.

## Vínculo

- PRD, ADR-001 (stack), ADR-003 com atualização do ADR-004 (modelo e regras).
- Enunciado, entregas 2 e 3; adaptação para Pixabay confirmada pelo responsável.
- Login da spec 001 e sequência de `docs/pratica.md`.

## Regras

1. Usar tenant `suporte_ti`, com quatro categorias correspondentes à lista. Patrimônio continua único por tenant.
2. Local de retirada dos 12 itens: `Operações`. Número de série não informado permanece opcional, sem valor inventado.
3. Criar exatamente o conjunto inicial abaixo, sem criar empréstimos. Três itens em manutenção e nove disponíveis.
4. Preparar uma imagem distinta por patrimônio pela skill imagens-equipamentos, cuja única fonte será a API Pixabay. Nenhuma foto reprovada por pessoa, marca/logo legível, texto acrescentado ou tela com conteúdo será publicada. Em 06/nov/2026, durante D03, o responsável autorizou apenas inscrições técnicas de fábrica (letras das teclas, especificações da lente/conector). É uma exceção registrada ao texto estrito do enunciado; não autoriza marca/logo legível nem texto promocional/editorial.
5. Todas as imagens finais têm 800×600 reais, verificadas no arquivo; não basta aplicar dimensão no CSS. Guardar ID e URL de origem, autor, licença e vínculo ao patrimônio. Não repetir ID nem arquivo idêntico entre itens. Na revisão de D03, o responsável pediu substituir TI-0003/TI-0004 por fotos com o notebook como foco, reconhecível no enquadramento, em vez de apenas um canto do teclado.
6. Destino previsto: bucket público do Supabase Storage, com leitura pública e escrita restrita. ADR-005 define WebP 800×600, foto inteira com bordas e manifesto local com destino equipamentos / suporte_ti/patrimonio.webp. ADR-006 aprova `equipment_images`, zero/uma principal por equipamento, FK composta por tenant, créditos/revisão/hashes e desativação sem DELETE físico. RLS/privilégios negam acesso direto aos metadados; guard restritivo bloqueia `anon`/`authenticated` no bucket. Upload/configuração de produção continuam com o operador; nenhum bucket é criado pela migration.
7. Reexecução não duplica equipamentos, categorias, fotos, perfis nem vínculos. Comportamento diante de dados existentes alterados/inativos: não decidido; não sobrescrever silenciosamente.
8. Conta do professor: `marcelo.grilo@institutojef.org.br`, nome `Marcelo Grilo`, papel `COLLABORATOR` em `suporte_ti`, com login funcional e zero empréstimos. A senha da turma será fornecida pelo operador por configuração não versionada; nunca literal no seed.
9. Não usar a conta do professor para operações de empréstimo. Testes usam identidade própria ou fixtures locais descartáveis. Conta existente/inativa: tratamento não decidido.
10. Preparação e testes pelo agente são locais; publicação de dados, imagens e conta pelo operador conforme `docs/pratica.md`.

## Inventário confirmado

| Patrimônio | Nome | Categoria | Situação | Busca do enunciado |
|---|---|---|---|---|
| TI-0001 | Notebook 14 polegadas | notebook | disponível | laptop on white desk |
| TI-0002 | Notebook 15 polegadas | notebook | disponível | open laptop minimal desk |
| TI-0003 | Notebook 13 polegadas | notebook | disponível | laptop closeup keyboard |
| TI-0004 | Notebook 15 polegadas | notebook | manutenção | closed laptop on table |
| TI-0005 | Monitor 24 polegadas | monitor | disponível | computer monitor on desk |
| TI-0006 | Monitor 27 polegadas | monitor | disponível | monitor screen office desk |
| TI-0007 | Monitor 22 polegadas | monitor | manutenção | black computer screen |
| TI-0008 | Cabo HDMI 2 m | cabo | disponível | hdmi cable |
| TI-0009 | Cabo USB-C 1 m | cabo | disponível | usb cable white background |
| TI-0010 | Cabo de rede 3 m | cabo | manutenção | ethernet cable |
| TI-0011 | Webcam Full HD | camera | disponível | webcam |
| TI-0012 | Câmera compacta | camera | disponível | compact camera on table |

TI-0010 é o cabo de rede Ethernet para conexão cabeada. Ele consta da prática; a divergência está na situação, não na presença do equipamento. O responsável escolheu a lista de três em manutenção.

Em D03 o responsável confirmou que TI-0012 pode ser ilustrado pela foto de uma câmera de ação compacta. O nome e a categoria acima são preservados; não se afirma que a foto retrata o patrimônio físico.

Exceção confirmada em D03: somente TI-0007 pode usar a ilustração Pixabay ID 313011, apresentada ao responsável antes da aprovação. Portanto, são 12 imagens distintas, com 11 fotografias e essa ilustração. A exceção diverge da exigência inicial de fotos e fica registrada no ADR-005; demais critérios visuais são mantidos.

## Critérios de aceitação

- CA-D01 · Em banco descartável preparado, existem os 12 patrimônios, nomes e categorias da tabela, com local Operações e nove disponíveis/três em manutenção; nenhuma linha de empréstimo é criada.
- CA-D02 · Rodar a população duas vezes preserva IDs e quantidades. Casos de conflito seguem política aprovada antes do código; sem exclusão ou reset silencioso.
- CA-D03 · As 12 imagens finais são decodificáveis, distintas e medem exatamente 800×600; manifesto associa cada arquivo ao patrimônio, ID Pixabay, autor, origem e licença.
- CA-D04 · Revisão visual registra aprovação/reprovação e motivo para cada candidata selecionada, comprovando exclusão de conteúdo proibido.
- CA-D05 · No destino publicado pelo operador, URLs de imagem abrem sem login e reexecução não duplica objetos. Escrita pública é negada.
- CA-D06 · Provisionamento local descartável repetido não duplica identidade, perfil ou membership; conta de correção tem papel COLLABORATOR e zero empréstimos. No destino, operador confirma login sem gerar empréstimos.
- CA-D07 · Scripts, manifests, logs e histórico não contêm as credenciais usadas no provisionamento ou na busca. O agente não possui caminho executável de escrita no destino de produção durante a prática.
- CA-D08 · Verificador independente emite tabela de todos os critérios com evidência; critério sem evidência não é aprovado. Estado publicado exige evidência do operador, não inferência de testes locais.

## Fora de escopo

Catálogo nesta spec, interface de cadastro, importação de planilha, convites, autocadastro, empréstimos e alteração de imagens de landing/logo. O catálogo será tratado na spec 005.

## Contrato afetado

Scripts de preparação/provisionamento e dados iniciais; modelo/referências de imagem e proteção definidos no ADR-006 e na migration local `202611060001_equipment_images`. Seed atual cria apenas o tenant: não declarar que já satisfaz esta spec. Não definir conta padrão ou segredo no seed de desenvolvimento.

## Pendências e decisões

A proposta de modelo, policies, DDL e testes locais está em [proposta-d04.md](proposta-d04.md), criada em c2f4b28 e depois aprovada explicitamente para implementação/testes locais. ADR-006 registra a decisão antes do código. Conflitos de reexecução, contas existentes e publicação continuam em tarefas próprias.

Biblioteca/processamento/crédito foram aprovados no ADR-005; metadados e proteção do Storage no ADR-006, implementados/testados somente em banco descartável em D04. Provisionamento do bucket e publicação continuam com o operador. Política de reexecução de dados e contas existentes seguem não decididas, bloqueando suas tarefas dependentes. Provas locais não aprovam a população, conta ou publicação; CA-D01–D08 integrais continuam pendentes.
