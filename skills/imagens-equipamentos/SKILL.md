---
name: imagens-equipamentos
description: Busca e prepara fotos de equipamentos do EmpresTI pelo Pixabay, revisa candidatas e gera WebP 800×600 com créditos e sem repetição. Use para as fotos dos 12 equipamentos da prática. Não use para logo, landing, imagens geradas ou upload em produção.
---

# Imagens de equipamentos

Leia a spec 004 e o ADR-005 antes de selecionar ou preparar fotos. Para fonte, cache e licenciamento, consulte [Pixabay](references/pixabay.md). Para comandos, arquivos e aprovação, consulte [pipeline local](references/pipeline.md).

1. Execute `buscar` para obter candidatas; não selecione automaticamente o primeiro resultado. O script só acessa a API Pixabay por GET e mantém cache por 24 horas, sem salvar a chave.
2. Use `baixar <patrimonio> <id>` para baixar uma candidata em diretório local ignorado. Inspecione o arquivo visualmente antes de aprovar: precisa representar o equipamento, sem pessoa, marca/logo legível, texto ou tela com conteúdo. Reprove e registre o motivo se não servir. Filtros e o nome da busca não provam isso.
3. Registre a decisão em `revisao.json`, com revisor, data, motivo e hash do original efetivamente inspecionado. Nunca preencha uma aprovação sem inspeção. Mudar a candidata exige nova decisão vinculada ao novo hash.
4. Execute `preparar` somente após as 12 aprovações. O script gera bordas sem cortar a foto, verifica os arquivos, recusa IDs/bytes repetidos e produz manifesto com autoria, licença e destino estável.
5. Execute `verificar` para conferir o pacote contra seleções/revisões atuais. Informe quantidade e lacunas; sem as 12 fotos válidas, não declare pacote pronto.

A skill prepara arquivos locais. Escrita em Storage/banco pertence ao operador, conforme `docs/pratica.md`. Não há comando de upload nesta skill. A chave existe somente na configuração local; não a coloque em manifesto, log, print ou parâmetro público.

Testes sintéticos comprovam transformação e bloqueios; não comprovam fotos reais nem revisão visual. Informe separadamente o que foi implementado, o que foi inspecionado e o que foi publicado.
