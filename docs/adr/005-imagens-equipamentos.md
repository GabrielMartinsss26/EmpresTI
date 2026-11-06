# ADR-005: Preparação das imagens de equipamentos

Status: aprovado pelo responsável ao autorizar a proposta da próxima etapa em 06/nov/2026. Complementa o ADR-001 para ferramentas locais; não altera acesso a dados da aplicação.

## Decisões

| Item | Escolha |
|---|---|
| Fonte | API Pixabay, em substituição ao Pexels do enunciado |
| Processamento local | sharp como dependência direta de desenvolvimento |
| Saída | WebP, exatamente 800×600 |
| Enquadramento | Foto inteira, com bordas quando necessário; sem corte automático do equipamento |
| Armazenamento previsto | Bucket público com leitura pública e escrita restrita, sem criação/upload pelo agente nesta etapa |
| Reexecução | Caminho estável por patrimônio, sem cópias numeradas |
| Crédito | Manifesto com autor, ID, origem e licença; link discreto de créditos no catálogo futuro |
| Inscrições nas fotos | Permitir apenas inscrições técnicas de fábrica, conforme resposta do responsável em D03 em 06/nov/2026 |

## Justificativas

- Fonte: o responsável indicou Pixabay para a prática.
- Processamento: sharp garante o tamanho no arquivo, em vez de apenas no CSS.
- Saída: um formato para os 12 arquivos facilita a validação e o uso no catálogo.
- Enquadramento: preservar o equipamento evita cortar cabo, tela ou parte da câmera.
- Armazenamento: fotos precisam abrir sem login, mas a escrita não pode ficar pública.
- Reexecução: usar o patrimônio mantém o mesmo destino ao repetir o processo.
- Crédito: manter origem e autoria permite conferir de onde veio cada foto.
- Inscrições: o responsável permitiu letras das teclas e especificações de fábrica; marcas, logos, texto acrescentado e telas com conteúdo continuam proibidos.

## Alternativas descartadas

- Redimensionar só no CSS: o arquivo original continuaria com tamanho variável.
- Recortar para preencher o quadro: pode cortar parte do equipamento.
- Hotlink permanente do Pixabay: não atende à orientação da API para uso permanente.
- Criar nomes diferentes em toda execução: duplicaria objetos sem necessidade.
- Upload com chave de serviço pela skill: contraria o limite de produção da prática.
- Proibir também inscrições técnicas de fábrica: era a leitura inicial de “sem texto”; o responsável escolheu a exceção acima durante a seleção.

## Consequências

Fica mais fácil verificar dimensões, formato, repetição e origem com scripts locais. Fica mais difícil selecionar fotos: filtros não garantem ausência de pessoas, marcas, texto ou conteúdo nas telas; a aprovação visual continua necessária. Mudar formato, enquadramento ou patrimônio depois exige regenerar arquivos e atualizar referências do Storage.

O script usará WebP qualidade 85, bordas no fundo do design system `#0B1128`, limite técnico de 12 MiB por download e 1 MiB por saída. Destino proposto no manifesto: bucket `equipamentos`, objeto `suporte_ti/<patrimonio>.webp`. Esses parâmetros são locais; não criam bucket, policy ou referência no banco.

Em D03 o responsável também autorizou refinar os termos no Pixabay, mantendo os mesmos 12 patrimônios e requisitos. As consultas podem usar até três páginas de oito resultados por termo, com cache separado por termo/página/categoria. Apenas candidatas selecionadas são baixadas. A exceção de inscrições diverge da leitura estrita inicial do enunciado e fica explícita para a correção; não altera recusas por marcas ou pessoas.

## O que este ADR NÃO decide

- DDL, metadados no banco ou policies concretas do Storage.
- Seleção/aprovação das fotos reais; implementar a ferramenta não aprova candidatas.
- Alterar dados existentes ou provisionar a conta do professor.
- Permitir publicação pelo agente ou tornar a chave Pixabay pública.
