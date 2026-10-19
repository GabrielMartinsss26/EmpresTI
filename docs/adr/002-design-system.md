# ADR-002: Design system

## Contexto

`docs/layout.md` define a referência visual Nocturne do EmpresTI, mas mistura decisões visuais, composição de páginas e instruções originadas de um protótipo estático. A implementação precisa preservar o resultado visual sem contrariar o ADR-001, que escolhe Tailwind CSS, shadcn/ui, CSP sem `unsafe-inline` e Next.js.

Os arquivos `_ds/nocturne-<id>/styles.css` e `_ds_bundle.js` citados no layout não existem no repositório. O layout também cita CSS e ícones carregados por CDN, estilos inline e uma restrição de CSS global que não comporta os próprios tokens definidos em `:root`.

## Decisão

1. O design system do EmpresTI é o Nocturne adaptado à marca `#001449`, conforme os valores explícitos deste ADR e de `docs/layout.md`.
2. Este ADR é a fonte das decisões reutilizáveis de design e implementação; `docs/layout.md` continua sendo a fonte da composição e do conteúdo das páginas.
3. A implementação usa Tailwind CSS e componentes no padrão shadcn/ui, conforme o ADR-001.
4. “Estilos inline no template” significa classes Tailwind colocadas no componente, não atributos HTML `style` nem objetos React `style`.
5. Tokens globais, fonte, keyframes e reset do `body` podem ficar no CSS global. Regras específicas ficam no componente.
6. Open Sans é carregada pelo mecanismo de fonte do Next e servida com a aplicação, sem dependência de CDN em runtime.
7. Phosphor Icons é o conjunto de ícones do projeto e deve ser instalado como dependência npm, sem CSS do unpkg em runtime.
8. Os arquivos externos `_ds/nocturne-*` e `_ds_bundle.js` não são dependências da aplicação. Os tokens são mantidos no próprio repositório.
9. O sistema tem somente modo escuro e não oferece alternador de tema.
10. Componentes não contêm regra de negócio: recebem estado, conteúdo e disponibilidade por propriedades.
11. A implementação inicial é destinada a desktop. Comportamento responsivo para celular e tablet não é decidido por este ADR.

## Escopo

O design system cobre:

- fundamentos visuais;
- tokens de cor, tipografia, espaço, raio, elevação e movimento;
- componentes reutilizáveis e seus estados;
- regras de acessibilidade e uso.

## Princípios

1. A interface existe somente em modo escuro.
2. O fundo é preto azulado; superfícies são separadas por bordas e escurecimento ambiente.
3. Ações primárias são contornadas, sem preenchimento azul sólido.
4. `#001449` é fundo profundo de marca e hero; avatar e chip ativo usam `#132663`. Essas cores não são usadas como texto ou ação.
5. `#5B7FE0` é a cor de ação visível.
6. Cinzas azulados sustentam superfícies, bordas e texto secundário.
7. Títulos e conteúdos ficam alinhados à esquerda, com densidade visual alta.
8. Não usar preto puro, branco puro, emoji, gradiente agressivo ou sombra pesada.

## Tokens

### Cores de base

| Token | Valor | Uso |
|---|---|---|
| `--page` | `#05070F` | Fundo externo à aplicação |
| `--color-bg` | `#080C1A` | Fundo da aplicação |
| `--sidebar-bg` | `#060A16` | Fundo da sidebar |
| `--color-surface` | `#0E1530` | Cards, painéis e destaques |
| `--surface-sunken` | `#0B1128` | Inputs, tabelas e blocos internos |
| `--color-text` | `#E6EAF6` | Texto principal |
| `--text-muted` | `#8A93B2` | Descrições e texto secundário |
| `--text-dim` | `#7C86A2` | Metadados |
| `--text-faint` | `#5E6884` | Datas e textos de apoio |
| `--text-ghost` | `#454E68` | Rótulos de grupo e conteúdo opcional |

### Bordas

