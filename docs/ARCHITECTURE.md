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
| `App.jsx` | Compõe telas, áudio, modais e a ponte entre ações lógicas e canvas (`src/App.jsx:22-90,155-229,231-441`). |
| `index.css` | Diretivas Tailwind, utilitários de contorno, animações e regras globais de tamanho/toque/overflow (`src/index.css:1-13,18-267`). |
| `hooks/useGameLogic.js` | Gera cartela/sorteios, controla fases, moedas, bolas, compras, vitória e progressão por modo (`src/hooks/useGameLogic.js:114-483`). |
| `hooks/useTheme.js` | Resolve caminhos de imagem/áudio com skin fixa `Standard` e pasta `Immutable` (`src/hooks/useTheme.js:5-19`). |
| `hooks/useSound.js` | Mantém objetos `Audio`, reprodução simples ou sobreposta, volume, loop e parada (`src/hooks/useSound.js:3-104`). |
| `utils/storage.js` | Lê/escreve JSON via `Preferences`, retornando `null` na falha de leitura e absorvendo falhas de escrita (`src/utils/storage.js:1-21`). |
| `utils/mathUtils.js` | Interpola probabilidades por nível e sorteia combinação de colunas não adjacentes, reduzindo a quantidade quando necessário (`src/utils/mathUtils.js:9-10,30-95`). |
| `utils/sessionPhysics.js` | Conta quedas em `sessionStorage` com alternativa em memória; fornece reset e fator de assistência (`src/utils/sessionPhysics.js:12-92`). |
| `components/GameCanvas.jsx` | Cria mundo/render Matter, expõe lançamento, trata colisões e desenha efeitos de impacto/fogo (`src/components/GameCanvas.jsx:43-134,136-663`). |
| `components/BingoCard.jsx` | Desenha cabeçalhos LUCKY, células, centro FREE e marcações a partir de `card` (`src/components/BingoCard.jsx:3-17,33-100`). |
| `components/BucketRow.jsx` | Exibe cinco resultados/letras, anima sorteio e chamas e aceita seleção durante `DROP` (`src/components/BucketRow.jsx:7-46,49-147,149-234`). |
| `components/Footer.jsx` | Botões de spin/fireball/magic e indicação de bolas, DROP ou WAIT conforme fase (`src/components/Footer.jsx:3-76`). |
| `components/Header.jsx` | Mostra saldo, nível com balão condicionado por divisibilidade e botão de menu (`src/components/Header.jsx:4-48`). |
| `components/SideMenu.jsx` | Alterna música/efeitos/vibração entre 0, 0.5 e 1; oferece retorno ao início e Help que fecha o menu (`src/components/SideMenu.jsx:4-21,55-82,106-140`). |
| `components/LuckySpin.jsx` | Anima roleta para prêmio retornado pelo hook, produz ticker pela rotação DOM e permite continuar (`src/components/LuckySpin.jsx:6-126,175-228`). |
| `components/Modal/ConfirmationModal.jsx` | Confirmação visual parametrizada por textos/ícone/tema, com cancelamento e ação secundária opcionais (`src/components/Modal/ConfirmationModal.jsx:4-109`). |
| `components/Modal/ConfirmationReward.jsx` | Exibe recompensa concedida com ícone/textos e botão que chama `onClose` (`src/components/Modal/ConfirmationReward.jsx:4-40`). |
| `components/Modal/FireballModal.jsx` | Compra fireball por 250 ou concede a custo zero após temporizador de vídeo simulado (`src/components/Modal/FireballModal.jsx:14-75`). |
| `components/Modal/GameOverModal.jsx` | Oferece +10 bolas por 1000 moedas, vídeo grátis ou reinício via callback (`src/components/Modal/GameOverModal.jsx:19-75`). |
| `components/Modal/MagicNumberModal.jsx` | Seleciona célula não marcada/não FREE, cobra 500 ou simula vídeo e solicita spin mágico (`src/components/Modal/MagicNumberModal.jsx:14-71,94-119`). |
| `components/Modal/MessageModal.jsx` | Renderiza mensagens, TRY AGAIN e celebração LUCKY com canvas de confete isolado (`src/components/Modal/MessageModal.jsx:5-49,53-165`). |
| `components/Modal/NextLevelModal.jsx` | Toca bingo, exibe imagem/prêmio e chama avanço de nível no botão NEXT (`src/components/Modal/NextLevelModal.jsx:9-64`). |

