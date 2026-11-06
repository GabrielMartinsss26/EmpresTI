# Pixabay — consulta em 06/nov/2026

Fontes: https://pixabay.com/api/docs/ e https://pixabay.com/service/license-summary/.

Usar `https://pixabay.com/api/` com chave privada `PIXABAY_API_KEY`, `image_type=photo`, `safesearch=true`, mínimo 800×600 e consultas do inventário. A API retorna ID, pageURL, autor/user_id e largeImageURL. Guardar apenas os campos usados; não guardar URL da requisição autenticada nem resposta de erro do provedor.

Cache de busca por 24 horas, independente da chave; até oito candidatas por consulta e sem download em massa. Renovar cache não aprova imagem. Interromper em erro/429 sem repetição automática. Se as candidatas não servirem, registrar a lacuna e ajustar a busca com o responsável, em vez de buscar outra origem.

As URLs de imagem retornadas são para prévia/busca, não hotlink permanente. Baixar somente a candidata selecionada; a publicação futura serve a cópia do Storage. Downloads aceitam apenas HTTPS em pixabay.com/cdn.pixabay.com; redirecionamentos para outro host são recusados.

Manifesto final registra ID, autor, página de origem e a licença Pixabay Content License com link para https://pixabay.com/service/license-summary/. A licença geral não exige atribuição; a prática adotou registro de autoria e link discreto de créditos por decisão do responsável. Não reproduzir a afirmação de obrigação do Pexels como se fosse condição idêntica do Pixabay.

Filtros não eliminam marcas, telas, textos e pessoas. Confirmar isso visualmente em cada arquivo selecionado, inclusive se a licença do provedor permitir determinado uso. Não afirmar que são fotos do patrimônio físico real: são ilustrações de equipamentos para a atividade.