| Token | Valor | Uso |
|---|---|---|
| `--border-frame` | `#222C4A` | Molduras e chips inativos |
| `--border-card` | `#1F2949` | Cards |
| `--border-soft` | `#1A2340` | Divisores e blocos de apoio |
| `--border-row` | `#161D33` | Linhas de tabela e lista |
| `--border-strong` | `#2B3450` | Formulários e botões secundários |

### Cor de marca e ação

| Token | Valor | Uso |
|---|---|---|
| `--accent-100` | `#EEF2FE` | Texto de ação em hover |
| `--accent-200` | `#D6E0FB` | Chip ativo e confirmação |
| `--accent-300` | `#B4C6F6` | Botão primário e valor destacado |
| `--accent-400` | `#8AA6EE` | Ícones e links |
| `--accent-500` | `#5B7FE0` | Borda de ação, progresso e foco |
| `--accent-600` | `#3C5DBE` | Hover de card e ícone grande |
| `--accent-700` | `#25408F` | Bordas de aviso, logo e chip ativo |
| `--accent-800` | `#132663` | Chip ativo, avatar e badge |
| `--accent-900` | `#001449` | Logo e painel do login |

### Estados semânticos

| Estado | Texto | Fundo | Borda |
|---|---|---|---|
| Disponível | `#5FD3AA` | `rgba(63,185,140,0.12)` | `rgba(63,185,140,0.35)` |
| Emprestado | `#9AA3BC` | `#1A2340` | `#2B3450` |
| Manutenção | `#E8B961` | `rgba(224,163,63,0.12)` | `rgba(224,163,63,0.35)` |
| Atraso | `#F0A0A5` | `rgba(224,91,98,0.05)` | `rgba(224,91,98,0.4)` |

Para rótulo de atraso, usar `#E08A90` quando o contraste do contexto pedir a variação mais escura.

### Elevação

| Token | Valor |
|---|---|
| `--shadow-sm` | `0 0 0 1px #222C4A` |
| `--shadow-md` | `0 0 0 1px #2B3450, 0 6px 18px rgba(0,0,0,0.55)` |
| `--shadow-lg` | `0 0 0 1px #454E68, 0 18px 44px rgba(0,0,0,0.7)` |
| `--shadow-frame` | `0 0 0 1px #222C4A, 0 18px 44px rgba(0,0,0,0.6)` |

Usar uma única elevação por elemento. Não empilhar sombras.

### Gradientes permitidos

| Token | Valor | Uso |
|---|---|---|
| `--gradient-login` | `linear-gradient(160deg,#001449 0%,#00102F 60%,#080C1A 100%)` | Hero do login |
| `--gradient-notice` | `linear-gradient(90deg,#0E1530,#0B1128)` | Aviso de regras |
| `--gradient-equipment` | `radial-gradient(120% 120% at 20% 0%,#132663 0%,#0B1128 60%)` | Área de imagem do equipamento |

Nenhum outro gradiente faz parte do sistema.

## Tipografia

### Família e pesos

- Família: Open Sans, com fallback `system-ui, sans-serif`.
- Pesos usados nos componentes: 400 e 600.
- Títulos usam `letter-spacing: -0.01em`.
- Marca usa `letter-spacing: 0.02em`.
- Rótulos uppercase usam `letter-spacing` entre `0.08em` e `0.12em`.
- Parágrafos longos usam `text-wrap: pretty`.

### Escala tipográfica

| Token sugerido | Tamanho / linha | Peso | Uso |
|---|---|---|---|
| `text-display` | `40px / 1.1` | 600 | Título de documento |
| `text-hero` | `34px / 1.15` | 600 | Hero do login |
| `text-item-title` | `28px` | 600 | Detalhe do equipamento |
| `text-page-title` | `24px` | 600 | Título de página |
| `text-stat` | `26px` | 600 | Métrica de estatística |
| `text-dialog-title` | `19px` | 600 | Diálogo |
| `text-section-title` | `17px` | 600 | Seção |
| `text-subsection-title` | `15px` | 600 | Subseção e item de lista |
| `text-card-title` | `14.5px` | 600 | Item em card |
| `text-body` | `13px–14px` | 400 | Corpo, input e célula |
| `text-description` | `13px–13.5px` | 400 | Descrição |
| `text-meta` | `12px–12.5px` | 400 | Metadado |
| `text-label` | `12px` | 400 | Rótulo de campo |
| `text-badge` | `11px` | 600 | Badge e pill |
| `text-group` | `10px` | 400 | Grupo da sidebar |

