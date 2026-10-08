# Arquitetura do Project DevCity

Jogo em HTML, CSS e JavaScript puros, sem build e sem dependências. Abra `index.html` no navegador.

## Arquivos e ordem de carga

`index.html` carrega `css/base.css`, um CSS por módulo e, nesta ordem: `js/core.js`, `js/office.js`, `js/hardware.js`, `js/city.js`, `js/capital.js`, `js/market.js`, `js/ventures.js`, `js/fx.js` e por último `js/main.js`, que chama `start()`.

`index.html` não tem `<!doctype>`, `<html>`, `<head>` nem `<body>`: o Artifact (e o servidor de teste) envolvem o arquivo nesse esqueleto.

| Arquivo | Dono | Conteúdo |
|---|---|---|
| `js/core.js` | núcleo | dados, estado `S`, simulação diária/mensal, lançamento de jogos, abas Desenvolvimento, Marketing, Finanças, Equipe, Pesquisa e Propriedades, registros de extensão, canvas compartilhado |
| `js/office.js` + `css/office.css` | módulo Escritório | desenho do escritório, mesas, salas, menu radial |
| `js/hardware.js` | módulo Visual | aba Hardware e ciclo de vida do console |
| `js/city.js` + `css/city.css` | módulo Cidade | mapa da cidade, sede e imóveis |
| `js/capital.js` + `css/capital.css` | módulo Capital | demonstrativos, empréstimos, investidores, IPO, impostos, metas |
| `js/market.js` + `css/market.css` | módulo Mercado | plataformas, preço, publishers, rivais, eventos, prêmios, pós-lançamento |
| `js/ventures.js` + `css/ventures.css` | módulo Negócios | contratos, treinamento, aumentos, serviço de assinatura |
| `js/fx.js` + `css/fx.css`, `css/base.css`, marcação de `index.html` | módulo Visual | aparência, tema por era, efeitos |

## Regras para módulos

- Todo o código do módulo fica dentro de `(() => { ... })();`. Nada de nomes globais novos (dois `const` iguais em arquivos diferentes quebram o jogo inteiro). Para expor algo, registre nos objetos abaixo.
- Um módulo só edita os próprios arquivos. Se precisar de algo no núcleo, use os registros; se não houver registro, embrulhe a função global (`const old = window.x; window.x = (...a) => ...`) e documente.
- Texto da interface em português do Brasil, frases curtas e diretas. Sem emoji como enfeite.
- Todo controle tem `id` estável (o foco é restaurado depois de redesenhar a aba), rótulo visível ou `aria-label`, e funciona por teclado. Nada pode depender só de cor.
- Tem que funcionar em 400 px de largura sem rolagem horizontal da página.
- Cores só pelos tokens de `css/base.css` (`--bg`, `--panel`, `--raise`, `--well`, `--line`, `--fg`, `--muted`, `--accent`, `--accent-ink`, `--good`, `--warn`, `--bad`, `--info`, `--hype`, `--bp`) e fontes por `--f-display`, `--f-body`, `--f-data`. O canvas pode usar cores literais.
- Saves antigos precisam continuar abrindo: todo campo novo em `S` entra por `addDefaults`.

## Estado

`S` é um objeto JSON salvo em `localStorage['devcity-save-v1']` todo mês. `newGame()` monta o estado inicial e aplica `DEFAULTS`; `boot()` aplica `DEFAULTS` de novo em saves carregados. Use `addDefaults({ campo: valor })` no topo do módulo (objetos simples são mesclados em profundidade; arrays não).

Tempo: `S.day` conta dias desde 1º de janeiro de 1976; mês = 30 dias, ano = 360. `year()` dá o ano atual.

Dinheiro: sempre por `cash(valor, categoria)`. Positivo é receita, negativo é despesa. A categoria alimenta `S.books[ano][categoria]` (base dos demonstrativos). Categorias têm rótulo em `CATS`; módulos adicionam as suas com `Object.assign(CATS, { chave: 'Rótulo' })`.

## Registros de extensão

