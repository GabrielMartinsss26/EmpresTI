# D03 — Pacote local validado

Em 06/nov/2026 o responsável pediu ampliar a busca e substituir TI-0003/TI-0004 por fotos com foco no notebook. A busca foi ampliada para até dez páginas de oito resultados por termo; também foram consultados resultados recentes. O cache separa ordenação, termo, página e categoria. Candidatas foram mescladas às anteriores; apenas selecionadas foram baixadas para inspeção do original.

## Decisões confirmadas pelo responsável

- Inscrições técnicas de fábrica podem aparecer; pessoas, marcas/logos legíveis, texto acrescentado e telas com conteúdo continuam proibidos.
- TI-0012 pode usar a fotografia da câmera de ação compacta ID 2125547.
- Somente TI-0007 pode usar a ilustração ID 313011 apresentada no chat. A API devolveu `type=illustration`; não foi classificada como fotografia. Origem: https://pixabay.com/illustrations/monitor-isolated-display-white-313011/.
- São 11 fotografias e uma ilustração. Exceções explícitas no ADR-005/spec 004; não foram estendidas aos outros itens.

## Substituições e complementos

| Patrimônio | Antes | Agora |
|---|---|---|
| TI-0003 | ID 865091, só detalhe do notebook | ID 925806, notebook como foco em primeiro plano |
| TI-0004 | ID 4337524, só detalhe do notebook | ID 1868510, notebook inteiro na mesa |
| TI-0007 | Sem imagem aprovada | Ilustração ID 313011, exceção confirmada |
| TI-0012 | Sem imagem aprovada | Fotografia ID 2125547, tipo de câmera confirmado |

Inspeção visual dos originais pelo principal; autoria, créditos, hashes e histórico de recusas em d03-final.json/d03-manifesto.json. A confirmação humana das duas representações não é alegada como aprovação humana de todas as fotos. Imagens ilustrativas não comprovam modelos, medidas ou condição dos patrimônios reais.

## Verificações realizadas

- `preparar` e `verificar`: código 0, 12 arquivos. Reexecução preservou bytes do manifesto e os 12 destinos estáveis.
- Metadados conferidos: 12 WebP decodificáveis de 800×600, cada um abaixo de 1 MiB; IDs de origem, hashes de originais e hashes de saída distintos entre os 12 itens.
- Dez testes de imagens e sete do verificador passaram; cache popular/recente separado, página 10 aceita e 0/11/fracionária recusadas antes da rede.
- Lint, Prettier dos scripts/teste e diff sem erros. Sem alteração de UI, dependência ou schema; build da aplicação não repetido.
- Galeria HTTP 200 em http://127.0.0.1:3002/: 12 cartões aceitos, zero pendentes e 12 imagens. Captura final inspecionada em .local/imagens-equipamentos/preview/selecao-final.png.

Pacote em .local/imagens-equipamentos/preparadas/ e manifesto.json, ignorados pelo Git/Vercel. O manifesto versionado é uma cópia de evidência; objetos não foram enviados ao Storage. D03 concluída localmente; população, migration/policies, conta e publicação continuam pendentes em tarefas próprias. A spec 004 ainda NÃO PRONTA; verificação independente integral ocorre em D07, após as demais implementações.