O tamanho mínimo é 10px e só pode ser usado em rótulo uppercase de agrupamento.

## Espaçamento e dimensão

### Escala de espaço

`3 · 5 · 6 · 7 · 8 · 9 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 28 · 32 · 40 · 56 · 64`px

Grupos de elementos usam `flex` ou `grid` com `gap`. Não criar espaçamento por caracteres em branco nem por margem individual entre irmãos.

### Raios

| Token sugerido | Valor | Uso |
|---|---|---|
| `radius-frame` | `14px` | Moldura e diálogo |
| `radius-card` | `12px` | Card e tabela |
| `radius-stat` | `11px` | Estatística e prévia |
| `radius-user` | `10px` | Usuário e ícone grande |
| `radius-item` | `9px` | Ícone de card e bloco interno |
| `radius-control` | `8px` | Botão, input e navegação |
| `radius-compact` | `7px` | Controle compacto e logo pequeno |
| `radius-pill` | `99px` | Pill, avatar e progresso |

### Altura de controles

| Controle | Altura |
|---|---|
| Botão de formulário ou login | `44px` |
| Input, select ou campo | `42px` |
| Botão de diálogo | `38px` |
| Botão de lista | `36px` |
| Busca ou ação do header | `34px–36px` |
| Botão de tabela | `30px` |
| Textarea | `88px` |
| Barra de progresso | `4px` |
| Segmento de limite | `5px` |

## Componentes

### Button

Variantes:

| Variante | Borda | Fundo | Texto | Hover |
|---|---|---|---|---|
| `primary` | `#5B7FE0` | Transparente | `#B4C6F6`, 600 | Fundo `rgba(91,127,224,0.12)`, texto `#EEF2FE` |
| `confirm` | `#5B7FE0` | `rgba(91,127,224,0.12)` | `#D6E0FB`, 600 | Fundo `rgba(91,127,224,0.2)` |
| `secondary` | `#2B3450` | Transparente | `#9AA3BC` | Texto `#E6EAF6`, borda `#454E68` |
| `row` | `#2B3450` | Transparente | `#D6E0FB`, 600 | Borda `#5B7FE0`, fundo `rgba(91,127,224,0.1)` |
| `row-overdue` | `#5B7FE0` | `rgba(91,127,224,0.14)` | `#D6E0FB`, 600 | Fundo `rgba(91,127,224,0.24)` |

Estados obrigatórios: normal, hover, foco, pressionado e desabilitado. O estado desabilitado usa `opacity: 0.45`. Pressionado desloca `1px` para baixo durante `80ms`.

### Input

- Altura de 42px.
- Padding horizontal de 12px.
- Raio de 8px.
- Fundo `#0B1128` e borda `#2B3450`.
- Texto de 14px em `#E6EAF6`.
- Rótulo de 12px em `#9AA3BC`.
- Placeholder em `#5E6884`.
- Select usa o mesmo contêiner e caret de 13px em `#5E6884`.

Estados definidos: vazio, preenchido, foco e desabilitado. A mensagem pertence à spec da funcionalidade; o tratamento visual de erro ainda não foi definido e não pode ser inventado na implementação.

### StatusPill

- Texto de 11px e peso 600.
- Padding `3px 9px`.
- Raio de 99px.
- Variantes: `available`, `borrowed` e `maintenance`.
- Cada variante usa o trio texto, fundo e borda dos tokens semânticos.
- Atraso é representado por texto e realce da linha. O layout não define fundo próprio para uma pill de atraso.

