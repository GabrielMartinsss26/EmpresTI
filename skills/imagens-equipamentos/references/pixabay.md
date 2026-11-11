# Pixabay — consulta em 06/nov/2026

Fontes: https://pixabay.com/api/docs/ e https://pixabay.com/service/license-summary/.

Usar `https://pixabay.com/api/` com chave privada `PIXABAY_API_KEY`, `image_type=photo`, `safesearch=true`, mínimo 800×600 e consultas do inventário. A API retorna ID, pageURL, autor/user_id e largeImageURL. Guardar apenas os campos usados; não guardar URL da requisição autenticada nem resposta de erro do provedor.

Cache de busca por 24 horas, independente da chave; oito candidatas por página, até dez páginas por termo após a ampliação solicitada em D03, sem download em massa. Termo, página, categoria e ordenação têm caches separados. Renovar cache não aprova imagem. Interromper em erro/429 sem repetição automática. Inventário e fonte são mantidos; exceções visuais aprovadas estão no ADR-005.

As URLs de imagem retornadas são para prévia/busca, não hotlink permanente. Baixar somente a candidata selecionada; a publicação futura serve a cópia do Storage. Downloads aceitam apenas HTTPS em pixabay.com/cdn.pixabay.com; redirecionamentos para outro host são recusados.

Manifesto final registra ID, autor, página de origem e a licença Pixabay Content License com link para https://pixabay.com/service/license-summary/. A licença geral não exige atribuição; a prática adotou registro de autoria e link discreto de créditos por decisão do responsável. Não reproduzir a afirmação de obrigação do Pexels como se fosse condição idêntica do Pixabay.

Filtros não eliminam marcas, telas, textos e pessoas. Confirmar isso visualmente em cada arquivo selecionado, inclusive se a licença do provedor permitir determinado uso. Não afirmar que são fotos do patrimônio físico real: são ilustrações de equipamentos para a atividade.

Apenas inscrições técnicas de fábrica foram liberadas pelo responsável em D03 (teclas, especificações). Marca/logo legível, publicidade, texto acrescentado e tela com conteúdo continuam proibidos; não confundir nome comercial com especificação.

Exceção de tipo confirmada após apresentação: TI-0007 usa a ilustração Pixabay ID 313011, consultada por ID na API (`type=illustration`). Não chamá-la de fotografia nem estender a exceção aos demais itens. A câmera de ação compacta foi aceita como representação de TI-0012. São 11 fotografias e uma ilustração no conjunto final local.
