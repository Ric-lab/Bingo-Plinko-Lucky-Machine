# Arquitetura atual

Base lida: `e7464583b8988e51c00101f7b5266b1eee9f9322` (`master`). Referências `arquivo:linha` apontam para essa revisão; intervalos incluem ambas as extremidades. Verificação estática por leitura e `rg`; execução no navegador e Android Capacitor: **verificado e aprovado**.

## 1. Visão em 5 linhas

1. Jogo de cartela 5×5 com sorteio de cinco números e queda física de bolas: o compartimento atingido determina o número resolvido na cartela (`src/hooks/useGameLogic.js:166-224`; `src/App.jsx:204-212`).
2. FINGO vence por linha/coluna/diagonal, BINGO por cartela completa e SPINGO por cinco marcações; começam com 50/100/25 bolas, respectivamente (`src/hooks/useGameLogic.js:45-97,378-380`).
3. Stack declarada: React 19, Vite 7, Tailwind 3, Matter.js 0.20, Framer Motion, Lucide, canvas-confetti e Capacitor 8 (`package.json:14-38`); `main.jsx` monta `App` em `StrictMode` (`src/main.jsx:1-10`).
4. `npm run dev` chama Vite; `build:android` executa `vite build && npx cap sync android`, e `open:android` abre o projeto Capacitor; o diretório web configurado é `dist` (`package.json:6-12`; `capacitor.config.json:2-4`).
5. Android inicia `.MainActivity`, uma `BridgeActivity` que acessa a WebView e dispensa gesto para mídia em `onCreate`/`onResume`; o identificador é `com.bingoplinko.game` (`android/app/src/main/AndroidManifest.xml:12-23`; `android/app/src/main/java/com/bingoplinko/game/MainActivity.java:1-21`; `capacitor.config.json:2`).

## 2. Mapa de arquivos

