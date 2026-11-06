# Contrato de verificação da tarefa D02 — skill de imagens

Escopo: somente ferramenta local e instruções da skill. Não é a aprovação da spec 004 inteira nem das fotos reais. Autorização do responsável em 06/nov/2026 para a proposta de processamento/armazenamento da skill, registrada no ADR-005.

## Objetivo

Fornecer pipeline reproduzível para buscar, baixar seletivamente, revisar e preparar as fotos do inventário. A conta do professor, dados do banco, publicação e seleção/revisão das 12 fotos reais ficam fora desta tarefa.

## Critérios de aceitação

- CA-I01 · Skill única em skills/imagens-equipamentos, descoberta por AGENTS, name igual à pasta, referências e scripts existentes; validação do formato passa.
- CA-I02 · Busca limitada à API Pixabay por GET, foto/safesearch/min800×600; chave privada ausente falha antes da rede. Cache sanitizado dura 24 horas e não contém chave. Testes simulados provam os bloqueios; a busca real é relatada separadamente pelo principal.
- CA-I03 · Download é seletivo por patrimônio e ID de candidata consultada; origem HTTPS Pixabay/CDN, redirecionamento externo e excesso de tamanho bloqueados. Selecionar não aprova visualmente e reutilizar a mesma candidata não duplica o original/revisão.
- CA-I04 · Transformação produz WebP decodificável 800×600, preservando retrato/paisagem com bordas, sem corte automático. Testes usam imagens sintéticas e rejeitam arquivos inválidos; não são evidência de foto real adequada.
- CA-I05 · Pacote exige conjunto completo, revisão approved com revisor/data/motivo e hash do original atual. Rejeita mesmo ID/hash repetido e mudança após revisão; nova reprovação invalida pacote anterior. Repetição idêntica gera 12 arquivos com mesmos nomes e bytes.
- CA-I06 · Manifesto relaciona patrimônio, SHA-256, autor, ID, página, licença e destino fixo. A ferramenta não oferece upload nem cliente Supabase e só acessa a rede por GET do Pixabay. Registro de autoria não substitui revisão visual.
- CA-I07 · Chave não aparece em código, resposta de erro ou cache. Apenas nome vazio no exemplo. Configuração real e arquivos gerados são ignorados pelo Git/upload da Vercel. Nenhum código da skill é importado por Client Component.
- CA-I08 · Evidências distinguem ferramentas/testes sintéticos, busca real de candidatas, revisão visual ainda pendente e ausência de publicação. Não declarar os 12 equipamentos/fotos/conta publicados ou a spec 004 concluída ao terminar D02.

## Contratos e evidências

Código em skills/imagens-equipamentos/scripts; inventário de busca em assets/inventario.json; testes locais em tests/imagens/pipeline.test.mjs. Evidências da tarefa em docs/verificacoes/imagens/. A população não herda autorização desta etapa. Para selecionar as fotos reais, seguir D03 e o roteiro da skill, sem aprovar por texto de busca ou por teste sintético.
