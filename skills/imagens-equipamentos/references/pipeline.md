# Pipeline local

Executar na raiz do EmpresTI com npm. Requer Node 24 e sharp instalado pelo lockfile.

```powershell
npm run imagens -- buscar
npm run imagens -- baixar TI-0001 <id-retornado>
npm run imagens -- preparar
npm run imagens -- verificar
```

Para buscar/baixar, o operador configura `PIXABAY_API_KEY` no ambiente local ignorado. Nesta sessão o responsável confirmou `.env`; o comando carrega esse arquivo e, se existir, `.env.pixabay.local` como configuração específica da skill. Não colar o valor no chat. O comando usa o suporte de ambiente do Node; o agente não abre/imprime esses arquivos. Preparação e validação são offline e não precisam da chave.

Arquivos locais em `.local/imagens-equipamentos/`, fora do Git/upload da Vercel:

- `cache/`: resultados sanitizados da busca, sem chave.
- `candidatos.json`: candidatas com origem/autor; busca inicial de oito por patrimônio e refinamentos autorizados de até três páginas de oito por termo.
- `originais/<patrimonio>-<id>.image`: candidata baixada, ainda não aprovada.
- `selecoes.json`: patrimônio, candidata e SHA-256 dos bytes baixados.
- `revisao.json`: lista de decisões, mantendo reprovações anteriores. Cada entrada contém assetTag, candidateId, sourceSha256, decision (`approved` ou `rejected`), reviewer, reviewedAt (ISO 8601) e reason. Entradas pending não autorizam preparar.
- `preparadas/<patrimonio>.webp` e `manifesto.json`: pacote final, criado somente se o conjunto inteiro passar.

Após inspecionar uma foto, acrescente uma decisão vinculada à seleção atual. O script não atribui aprovação nem identidade de revisor. Não publique originais ou arquivos de revisão como se fossem o pacote final. Não selecionar a mesma foto para dois patrimônios.

`preparar`: transforma os originais aprovados em WebP 800×600, qualidade 85, contain e bordas #0B1128; remove metadados de imagem por padrão do sharp. Verifica dimensão/formato, unicidade por ID/hash e limite de 1 MiB por saída. Nenhum upload, banco ou cliente Supabase é usado.

`verificar`: reconstrói o resultado esperado offline a partir das seleções e revisões atuais e compara arquivos/manifesto. Uma revisão posterior reprovando a foto, alteração do original ou edição do manifesto invalida o pacote anterior. Reexecução idêntica preserva nomes, quantidades e bytes; mudança de candidata altera o conteúdo no mesmo destino previsto.

Sem chave: buscar/baixar param antes da chamada de rede, com mensagem pelo nome da variável. Sem revisão, com arquivo inválido, repetição ou conjunto incompleto: preparar falha sem criar um novo manifesto. Uma falha não elimina um pacote anterior; sempre rodar verificar antes de entregar ao operador.

## Galeria e refinamento em D03

O responsável autorizou refinar as buscas e permitir apenas inscrições técnicas de fábrica. A exceção não permite marcas/logos, pessoas, texto acrescentado ou telas com conteúdo; decisão em ADR-005 e spec 004. Recusas anteriores à exceção permanecem no histórico; uma eventual reconsideração exige nova inspeção/entrada vinculada aos bytes.

```powershell
node --env-file=.env skills/imagens-equipamentos/scripts/refinar.mjs
node skills/imagens-equipamentos/scripts/galeria.mjs
python -m http.server 3002 --bind 127.0.0.1 --directory .local/imagens-equipamentos/preview
```

O refinamento consulta termos alternativos, preserva o conjunto anterior se uma busca não retornar nada e não baixa fotos automaticamente. Seleções/revisões existentes não são apagadas. Refinamentos adicionais podem usar `search` com página 1–3 e categoria opcional `computer`; cache separa esses parâmetros.

Acesse http://127.0.0.1:3002/ para ver somente as fotos aceitas e os patrimônios pendentes. `candidatas.html` reúne resultados de busca e recusas; essas imagens remotas são prévias temporárias. A página inicial usa cópias locais transformadas dos originais com revisão aprovada e hash conferido. Essa prévia parcial não cria nem substitui o manifesto final. Após novas decisões, execute novamente `galeria.mjs`. Sirva somente `preview/`, nunca a raiz do projeto.