| Arquivo em `src/` | Responsabilidade atual e referência |
| --- | --- |
| `main.jsx` | Importa CSS e monta `App` no elemento `root` com `StrictMode` (`src/main.jsx:1-10`). |
| `App.jsx` | Compõe telas, áudio, modais e a ponte entre ações lógicas e canvas (`src/App.jsx:22-90,155-229,231-425`). |
| `index.css` | Diretivas Tailwind, utilitários de contorno, animações e regras globais de tamanho/toque/overflow (`src/index.css:1-13,18-267`). |
| `hooks/useGameLogic.js` | Gera cartela/sorteios, controla fases, moedas, bolas, compras, vitória e progressão por modo (`src/hooks/useGameLogic.js:114-475`). |
| `hooks/useTheme.js` | Resolve caminhos de imagem/áudio com skin fixa `Standard` e pasta `Immutable` (`src/hooks/useTheme.js:5-19`). |
| `hooks/useSound.js` | Mantém objetos `Audio`, reprodução simples ou sobreposta, volume, loop e parada (`src/hooks/useSound.js:3-104`). |
| `utils/storage.js` | Lê/escreve JSON via `Preferences`, retornando `null` na falha de leitura e absorvendo falhas de escrita (`src/utils/storage.js:1-21`). |
| `utils/mathUtils.js` | Interpola probabilidades por nível e sorteia combinação de colunas não adjacentes, reduzindo a quantidade quando necessário (`src/utils/mathUtils.js:9-10,30-95`). |
| `utils/sessionPhysics.js` | Conta quedas em `sessionStorage` com alternativa em memória; fornece reset e fator de assistência (`src/utils/sessionPhysics.js:12-92`). |
| `components/GameCanvas.jsx` | Cria mundo/render Matter, expõe lançamento, trata colisões e desenha efeitos de impacto/fogo (`src/components/GameCanvas.jsx:43-131,133-611`). |
| `components/BingoCard.jsx` | Desenha cabeçalhos LUCKY, células, centro FREE e marcações a partir de `card` (`src/components/BingoCard.jsx:3-17,33-100`). |
| `components/BucketRow.jsx` | Exibe cinco resultados/letras, anima sorteio e chamas e aceita seleção durante `DROP` (`src/components/BucketRow.jsx:7-46,49-147,149-234`). |
| `components/Footer.jsx` | Botões de spin/fireball/magic e indicação de bolas, DROP ou WAIT conforme fase (`src/components/Footer.jsx:3-75`). |
| `components/Header.jsx` | Mostra saldo, nível com balão condicionado por divisibilidade e botão de menu (`src/components/Header.jsx:4-48`). |
| `components/SideMenu.jsx` | Alterna música/efeitos/vibração entre 0, 0.5 e 1; oferece retorno ao início e Help que fecha o menu (`src/components/SideMenu.jsx:4-21,55-82,106-140`). |
| `components/LuckySpin.jsx` | Anima roleta para prêmio retornado pelo hook, produz ticker pela rotação DOM e permite continuar (`src/components/LuckySpin.jsx:6-125,174-218`). |
| `components/Modal/ConfirmationModal.jsx` | Confirmação visual parametrizada por textos/ícone/tema, com cancelamento e ação secundária opcionais (`src/components/Modal/ConfirmationModal.jsx:4-109`). |
| `components/Modal/ConfirmationReward.jsx` | Exibe recompensa concedida com ícone/textos e botão que chama `onClose` (`src/components/Modal/ConfirmationReward.jsx:4-40`). |
| `components/Modal/FireballModal.jsx` | Compra fireball por 250 ou concede a custo zero após temporizador de vídeo simulado (`src/components/Modal/FireballModal.jsx:14-75`). |
| `components/Modal/GameOverModal.jsx` | Oferece +10 bolas por 1000 moedas ou reinício via callback (`src/components/Modal/GameOverModal.jsx:19-46`). |
| `components/Modal/MagicNumberModal.jsx` | Seleciona célula não marcada/não FREE, cobra 500 ou simula vídeo e solicita spin mágico (`src/components/Modal/MagicNumberModal.jsx:14-71,94-119`). |
| `components/Modal/MessageModal.jsx` | Renderiza mensagens, TRY AGAIN e celebração LUCKY com canvas de confete (`src/components/Modal/MessageModal.jsx:5-49,53-185`). |
| `components/Modal/NextLevelModal.jsx` | Toca bingo, exibe imagem/prêmio e chama avanço de nível no botão NEXT (`src/components/Modal/NextLevelModal.jsx:9-46`). |

## 3. Fluxo de uma partida