## 3. Fluxo de uma partida

1. Os `onClick` da home em `App` escolhem `gameMode` e ativam `gameStarted`; se for o mesmo modo já ativo, chama `initLevel` explicitamente (`src/App.jsx:258-296`; `src/hooks/useGameLogic.js:213-228`).
2. `initLevel` usa `getLevelRanges` e `getUniqueRandoms`, monta células `{id,col,row,num,marked,isFree}` em ordem de linhas, aplica centro FREE conforme modo, repõe bolas e define `SPIN` (`src/hooks/useGameLogic.js:9-43,105-112,166-224`).
3. O `onClick={onSpin}` de `Footer` chega ao callback de `App`, que toca clique e chama `startSpin(val)`; o botão só está habilitado em `SPIN` (`src/components/Footer.jsx:37-43`; `src/App.jsx:370-373`).
4. `startSpin` valida se está em `SPIN` (ou `DROP` com override numérico), retorna boolean, muda para `SPINNING`, reúne números ainda necessários, usa `calculateProbabilities` e `pickNonAdjacentColumns`, preenche os cinco resultados e agenda `DROP` após 2200 ms (`src/hooks/useGameLogic.js:288-352`).
5. Em paralelo, `RollingSlot.update` mostra números transitórios de 1 a 75 até o alvo; atrasos por coluna são `300 + i*400` ms, com revelação 200 ms depois (`src/components/BucketRow.jsx:7-39,216-221`).
6. Em `DROP`, o clique de `BucketRow` chama `onSlotClick(i)` → `App.handleSlotClick`; `App` aciona `canvasRef.current.dropBall` primeiro e só desconta bolas se a física criar a bola (`src/App.jsx:178-193`).
7. `GameCanvas.dropBall`, exposto por `useImperativeHandle`, cria `Bodies.circle`, escolhe posição/velocidade por tipo de bola, adiciona ao mundo e retorna `true` (`src/components/GameCanvas.jsx:74-133`).
8. O callback de `collisionStart` reconhece bola e sensor `bin-i` (ou fallback de chão `isFloor`); `processedBalls` bloqueia repetição por ID, extrai `binIdx` e chama `onBallLandedRef.current(binIdx,isFireball)` (`src/components/GameCanvas.jsx:400-459`).
9. `App.handleBallLanded` trata som de fireball, obtém `slotsResult[binIndex]` e chama `resolveTurn`; este limpa poderes/resultados e marca células com número igual ainda não marcado (`src/App.jsx:208-233`; `src/hooks/useGameLogic.js:361-377`).
10. Em acerto, `resolveTurn` grava a cartela, credita 5 moedas e chama `checkLineMatch`, `checkFullCard` ou `checkAnyFive`; vitória agenda `winState=true`, `phase='VICTORY'` e prêmio do modo (100/300/50 + nível) após 1100 ms (`src/hooks/useGameLogic.js:382-406`).
11. Sem vitória, bolas esgotadas levam a `GAME_OVER` após 750 ms; havendo bolas, volta a `SPIN`. O retorno `{hit,earned,hasBingo,isDefeat}` controla LUCKY/TRY AGAIN em `handleBallLanded` (`src/hooks/useGameLogic.js:408-438`).
12. `App` escolhe `NextLevelModal` (se `winState`) ou `GameOverModal` por `phase`; `nextLevel` incrementa apenas o modo ativo ou abre `BONUS_WHEEL` em múltiplos de 25. `spinLuckySpin` sorteia antecipadamente e `claimLuckySpinReward` credita no fim da rotação (`src/App.jsx:413-440`; `src/hooks/useGameLogic.js:253-286`).