### FilterChip

- Padding `6px 12px`.
- Raio de 99px.
- Texto de 12px.
- Inativo: fundo transparente, texto `#9AA3BC`, borda `#222C4A`.
- Ativo: fundo `#132663`, texto `#D6E0FB`, borda `#25408F`.

### SegmentedControl

- Contêiner com borda `#2B3450`, raio de 8px e `overflow: hidden`.
- Opção com padding `9px 18px` e texto de 13px.
- Opções são separadas por borda esquerda `#2B3450`.
- Ativo usa fundo `#132663`, texto `#D6E0FB` e peso 600.
- Deve expor seleção única e navegação por teclado.

### EquipmentCard

- Card com padding de 16px, raio de 12px e borda `#1F2949`.
- Layout em coluna com gap de 12px.
- Ícone de 40px, raio de 9px, fundo `#0B1128` e pictograma de 20px em `#8AA6EE`.
- Nome em 14.5px/600 e metadado em 12px.
- Disponível: clicável, rodapé “Solicitar →” e hover de borda `#3C5DBE`.
- Emprestado: sem hover; rodapé informa pessoa e devolução.
- Manutenção: sem hover; rodapé informa a situação da assistência.

O card não decide se uma solicitação pode ser feita. Ele apenas representa o estado recebido.

### DataTable

- Contêiner com borda `#1A2340`, raio de 12px e `overflow: hidden`.
- Cabeçalho com fundo `#0B1128` e texto uppercase de 11px em `#5E6884`.
- Linhas separadas por borda `#161D33`.
- Linha em atraso usa fundo `rgba(224,91,98,0.05)`.
- A ordem, largura e conteúdo das colunas pertencem à página que usa a tabela.

### RuleNotice

- Padding `13px 16px`, raio de 10px e gap de 12px.
- Fundo `--gradient-notice` e borda `#25408F`.
- Ícone de 17px em `#8AA6EE`.
- Título em 13px/600 e corpo em 12.5px `#9AA3BC`.

### Dialog

- Backdrop `rgba(4,6,14,0.68)`.
- Caixa central de 432px, padding de 24px, raio de 14px e fundo `#0E1530`.
- Elevação `--shadow-lg`.
- Título de 19px/600 e corpo de 13.5px em `#8A93B2`.
- Bloco de consequência com padding `12px 14px`, raio de 9px, fundo `#0B1128` e borda `#1A2340`.
- Ações alinhadas à direita com gap de 10px.
- Deve reter o foco enquanto estiver aberto, fechar por ação explícita e devolver o foco ao elemento que o abriu.

### LimitSegments

- Sempre apresenta três segmentos.
- Segmento com `flex: 1`, altura de 5px e raio de 99px.
- Gap de 5px.
- Preenchido em `#5B7FE0`; vazio em `#222C4A`.
- O valor acessível deve informar a quantidade atual e o limite, sem depender apenas da cor.

### DeadlineProgress

- Trilha de 4px em `#222C4A`, com raio de 99px e conteúdo recortado.
- Preenchimento em `#5B7FE0` na proporção de dias decorridos sobre 14.
- O texto ao lado deve informar o prazo; a barra não pode ser a única forma de comunicar a data.

### AppShell

- Grid desktop com sidebar fixa de 236px e conteúdo ocupando o restante.
- Sidebar com fundo `#060A16`, borda direita `#1A2340` e padding `22px 14px`.
- Header principal com 64px de altura, borda inferior `#1A2340` e padding horizontal de 28px.
- Conteúdo com padding vertical entre 26px e 32px, horizontal de 28px e gap entre 20px e 22px.

O `AppShell` não aparece na página de login.

### NavigationItem

- Altura definida pelo padding `9px 10px`.
- Raio de 8px, ícone de 16px e gap de 10px.
- Inativo: texto `#9AA3BC`, ícone regular e hover com fundo `#0B1128`.
- Ativo: fundo `#0E1530`, texto `#E6EAF6`, ícone fill `#8AA6EE` e barra esquerda `inset 2px 0 0 #5B7FE0`.