1. Os `onClick` da home em `App` escolhem `gameMode` e ativam `gameStarted`; `useGameLogic` já está montado, e seu efeito chama `initLevel` ao mudar a identidade desse callback (`src/App.jsx:47-53,255-283`; `src/hooks/useGameLogic.js:226-231`).
2. `initLevel` usa `getLevelRanges` e `getUniqueRandoms`, monta células `{id,col,row,num,marked,isFree}` em ordem de linhas, aplica centro FREE conforme modo, repõe bolas e define `SPIN` (`src/hooks/useGameLogic.js:9-43,105-112,166-224`).
3. O `onClick={onSpin}` de `Footer` chega ao callback de `App`, que toca clique e chama `startSpin(val)`; o botão só está habilitado em `SPIN` (`src/components/Footer.jsx:37-39`; `src/App.jsx:354-357`).
4. `startSpin` muda para `SPINNING`, reúne números ainda necessários, usa `calculateProbabilities` e `pickNonAdjacentColumns`, preenche os cinco resultados e agenda `DROP` após 2200 ms (`src/hooks/useGameLogic.js:282-342`; `src/utils/mathUtils.js:30-95`).
5. Em paralelo, `RollingSlot.update` mostra números transitórios de 1 a 75 até o alvo; atrasos por coluna são `300 + i*400` ms, com revelação 200 ms depois (`src/components/BucketRow.jsx:7-39,216-221`).
6. Em `DROP`, o clique de `BucketRow` chama `onSlotClick(i)` → `App.handleSlotClick`; `useGameLogic.dropBall` exige bolas > 0, muda para `RESOLVE` e desconta uma bola antes da chamada ao canvas (`src/components/BucketRow.jsx:189-195`; `src/App.jsx:178-190`; `src/hooks/useGameLogic.js:345-349`).
7. `GameCanvas.dropBall`, exposto por `useImperativeHandle`, cria `Bodies.circle`, escolhe posição/velocidade por tipo de bola e executa `Composite.add`; somente bola normal incrementa a contagem de sessão (`src/components/GameCanvas.jsx:73-129`).
8. O callback de `collisionStart` reconhece bola e sensor `bin-i`; `processedBalls` bloqueia repetição por ID, extrai `binIdx` e chama `onBallLandedRef.current(binIdx,isFireball)` (`src/components/GameCanvas.jsx:294-319,399-415`).
9. `App.handleBallLanded` trata som de fireball, obtém `slotsResult[binIndex]` e chama `resolveTurn`; este limpa poderes/resultados e marca células com número igual ainda não marcado (`src/App.jsx:204-212`; `src/hooks/useGameLogic.js:352-367`).
10. Em acerto, `resolveTurn` grava a cartela, credita 5 moedas e chama `checkLineMatch`, `checkFullCard` ou `checkAnyFive`; vitória agenda `winState=true`, `GAME_OVER` e prêmio de 100/300/50 + nível após 1100 ms (`src/hooks/useGameLogic.js:372-396`).
11. Sem vitória, bolas esgotadas levam a `GAME_OVER` após 750 ms; havendo bolas, volta a `SPIN`. O retorno `{hit,earned,hasBingo,isDefeat}` controla LUCKY/TRY AGAIN em `handleBallLanded`; React recebe saldo/cartela/fase pelas props (`src/hooks/useGameLogic.js:397-428`; `src/App.jsx:214-228,293-365`).
12. `App` escolhe `NextLevelModal` ou `GameOverModal` por `phase` e `winState`; `nextLevel` incrementa apenas o modo ativo ou abre `BONUS_WHEEL` em múltiplos de 25. `spinLuckySpin` credita imediatamente e `completeLuckySpin` avança o nível (`src/App.jsx:398-424`; `src/hooks/useGameLogic.js:235-279`).

## 4. Dono de cada estado

Na tabela, `GL` significa `src/hooks/useGameLogic.js`; as referências dos leitores indicam também os repasses de props. Estados agrupados compartilham o mesmo proprietário.