## 4. Dono de cada estado

Na tabela, `GL` significa `src/hooks/useGameLogic.js`; as referências dos leitores indicam também os repasses de props.

| Estado | Onde vive | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| `coins` | GL:116 | Hidratação, `resolveTurn`, `buyItem`, `claimLuckySpinReward` (`src/hooks/useGameLogic.js:132,275,385-404,442`) | Persistência/compras no hook e UI/modais via `App` (`src/hooks/useGameLogic.js:144,441`; `src/App.jsx:311,368,388,398,424`). |
| `levels`; derivado `currentLevel` | GL:119-123,148 | Hidratação, `nextLevel`, `completeLuckySpin` (`src/hooks/useGameLogic.js:134,247-250,283-286`) | Persistência, geração, sorteio, recompensa, Header/NextLevelModal (`src/hooks/useGameLogic.js:144,168,306,400-403`; `src/App.jsx:310,417`). |
| `balls` | GL:150 | `initLevel`, `dropBall`, `buyItem` (`src/hooks/useGameLogic.js:220,356,444-448`) | Guardas/derrota e Footer (`src/hooks/useGameLogic.js:354,408,419`; `src/App.jsx:369`). |
| `bingoCard` | GL:151 | `initLevel`, acerto de `resolveTurn` (`src/hooks/useGameLogic.js:214,382`) | Sorteio/marcação, `goldenCols`, BingoCard, BucketRow e MagicNumberModal (`src/hooks/useGameLogic.js:298,370`; `src/App.jsx:56-67,332,355,391`). |
| `slotsResult` | GL:152 | `initLevel`, `startSpin`, `resolveTurn` (`src/hooks/useGameLogic.js:222,349,366`) | `goldenCols`, `handleBallLanded`, BucketRow (`src/App.jsx:56-67,220,354`). |
| `phase` | GL:159 | Inicialização, spin/drop/resolução, `nextLevel`, compras de bolas/continue (`src/hooks/useGameLogic.js:217,242,293,350-355,397-428,446-450`) | Guardas do hook; áudio, Footer, BucketRow e telas em App (`src/hooks/useGameLogic.js:241,291,354`; `src/App.jsx:78,126,148,357,367,414-434`). |
| `isGameOver`, `winState`, `winReward` | GL:153-154,161 | Inicialização/resolução; compras limpam `isGameOver` (`src/hooks/useGameLogic.js:215-217,395-403,410-422,445-449`) | `winState`: resolução e escolha de modal; `winReward`: repassado para `NextLevelModal` (`src/hooks/useGameLogic.js:420,435,466`; `src/App.jsx:51,415,420`). |
| `fireBallActive`, `magicActive` | GL:155-156 | Init/resolução limpam; compra ativa fireball, spin numérico ativa magic (`src/hooks/useGameLogic.js:223-224,316-319,363-364,452`) | `goldenCols`, lançamento/som, BucketRow (`src/App.jsx:56-67,180-189,358-359`). |
| `luckySpinReward` | GL:160 | `spinLuckySpin`/`completeLuckySpin` (`src/hooks/useGameLogic.js:271,282`) | LuckySpin via App (`src/App.jsx:438`; `src/components/LuckySpin.jsx:22,209`). |
| `canvasRef`; `runnerRef` | `src/App.jsx:176`; `src/components/GameCanvas.jsx:47` | React/ref imperativa; setup Matter (`src/App.jsx:343`; `src/components/GameCanvas.jsx:74-133,613,646`) | Lançamento, dimensões, colisões e parada do runner (`src/App.jsx:183`; `src/components/GameCanvas.jsx:646`). |
| `onBallLandedRef`, `vibrationLevelRef` | `src/components/GameCanvas.jsx:51-53` | Efeitos sincronizam props (`src/components/GameCanvas.jsx:64-72`) | Callback de colisões sem closures estagnadas (`src/components/GameCanvas.jsx:383,427,446`). |