## Ícones

O conjunto de referência é Phosphor Icons, com peso regular por padrão e fill somente no item ativo da sidebar.

| Uso | Ícone de referência |
|---|---|
| Marca | `package` |
| Catálogo | `squares-four` |
| Meus empréstimos | `hand-arrow-down` |
| Operações | `list-checks` |
| Cadastro | `plus-square` |
| Notebook | `laptop` |
| Monitor | `monitor` |
| Câmera | `video-camera` |
| Cabo ou dock | `usb` |
| Projetor | `projector-screen` |
| Busca | `magnifying-glass` |
| Filtro | `funnel` |
| Aviso | `info` |
| Breadcrumb | `caret-right` |
| Select | `caret-down` |
| Avanço | `arrow-right` |
| Adicionar | `plus` |
| Notificação | `bell` |

Este ADR autoriza a instalação de `@phosphor-icons/web` como dependência npm do projeto.

## Divisores

Divisores de largura total desaparecem nas pontas:

```css
background: linear-gradient(
  to right,
  rgba(230, 234, 246, 0),
  #222c4a 48px,
  #222c4a calc(100% - 48px),
  rgba(230, 234, 246, 0)
);
height: 1px;
```

A régua de marca desaparece somente à direita:

```css
background: linear-gradient(to right, #3c5dbe, rgba(60, 93, 190, 0));
```

Divisores internos curtos são sólidos.

## Movimento

| Elemento | Propriedade | Duração |
|---|---|---|
| Navegação | Fundo e cor | `120ms ease-out` |
| Botão | Fundo, borda e cor | `140ms ease-out` |
| Card | Cor da borda | `160ms ease-out` |
| Botão pressionado | `translateY(1px)` | `80ms` |
| Diálogo abrindo | Opacidade e `translateY(6px)` | `180ms cubic-bezier(.2,.8,.2,1)` |
| Diálogo fechando | Movimento inverso | `120ms ease-in` |
| Progresso e limite | Largura ou fundo | `240ms ease-out` |
| Remoção de linha | Opacidade e altura | `200ms ease-in` |

Nada se move sozinho. Nenhuma animação passa de 240ms. Foco de teclado aparece sem transição. Em `prefers-reduced-motion: reduce`, mudanças de transform e opacidade devem ser imediatas.

## Acessibilidade

1. Todo controle interativo deve ser acessível por teclado.
2. O foco usa `outline: 2px solid #5B7FE0` com `outline-offset: 2px`.
3. Estado não pode ser comunicado somente por cor.
4. Ícones decorativos não recebem nome acessível; ícones que representam uma ação recebem rótulo pelo controle.
5. Botão somente com ícone precisa de nome acessível.
6. Inputs precisam de rótulo associado.
7. Diálogo precisa de título associado, retenção de foco e retorno de foco.
8. O texto mínimo de 10px é reservado a rótulos de agrupamento.
9. Componentes respeitam `prefers-reduced-motion`.

## Regras de implementação

- A implementação deve usar Tailwind CSS e componentes no padrão shadcn/ui, conforme o ADR-001.
- As classes ficam junto do template do componente; o CSS global fica restrito a fonte, tokens, keyframes e reset do `body`.
- Os tokens deste documento devem ser expostos como propriedades CSS e mapeados para o tema do Tailwind.
- Componentes não podem embutir regra de negócio; recebem estado e conteúdo por propriedades.
- Variações visuais devem ser nomeadas e finitas, sem cores arbitrárias por página.
- O design system não cria um segundo tema e não oferece alternador de tema.

Os arquivos Nocturne `_ds/nocturne-<id>/styles.css` e `_ds_bundle.js` citados no layout não são dependências da aplicação. A implementação usa os valores explícitos deste ADR.

## Alternativas descartadas