| Estado | Onde vive | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| `coins` | GL:116 | Hidratação, `resolveTurn`, `buyItem`, `spinLuckySpin` (`src/hooks/useGameLogic.js:132,268,375-395,433`) | Persistência/compras no hook e UI/modais via `App` (`src/hooks/useGameLogic.js:144,432`; `src/App.jsx:295,352,372,382,408`). |
| `levels`; derivado `currentLevel` | GL:119-123,148 | Hidratação, `nextLevel`, `completeLuckySpin` (`src/hooks/useGameLogic.js:134,247-250,276-279`) | Persistência, geração, sorteio, recompensa, Header/NextLevelModal (`src/hooks/useGameLogic.js:144,168,298,391-393`; `src/App.jsx:294,401`). |
| `balls` | GL:150 | `initLevel`, `dropBall`, `buyItem` (`src/hooks/useGameLogic.js:220,348,435-439`) | Guardas/derrota e Footer (`src/hooks/useGameLogic.js:346,399,410`; `src/App.jsx:353`). |
| `bingoCard` | GL:151 | `initLevel`, acerto de `resolveTurn` (`src/hooks/useGameLogic.js:214,373`) | Sorteio/marcação, `goldenCols`, BingoCard, BucketRow e MagicNumberModal (`src/hooks/useGameLogic.js:289,360`; `src/App.jsx:56-67,316,339,375`). |
| `slotsResult` | GL:152 | `initLevel`, `startSpin`, `resolveTurn` (`src/hooks/useGameLogic.js:222,341,357`) | `goldenCols`, `handleBallLanded`, BucketRow (`src/App.jsx:56-67,211,338`). |
| `phase` | GL:159 | Inicialização, spin/drop/resolução, `nextLevel`, compras de bolas/continue (`src/hooks/useGameLogic.js:217,242,285,342-347,387-419,437-441`) | Guardas do hook; áudio, Footer, BucketRow e telas em App (`src/hooks/useGameLogic.js:241,283,346`; `src/App.jsx:78,126,148,341,351,398-418`). |
| `isGameOver`, `winState` | GL:153-154 | Inicialização/resolução; compras limpam `isGameOver` (`src/hooks/useGameLogic.js:215-216,385-386,401-413,436-440`) | `winState`: resolução e escolha de modal; `isGameOver`: objeto retornado, não extraído por App (`src/hooks/useGameLogic.js:411,426,457`; `src/App.jsx:51,399`). |
| `fireBallActive`, `magicActive` | GL:155-156 | Init/resolução limpam; compra ativa fireball, spin numérico ativa magic (`src/hooks/useGameLogic.js:223-224,307-310,354-355,443`) | `goldenCols`, lançamento/som, BucketRow (`src/App.jsx:56-67,180-189,342-343`). |
| `luckySpinReward` | GL:160 | `spinLuckySpin`/`completeLuckySpin` (`src/hooks/useGameLogic.js:269,274`) | LuckySpin via App (`src/App.jsx:422`; `src/components/LuckySpin.jsx:22,208`). |
| `hydratedRef`, `audioHydratedRef` | GL:126; App:28 | Promessas de leitura (`src/hooks/useGameLogic.js:137`; `src/App.jsx:37`) | Guardas de gravação (`src/hooks/useGameLogic.js:143`; `src/App.jsx:43`). |
| `gameStarted`, `gameMode` | `src/App.jsx:47-48` | Botões da home; retorno ao início escreve `gameStarted` (`src/App.jsx:258-283,307`) | Hook recebe modo; home e efeitos de áudio leem início (`src/App.jsx:53,94-144,241`). |
| `audioSettings` | `src/App.jsx:23-27` | Hidratação e `SideMenu.toggleSetting` via setter (`src/App.jsx:35,309`; `src/components/SideMenu.jsx:6-20`) | Persistência, sons, menu e prop de vibração (`src/App.jsx:44,77-90,308,330`). |
| `messageModal` | `src/App.jsx:156` | `showMessage`, `closeMessage` e timeout (`src/App.jsx:163-175`) | MessageModal (`src/App.jsx:388-394`). |
| `showMagicModal`, `showFireballConfirm`, `isMenuOpen` | `src/App.jsx:158-160` | Cliques de abertura/fechamento (`src/App.jsx:298,306,361-363,371,381`) | Props dos respectivos modais/menu (`src/App.jsx:305,370,380`). |
| `goldenCols` derivado | `src/App.jsx:56-67` | `useMemo` a partir de magic/cartela/resultados | `GameCanvas.goldenColsRef` e assistência (`src/App.jsx:332`; `src/components/GameCanvas.jsx:69-71,335-360`). |
| `canvasRef`; `sceneRef`, `engineRef`, `renderRef` | `src/App.jsx:176`; `src/components/GameCanvas.jsx:44-46` | React/ref imperativa; setup Matter (`src/App.jsx:327`; `src/components/GameCanvas.jsx:73-131,148,161,614`) | Lançamento, dimensões, colisões e limpeza (`src/App.jsx:183-184`; `src/components/GameCanvas.jsx:75-129,337,604-608`). |
| `onBallLandedRef`, `playHitRef`, `goldenColsRef` | `src/components/GameCanvas.jsx:51-58` | Efeitos sincronizam props (`src/components/GameCanvas.jsx:64-71`) | Callback de colisões (`src/components/GameCanvas.jsx:335,371-372,413-414,436-437`). |
| `processedBalls`, `litPegs`, `shake`, `particles`, `ball.hasHitFloor` | Refs/state, array local e corpo Matter (`src/components/GameCanvas.jsx:48-62,434-454`) | Colisões, emissão e `afterRender` (`src/components/GameCanvas.jsx:380-384,402-440,457-502,537-592`) | Deduplicação, desenho e classe CSS (`src/components/GameCanvas.jsx:402,445,509-592,614`). |
| Contagem de sessão / `memoryDropCount` | `sessionStorage` e variável de módulo (`src/utils/sessionPhysics.js:12-34`) | `incrementSessionDropCount`, `resetSessionDropCount` (`src/utils/sessionPhysics.js:41-65`) | `getSessionAssistFactor`, chamado nos pinos (`src/utils/sessionPhysics.js:78-92`; `src/components/GameCanvas.jsx:358`). |
| `audioRef`, `poolRef`, `optionsRef` | `src/hooks/useSound.js:4-8` | Efeitos, `play`, `stop`, `setVolume` (`src/hooks/useSound.js:11-40,42-102`) | Reprodução/limpeza/atualização de áudio (`src/hooks/useSound.js:23-101`). |
| `displayNum`, `isFinal`; `revealed` | RollingSlot/BucketRow (`src/components/BucketRow.jsx:9-10,151`) | `update`, efeito de fase, `onFinish` (`src/components/BucketRow.jsx:16-32,154-158,221`) | Número, estilo final e destaque dourado (`src/components/BucketRow.jsx:42-43,174`). |
| `uiState`, `rotation`, `displayReward`; `wheelRef`, `lastSlotRef` | `src/components/LuckySpin.jsx:11-16` | Efeito inicial, `handleSpin`, timeout, ref DOM e ticker (`src/components/LuckySpin.jsx:21-28,36-68,82-125,175`) | Ticker, transformação e resultado/botão (`src/components/LuckySpin.jsx:32,178,193-208`). |
| `selectedId`, `showReward` (magic) | `src/components/Modal/MagicNumberModal.jsx:14-15` | Efeito de abertura, clique, vídeo e fechar recompensa (`src/components/Modal/MagicNumberModal.jsx:18-23,51-62,102`) | Seleção, confirmação e troca de modal (`src/components/Modal/MagicNumberModal.jsx:28-37,65-71,96`). |
| `showReward` (fireball) | `src/components/Modal/FireballModal.jsx:14` | Efeito de abertura, vídeo e fechar recompensa (`src/components/Modal/FireballModal.jsx:18-20,36-47`) | Troca para ConfirmationReward (`src/components/Modal/FireballModal.jsx:50-56`). |
| `canvasRef` (confete) | `src/components/Modal/MessageModal.jsx:75` | Ref do canvas DOM (`src/components/Modal/MessageModal.jsx:124-126`) | Efeito de celebração cria emissor (`src/components/Modal/MessageModal.jsx:78-115`). |