| Registro | Uso |
|---|---|
| `HOOKS.day` / `month` / `year(y)` | depois da simulação do núcleo no dia, mês (dia % 30 === 0) e virada de ano |
| `HOOKS.start(project, draft)` | logo depois de criar `S.project` |
| `HOOKS.launch(game, project, notes)` | depois de criar o jogo lançado e antes do modal de crítica. `notes.push(['good'|'warn'|'bad'|'info', html])` |
| `HOOKS.boot()` | depois de carregar ou criar o estado, antes de desenhar |
| `HOOKS.cash(v, cat)` | cada movimento de caixa |
| `HOOKS.frame(dtJogo, agora)` | todo quadro; `dtJogo` é 0 com o jogo pausado |
| `HOOKS.input(evento)` | qualquer `input` dentro do painel de abas |
| `HOOKS.render(aba)` | depois de redesenhar a aba ativa |
| `HOOKS.view(visao)` | troca entre `office` e `city` |
| `MOD.k.push((valor, ctx) => novoValor)` | modificadores numéricos. `prod`, `qa`, `morale`, `rp` recebem o funcionário; `score`, `units`, `ppu` recebem `{ p, g, y, ip, score?, hype? }`; `sell` recebe o jogo (vendas do dia); `hireSkill`, `rent`; `totalPts` recebe o rascunho |
| `CAP.servers` / `factory` / `prestige` / `assets` | funções que somam capacidade: racks de servidor, linhas de montagem, prestígio extra e valor de ativos. Leia com `capacity('servers')` |
| `DRAW.office` / `DRAW.city` | desenham a visão ativa no canvas compartilhado |
| `VIEWS[aba]` + `addTab(id, rótulo, depoisDe)` | HTML de cada aba |
| `ACT[nome]` | botões com `data-act="nome" data-a="arg"` |
| `LIVE[nome]` | elementos com `data-live="nome:arg"` são atualizados a cada dia. `data-html` usa innerHTML; `<meter>`/`<progress>` recebem `value` |
| `BADGES[aba]` | número mostrado na aba (vazio ou 0 esconde) |
| `DEV_EXTRA.prod` / `qa` | funções que devolvem HTML extra nas colunas 2 e 3 da aba Desenvolvimento |
| `BLOCK_START` | funções `(rascunho) => 'motivo'` que impedem iniciar a produção |
| `SELFTESTS` | `{ name, async run() }`; lance erro (`check(cond, msg)`) para falhar. Rodados por `test/smoke.cjs` |

Funções globais que um módulo pode substituir: `deskCapacity()` e `reindex(reset)` (o Escritório já faz isso).

## Interface

- Campos de formulário: `data-bind="caminho.no.S"` grava direto em `S`; `data-num` converte para número; `data-rerender` redesenha a aba.
- `markDirty()` redesenha a aba ativa no próximo quadro. `refreshLive()` atualiza só os `data-live`.
- `modal(título, html, botões, travado)` devolve uma Promise com `{ v, data }`: `v` é o valor do botão e `data` traz os campos com `name` do corpo. Botão: `[rótulo, valor, classe, pularValidação]`. Modais entram numa fila.
- `toast(texto, 'good'|'warn'|'bad')` para avisos curtos.
- Classes prontas: `.cards`/`.card`, `.kpis`, `.tbl` dentro de `.scroll`, `.field`, `.check`, `.chips`/`.chip`, `.pill`, `.tag`, `.eyebrow`, `.label`, `.primary`, `.danger`, `.muted`, `.small`, `.warn`, `.bad`, `.ok`, `.empty`, `.acts`.
- Canvas compartilhado: `cv`, `ctx`, câmera isométrica `cam` (`tw`, `th`, `ox`, `oy`) e os ajudantes `iso(x, y)`, `up(ponto, altura)`, `poly(pontos, cor, contorno)` e `box(x, y, w, d, h, [topo, esquerda, direita], z)`.

## Testes

`NODE_PATH=$(npm root -g) node devcity/test/smoke.cjs` sobe um servidor local, joga 40 anos com um bot, roda todos os `SELFTESTS` e abre `test/save-v1.json`. Falha com qualquer erro de página ou `console.error`. `YEARS=10` encurta a partida.