## 5. Fronteira física/render

- Matter controla corpos, gravidade, velocidade, colisões, paredes, chão, pinos, funis e sensores; `Runner.run` atualiza o engine, `Render.run` desenha seu canvas (`src/components/GameCanvas.jsx:101-133,150-304,307-459,614-615`).
- React/DOM controla home, cartela, saldo, botões, menu e modais; BucketRow é sobreposição DOM na mesma área do canvas, com cinco itens flexíveis (`src/App.jsx:231-441`; `src/components/BucketRow.jsx:168-195`).
- A entrada React→Matter é `canvasRef.current.dropBall(colIndex,isFire)`; a saída é `onBallLandedRef.current(binIdx,isFireball)`. O número e as moedas são resolvidos fora do Matter (`src/App.jsx:178-233`; `src/components/GameCanvas.jsx:74-133,423-455`; `src/hooks/useGameLogic.js:361-404`).

## 6. Convenção de assets

- A estrutura em `public/Images` mantém `Standard/` e `Immutable/`; os resolvers retornam caminhos absolutos `/Images/Standard/<filename>` e `/Images/Immutable/<filename>` (`src/hooks/useTheme.js:5-11`).
- Standard fornece fundo, cartela, letras L/U/C/K/Y, células, balões de nível e botões de rodapé (`src/App.jsx:240`; `src/components/BingoCard.jsx:3,26,37,78`; `src/components/Header.jsx:6-10,28`; `src/components/Footer.jsx:15,29,49,69`).
- Sprites físicos vêm de `ball.png`, `peg.png`, `triangle.png`; escalas usam divisores fixos 128, 64 e 80/180 (`src/components/GameCanvas.jsx:114-116,215-217,234-236,268-270`).
- Áudio segue `/Audio/Standard/` e `/Audio/Immutable/`: `song.mp3`, `peg.mp3`, `buttons.mp3` usam skin; tema, slot, fireball, explosão, lucky, bingo e palheta usam Immutable (`src/hooks/useTheme.js:10-11`; `src/App.jsx:80-90`).

## 7. Onde mexer para

| Tarefa | Arquivo exato / ponto atual |
| --- | --- |
| Mudar gravidade | `src/components/GameCanvas.jsx:40,152` — `PHYSICS_CONFIG.GRAVITY_Y` e aplicação no mundo. |
| Adicionar modo | `src/hooks/useGameLogic.js:45-61,119-123,387-402` — configuração, níveis, vitória/crédito; `src/App.jsx:258-296` — seleção de modo. |
| Trocar som de pino | `public/Audio/Standard/peg.mp3`; escolha/volume em `src/App.jsx:83`, resolução em `src/hooks/useTheme.js:10`. |
| Mudar valor da economia | `src/hooks/useGameLogic.js:116,253-277,383-404,440-453` — saldo/créditos/compra; preços em `src/components/Modal/FireballModal.jsx:15`, `src/components/Modal/MagicNumberModal.jsx:30`, `src/components/Modal/GameOverModal.jsx:24`. |
| Adicionar tela | `src/App.jsx:231-441` — composição e condições de home, jogo, modais e bônus. |
| Mudar faixas numéricas por nível | `src/hooks/useGameLogic.js:9-43,171-175,335-343` — `getLevelRanges` e seus consumidores. |
| Mudar chance/quantidade de números úteis | `src/utils/mathUtils.js:30-95` e `src/hooks/useGameLogic.js:303-322` — probabilidades e colunas não adjacentes. |
| Mudar assistência da bola | `src/utils/sessionPhysics.js:78-92` e `src/components/GameCanvas.jsx:26,341-374` — fator e aplicação da força. |
| Mudar prêmio/posição da roleta | `src/hooks/useGameLogic.js:253-277` — sorteio/crédito; `src/components/LuckySpin.jsx:6-8,89-120` — ordem/ângulo; imagem: `public/Images/Immutable/roleta.png`. |

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