## 5. Fronteira física/render

- Matter controla corpos, gravidade, velocidade, colisões, paredes, chão, pinos, funis e sensores; `Runner.run` atualiza o engine, `Render.run` desenha seu canvas (`src/components/GameCanvas.jsx:101-129,145-304,307-451,596-597`).
- React/DOM controla home, cartela, saldo, botões, menu e modais; BucketRow é sobreposição DOM na mesma área do canvas, com cinco itens flexíveis (`src/App.jsx:231-425`; `src/components/BucketRow.jsx:168-195`).
- A entrada React→Matter é `canvasRef.current.dropBall(colIndex,isFire)`; a saída é `onBallLandedRef.current(binIdx,isFireball)`. O número e as moedas são resolvidos fora do Matter (`src/App.jsx:178-212`; `src/components/GameCanvas.jsx:73-131,413-415`; `src/hooks/useGameLogic.js:352-395`).
- `goldenCols` conecta cartela/sorteio à força horizontal nos pinos, escalada pelo fator de sessão; efeitos de brilho/partículas usam o contexto 2D em `afterRender`, enquanto `shake` aplica classe no contêiner DOM (`src/App.jsx:56-67,332`; `src/components/GameCanvas.jsx:333-366,504-594,614`).
- As gravações via JSON/Preferences contêm `{coins,levels}` sob `bplm.gameLogic.v1` e ajustes de áudio sob `bplm.audio.v1`. Cartela, fase e bolas são inicializadas pelo hook (`src/hooks/useGameLogic.js:5,125-145,214-224`; `src/App.jsx:13,30-45`; `src/utils/storage.js:6-20`).

