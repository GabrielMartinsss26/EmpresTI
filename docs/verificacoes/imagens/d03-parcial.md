# D03 — Seleção parcial, 06/nov/2026

O responsável autorizou refinar as buscas e permitir apenas inscrições técnicas de fábrica. ADR-005 e spec 004 registram a alteração da leitura inicial de “sem texto”. Marcas/logos legíveis, pessoas, texto acrescentado e telas com conteúdo permanecem proibidos.

Dez originais foram aceitos após inspeção visual pelo Codex. Isso não atribui aprovação ao usuário nem comprova modelo, tamanho ou condição física dos patrimônios. Fotos são ilustrativas. TI-0007 e TI-0012 ainda não têm foto válida; as últimas candidatas foram recusadas por marcas/adequação. O histórico real, com datas, motivos, hashes e fontes, está em d03-parcial.json; recusas anteriores à exceção foram preservadas.

A galeria em http://127.0.0.1:3002/ apresenta dez prévias locais 800×600 e duas lacunas. O link candidatas.html mostra resultados de busca temporários e recusas. Originais/cache/prévias ficam ignorados em .local/imagens-equipamentos/. Não há pacote final, upload, dados ou conta publicados.

Verificações do principal:

- Dez testes de imagens passaram, incluindo separação de cache por página/categoria e recusa de paginação fora de 1–3 antes da rede.
- Sete testes do verificador, lint, Prettier dos scripts/teste/inventário e git diff --check passaram.
- Navegador local confirmou dez cartões aceitos, dois pendentes e dez imagens; captura inspecionada em .local/imagens-equipamentos/preview/selecao-atual.png.
- Metadados dos dez arquivos conferidos: WebP 800×600. Hash dos originais comparado às revisões antes de gerar as prévias.
- Comando real preparar terminou com código 1 e “Revisão visual aprovada e identificada é obrigatória para cada foto.” É bloqueio esperado; não houve manifesto final aceito.
- Aplicação local /login respondeu HTTP 200. Nenhum código de aplicação, dependência ou schema foi alterado; build não repetido nesta etapa.

D03 permanece incompleta; CA-D03 integral ainda não demonstrado. Nenhuma verificação independente da spec 004 inteira foi alegada; ela depende das demais tarefas e do fechamento em D07.