- **Carregar os arquivos `_ds` do Nocturne** — os arquivos não existem no repositório e criariam uma dependência externa sem origem versionada.
- **Carregar Open Sans e Phosphor por CDN em runtime** — exigiria ampliar a CSP e deixaria a interface dependente da disponibilidade de terceiros.
- **Usar atributos `style` ou objetos React `style`** — conflita com a CSP sem `unsafe-inline` e duplica valores que devem vir dos tokens.
- **Criar componentes visuais sem shadcn/ui** — contrariaria a escolha de componentes do ADR-001.
- **Adicionar modo claro** — o layout define somente modo escuro e não prevê alternador de tema.
- **Colocar regra de empréstimo dentro dos componentes** — duplicaria comportamento que pertence às specs e ao servidor.

## Consequências

### Fica mais fácil

- Manter cores, espaçamentos e estados em um lugar único.
- Aplicar a CSP sem liberar estilos inline nem CDNs de fonte e ícone.
- Reutilizar componentes sem repetir os valores hexadecimais em cada página.
- Trocar a composição de uma página sem alterar os tokens do produto.
- Conferir visualmente se uma tela respeita a referência do layout.

### Fica mais difícil

- Uma exceção visual precisa virar variante explícita antes de entrar em uma página.
- A adaptação de componentes shadcn/ui exige remover o visual padrão e aplicar os tokens do EmpresTI.
- Alterações em tokens reutilizados afetam várias telas e exigem revisão visual delas.
- Desktop é o único alvo definido; comportamento responsivo exige decisão posterior.

### O que isso impede de fazer depois sem custo

- Introduzir modo claro sem criar uma segunda tabela completa de tokens e revisar todos os componentes.
- Trocar Open Sans ou Phosphor sem revisar tipografia, métricas, alinhamento e iconografia.
- Voltar a depender do bundle externo do Nocturne sem reconciliar seus valores com os tokens locais.
- Substituir Tailwind ou shadcn/ui sem reimplementar o mapeamento dos componentes.

## Contradições e duplicações auditadas

| Ponto encontrado | Tratamento deste ADR |
|---|---|
| Estilo inline no layout × CSP sem `unsafe-inline` no ADR-001 | “Inline” passa a significar classes Tailwind no template; atributo `style` não é usado. |
| Fontes e ícones por CDN × CSP restritiva | Fonte é servida pelo Next e ícones vêm de dependência npm. |
| Arquivos `_ds` obrigatórios no layout × arquivos inexistentes | Os arquivos `_ds` não fazem parte da implementação. |
| CSS global limitado × tokens exigidos em `:root` | Tokens passam a ser explicitamente permitidos no CSS global. |
| `--border-frame` indicado para input × especificação do Input com `#2B3450` | A regra específica vence: Input usa `--border-strong`; `--border-frame` fica para molduras e chips. |
| Pill de atraso listada sem fundo próprio | Não existe variante `overdue` de `StatusPill`; atraso usa texto e realce da linha até nova decisão visual. |
| Manutenção “fora do catálogo” × card de manutenção desenhado no catálogo | Não resolvido aqui: é comportamento de produto e precisa ser fechado na spec do catálogo. |
| Cores repetidas nas descrições dos componentes | Os tokens deste ADR são canônicos; componentes devem referenciar tokens, não copiar valores arbitrários. |
| Limite de três itens e prazo de 14 dias repetidos no PRD e no layout | O design system apenas representa os valores recebidos; a regra continua pertencendo ao PRD e às specs. |

## O que este ADR não decide

- Textos específicos de cada página.
- Regras de autenticação, empréstimo ou autorização.
- Se equipamentos em manutenção aparecem ou não no catálogo.
- Mensagens e tratamento visual de erro em formulários.
- Estrutura de rotas.
- Organização interna das pastas de código.
- Comportamento para celular ou tablet.
- Ordem, largura e conteúdo das colunas de cada tabela.
- Conteúdo passado para componentes e disponibilidade de ações.