## 6. Convenção de assets

- A estrutura lida de `public/Images` tem `Standard/` e `Immutable/`; os resolvers retornam caminhos absolutos `/Images/Standard/<filename>` e `/Images/Immutable/<filename>`, sem teste de existência ou fallback (`src/hooks/useTheme.js:5-11`).
- “Skin” hoje é a constante `FIXED_SKIN='Standard'`, retornada como `currentSkin`; não há setter no retorno. `Immutable` é a pasta independente dessa constante (`src/hooks/useTheme.js:5-19`).
- Standard fornece fundo, cartela, letras L/U/C/K/Y, células, balões de nível e botões de rodapé (`src/App.jsx:235`; `src/components/BingoCard.jsx:3,26,37,78`; `src/components/Header.jsx:6-10,28`; `src/components/Footer.jsx:15,29,47,67`).
- Sprites físicos vêm de `ball.png`, `peg.png`, `triangle.png`; escalas usam divisores fixos 128, 64 e 80/180, respectivamente (`src/components/GameCanvas.jsx:112-114,207-209,226-228,260-262`).
- Immutable contém os assets usados para home/botões de modo, moeda, vitória e roleta; além do helper, há caminhos literais em modais e LuckySpin (`src/App.jsx:247,263,275,287`; `src/components/Header.jsx:18`; `src/components/Modal/NextLevelModal.jsx:19,37`; `src/components/LuckySpin.jsx:152,164,183`).
- Áudio segue `/Audio/Standard/` e `/Audio/Immutable/`: `song.mp3`, `peg.mp3`, `buttons.mp3` usam skin; tema, slot, fireball, explosão, lucky, bingo e palheta usam Immutable (`src/hooks/useTheme.js:10-11`; `src/App.jsx:80-90`). LuckySpin também referencia textura HTTPS externa (`src/components/LuckySpin.jsx:132`).

## 7. Onde mexer para

Tabela de localização do comportamento existente, sem proposta de implementação.

| Tarefa | Arquivo exato / ponto atual |
| --- | --- |
| Mudar gravidade | `src/components/GameCanvas.jsx:40,147` — `PHYSICS_CONFIG.GRAVITY_Y` e aplicação no mundo. |
| Adicionar modo | `src/hooks/useGameLogic.js:45-61,119-123,378-393` — configuração, níveis, vitória/crédito; `src/App.jsx:252-288` — seleção de modo. |
| Trocar som de pino | `public/Audio/Standard/peg.mp3`; escolha/volume em `src/App.jsx:83`, resolução em `src/hooks/useTheme.js:10`. |
| Mudar valor da economia | `src/hooks/useGameLogic.js:116,253-269,374-395,431-444` — saldo/créditos/compra; preços em `src/components/Modal/FireballModal.jsx:15`, `src/components/Modal/MagicNumberModal.jsx:30`, `src/components/Modal/GameOverModal.jsx:22-30`. |
| Adicionar tela | `src/App.jsx:231-425` — composição e condições de home, jogo, modais e bônus. |
| Mudar faixas numéricas por nível | `src/hooks/useGameLogic.js:9-43,171-175,327-335` — `getLevelRanges` e seus consumidores. |
| Mudar chance/quantidade de números úteis | `src/utils/mathUtils.js:30-95` e `src/hooks/useGameLogic.js:295-314` — probabilidades e colunas não adjacentes. |
| Mudar assistência da bola | `src/utils/sessionPhysics.js:78-92` e `src/components/GameCanvas.jsx:26,333-366` — fator e aplicação da força. |
| Mudar visual de célula marcada | `src/components/BingoCard.jsx:63-95` — fundo DOM, ícone e cor do número. |
| Mudar prêmio/posição da roleta | `src/hooks/useGameLogic.js:253-269` — sorteio/crédito; `src/components/LuckySpin.jsx:6-8,89-120` — ordem/ângulo; imagem referenciada em `src/components/LuckySpin.jsx:183`: `public/Images/Immutable/roleta.png`. |

## 8. Armadilhas e Mitigações Arquiteturais

1. **Retorno à Home e Reinicialização de Modo**:
   - *Comportamento*: Home depende de `gameStarted`. Ao reabrir o mesmo modo ativo, `initLevel` agora é chamado explicitamente (`src/App.jsx:262,274,286`), garantindo nova cartela e reposição das bolas sem reuso de partida anterior.

2. **Garantia de Encerramento de Turno & Fallback de Chão**:
   - *Mitigação*: No handler de colisão (`isFloor`), bolas que atingem o fundo sem acionar sensor têm seu cesto calculado por `Math.floor(ball.position.x / binW)` e acionam `onBallLandedRef.current(fallbackBinIdx)`. Isso impede que o jogo congele na fase `RESOLVE` (`src/components/GameCanvas.jsx:440-459`).
   - *Validação de Lançamento*: `GameCanvas.dropBall` retorna `boolean`. `App.handleSlotClick` só aciona `dropBall` lógico se a criação física foi confirmada (`src/App.jsx:178-188`).

3. **Ciclo de Vida da Física & Haptics Dinâmicos**:
   - *Mitigação*: O `Runner` é mantido em `runnerRef` e cancelado explicitamente via `Runner.stop` na desmontagem (`src/components/GameCanvas.jsx:612-616,645-648`).
   - *Vibração*: O listener de colisão usa `vibrationLevelRef.current`, reagindo em tempo real a alterações no menu lateral (`src/components/GameCanvas.jsx:53,70,383,427,446`).
   - *Resize*: Listeners para `resize` e `orientationchange` ajustam dimensões de render e canvas dinamicamente (`src/components/GameCanvas.jsx:620-642`).

4. **Poderes e Transição de Sorteio**:
   - *Mitigação*: `Footer.jsx` bloqueia botões Fireball e Magic nas fases `SPINNING`, `RESOLVE`, `GAME_OVER`, `VICTORY` e `BONUS_WHEEL` (`src/components/Footer.jsx:4`).
   - *Magic Spin Seguro*: `startSpin` valida a fase e retorna `boolean`; moedas só são deduzidas no `App.jsx` após a aceitação do spin (`src/App.jsx:195-206`; `src/hooks/useGameLogic.js:291,352`).

5. **Prêmios de Vitória, Fases e Roleta**:
   - *Modo e Recompensa*: Vitória seta a fase `VICTORY` e calcula `(MODE_CONFIG.baseReward || 100) + currentLevel` (FINGO: 100+lvl, BINGO: 300+lvl, SPINGO: 50+lvl), passando o valor para `NextLevelModal` (`src/hooks/useGameLogic.js:397-404`; `src/components/Modal/NextLevelModal.jsx:35`; `src/App.jsx:420`).
   - *Roleta LuckySpin*: O sorteio calcula o prêmio antecipadamente para alinhamento da animação, mas as moedas só são creditadas quando a roleta conclui sua desaceleração de 8s (`claimLuckySpinReward` em `SHOW_RESULT`) (`src/components/LuckySpin.jsx:124`; `src/hooks/useGameLogic.js:275-280`).
   - *GameOverModal*: Botões claros para continuar com moedas (+10 Balls por 1000 moedas) e continuar via vídeo (+10 Balls grátis) (`src/components/Modal/GameOverModal.jsx:20-59`).

6. **Regras de Hooks no React 19**:
   - *Mitigação*: `MessageModal.jsx` isolou o canvas e emissor de confete no componente `CelebrationContent`, garantindo que `useRef` e `useEffect` sejam chamados incondicionalmente no topo de sua função (`src/components/Modal/MessageModal.jsx:53-125`).

