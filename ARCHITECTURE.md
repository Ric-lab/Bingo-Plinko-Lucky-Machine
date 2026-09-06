# Arquitetura Atual

Status de validação da revisão:
- **Testes Automatizados (Node.js)**: 8 suítes em `test-fingo-physics.mjs` cobrindo assistência de pinos, probabilidades, regra de vitória por modo, física de colisão, fallback de chão, reconstrução estática no resize, idempotência da roleta e isolamento de temporizadores — **100% aprovado (8 de 8)** com funções e configurações reais importadas de `src/hooks/useGameLogic.js` e `src/utils/plinkoPhysics.js`.
- **ESLint**: `npm run lint` — **0 erros, 0 avisos (aprovado)**.
- **Build de Produção**: `npm run build` via Vite v7 — **compilação concluída com sucesso**.
- **Sincronização Android Capacitor**: `npx cap sync android` — **assets sincronizados em android/app/src/main/assets/public**.
- **Execução em Hardware Android**: Código estruturado com `MainActivity.java` e `@capacitor/preferences`, pendente de validação manual direta em dispositivo físico.

---

## 1. Visão em 5 Linhas

1. Jogo de cartela 5×5 com sorteio de cinco números e queda física de bolas no Plinko: o cesto atingido determina a coluna resolvida na cartela (`src/hooks/useGameLogic.js:155-251`; `src/App.jsx:208-233`).
2. Três modos de jogo: FINGO (linha/coluna/diagonal, 50 bolas), BINGO (cartela cheia/blackout, 100 bolas) e SPINGO (quaisquer 5 números marcados, 25 bolas) (`src/hooks/useGameLogic.js:9-86`).
3. Stack: React 19, Vite 7, Tailwind 3, Matter.js 0.20, Framer Motion, Lucide, canvas-confetti e Capacitor 8 (`package.json:14-38`); `main.jsx` monta `App` em `StrictMode` (`src/main.jsx:1-11`).
4. Scripts: `npm run dev` inicia o servidor de desenvolvimento; `npm run build` compila o pacote de produção; `build:android` executa build e sincronização do Capacitor (`package.json:6-13`; `capacitor.config.json:1-6`).
5. Android: `.MainActivity` herda de `BridgeActivity`, dispensa gesto prévio para reprodução de mídia em `onCreate`/`onResume` e opera sob o namespace `com.bingoplinko.game` (`android/app/src/main/AndroidManifest.xml:1-26`; `android/app/src/main/java/com/bingoplinko/game/MainActivity.java:1-21`).

---

## 2. Mapa de Arquivos

| Arquivo em `src/` | Responsabilidade atual e referência |
| --- | --- |
| `main.jsx` | Ponto de entrada; carrega CSS global e monta a raiz React com `StrictMode` (`src/main.jsx:1-11`). |
| `App.jsx` | Orquestrador principal; gerencia telas (Home vs. Game), áudio global/BGM, modais e ponte React-Matter (`src/App.jsx:1-450`). |
| `index.css` | Diretivas Tailwind, utilitários visuais, keyframes de animação e regras de layout/toque (`src/index.css:1-267`). |
| `hooks/useGameLogic.js` | Estado central do jogo: cartela, bolas, moedas, fases, poderes, win checks, timers seguros e níveis (`src/hooks/useGameLogic.js:1-505`). |
| `hooks/useTheme.js` | Resolução de caminhos estáticos para imagens e áudio sob skin `Standard` e pasta `Immutable` (`src/hooks/useTheme.js:1-17`). |
| `hooks/useSound.js` | Gerenciamento de áudio HTML5: instâncias, volume dinâmico, loop, pooling de sobreposição e cleanup (`src/hooks/useSound.js:1-107`). |
| `utils/plinkoPhysics.js` | Constantes físicas (`PHYSICS_CONFIG`), gerador dinâmico do mundo estático (`buildStaticWorld`) e fallback de cesto (`src/utils/plinkoPhysics.js:1-182`). |
| `utils/sessionPhysics.js` | Rastreamento de bolas lançadas na sessão e curva progressiva de assistência para os pinos (`src/utils/sessionPhysics.js:1-94`). |
| `utils/mathUtils.js` | Interpolação de probabilidades por nível e sorteio de colunas premiadas não adjacentes (`src/utils/mathUtils.js:1-97`). |
| `utils/storage.js` | Camada de persistência assíncrona sobre `@capacitor/preferences` com fallback transparente para localStorage (`src/utils/storage.js:1-22`). |
| `components/GameCanvas.jsx` | Canvas Matter.js: renderizador, ciclo de vida da simulação, disparo de bolas, partículas e resize dinâmico (`src/components/GameCanvas.jsx:1-500`). |
| `components/BingoCard.jsx` | Renderização visual da cartela 5×5, células marcadas, centro FREE e cabeçalhos de coluna (`src/components/BingoCard.jsx:1-106`). |
| `components/BucketRow.jsx` | Cestos inferiores numerados com efeito de chamas determinístico e slots giratórios (`src/components/BucketRow.jsx:1-255`). |
| `components/Footer.jsx` | Controles de jogada: botões de Spin, Fireball e Magic Number com indicação de bolas (`src/components/Footer.jsx:1-76`). |
| `components/Header.jsx` | Cabeçalho: saldo de moedas, nível atual por modo e botão de abertura do menu lateral (`src/components/Header.jsx:1-53`). |
| `components/SideMenu.jsx` | Menu lateral com ajustes de volume (música, efeitos, vibração) e botão de retorno à tela inicial (`src/components/SideMenu.jsx:1-143`). |
| `components/LuckySpin.jsx` | Minijogo de roleta bônus a cada 25 níveis, desaceleração com áudio pentatônico e crédito idempotente (`src/components/LuckySpin.jsx:1-228`). |
| `components/Modal/ConfirmationModal.jsx` | Modal genérico de confirmação para compra de poderes ou continuação de partida (`src/components/Modal/ConfirmationModal.jsx:1-111`). |
| `components/Modal/ConfirmationReward.jsx` | Notificação de recompensa concedida com tema verde e ação de fechamento (`src/components/Modal/ConfirmationReward.jsx:1-42`). |
| `components/Modal/FireballModal.jsx` | Diálogo de aquisição da bola de fogo (moedas ou recompensa de vídeo simulado) (`src/components/Modal/FireballModal.jsx:1-79`). |
| `components/Modal/GameOverModal.jsx` | Tela de derrota: opções de compra de +10 bolas ou reinício da fase (`src/components/Modal/GameOverModal.jsx:1-75`). |
| `components/Modal/MagicNumberModal.jsx` | Diálogo de escolha de número desejado na cartela para sorteio forçado (`src/components/Modal/MagicNumberModal.jsx:1-163`). |
| `components/Modal/MessageModal.jsx` | Toasts de feedback de turno e modal de celebração com animação de confete isolada (`src/components/Modal/MessageModal.jsx:1-188`). |
| `components/Modal/NextLevelModal.jsx` | Tela de vitória com recompensa do modo e botão de avanço para a próxima fase (`src/components/Modal/NextLevelModal.jsx:1-64`). |

---

## 3. Fluxo de uma Partida

1. **Início pela Home**: O jogador clica em FINGO, BINGO ou SPINGO na Home (`src/App.jsx:258-296`). O estado `gameStarted` vai para `true`. Se o modo já estava selecionado, `initLevel()` é invocado explicitamente, cancelando timers pendentes da partida anterior e sorteando nova cartela.
2. **Geração da Cartela**: `initLevel()` consulta `getLevelRanges(level)`, gera números aleatórios sem repetição para cada coluna, define a célula central (FREE nos modos FINGO e BINGO; número comum no SPINGO), reinicia a cota de bolas e define a fase como `SPIN` (`src/hooks/useGameLogic.js:155-251`).
3. **Acionamento do Sorteio**: O jogador clica em SPIN no rodapé. O callback valida a fase `SPIN`, ativa a fase transitória `SPINNING`, sorteia os 5 números com auxílio de `calculateProbabilities` e `pickNonAdjacentColumns`, e agenda a transição para `DROP` em 2200 ms via `safeTimeout` (`src/hooks/useGameLogic.js:342-378`).
4. **Animação dos Cestos**: Durante `SPINNING`, os slots dos cestos realizam rolagem numérica até travar nos valores sorteados (`src/components/BucketRow.jsx:7-46`).
5. **Lançamento Físico**: Na fase `DROP`, o jogador seleciona uma das 5 colunas no cesto. `App.handleSlotClick` chama `canvasRef.current.dropBall()`. A bola só é debitada do saldo do jogador se o motor físico confirmar a criação do corpo (`src/App.jsx:178-193`).
6. **Simulação e Queda no Plinko**: A bola colide com paredes e pinos. Se for uma bola normal, o sistema aplica um vetor suave de assistência em direção a colunas úteis com base no histórico da sessão (`src/utils/plinkoPhysics.js:25-27`; `src/components/GameCanvas.jsx:340-373`).
7. **Captura no Sensor / Fallback de Chão**: A bola atinge o sensor do cesto (`bin-i`) ou colide com o chão (`isFloor`). Em ambos os casos, o turno é resolvido: o fallback calcula `computeFloorFallbackBin(ball.position.x, width)`, evitando congelamento na fase `RESOLVE` (`src/components/GameCanvas.jsx:405-464`; `src/utils/plinkoPhysics.js:49-52`).
8. **Resolução de Marcação e Checagem de Vitória**: `resolveTurn` marca a célula na cartela se houver correspondência, credita moedas por acerto e avalia a condição de vitória do modo (`checkLineMatch`, `checkFullCard` ou `checkAnyFive`). Havendo vitória, agenda a fase `VICTORY` e exibe o `NextLevelModal` com a recompensa calculada (`src/hooks/useGameLogic.js:380-440`).
9. **Continuação ou Game Over**: Se não houver vitória e as bolas chegarem a zero, o jogo transita para `GAME_OVER` após 750 ms (`src/hooks/useGameLogic.js:424-436`). Caso ainda restem bolas, retorna à fase `SPIN`.
10. **Roleta Bônus (Lucky Spin)**: Ao atingir múltiplos de 25 níveis em qualquer modo, o jogo transita para `BONUS_WHEEL`. O giro da roleta é acionado pelo jogador e a recompensa é creditada de forma estritamente idempotente ao parar (`src/hooks/useGameLogic.js:275-300`; `src/components/LuckySpin.jsx:82-126`).

---

## 4. Dono de Cada Estado

| Estado | Onde vive | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| `coins` | `src/hooks/useGameLogic.js:125` | Hidratação, `resolveTurn`, `buyItem`, `claimLuckySpinReward` | Hook (persistência), Header e modais via `App.jsx` |
| `levels` / `currentLevel` | `src/hooks/useGameLogic.js:127-131` | Hidratação, `nextLevel` | Hook (ranges, dificuldade, prêmios) e Header |
| `balls` | `src/hooks/useGameLogic.js:150` | `initLevel`, `dropBall`, compras em `buyItem` | Guardas de disparo, derrota e indicador no `Footer.jsx` |
| `bingoCard` | `src/hooks/useGameLogic.js:151` | `initLevel`, marcações em `resolveTurn` | `BingoCard.jsx`, `BucketRow.jsx`, `MagicNumberModal.jsx` e `goldenCols` |
| `slotsResult` | `src/hooks/useGameLogic.js:152` | `initLevel`, `startSpin`, `resolveTurn` | `BucketRow.jsx` e cálculo de `goldenCols` |
| `phase` | `src/hooks/useGameLogic.js:159` | Inicialização, spin, queda, vitória, derrota e compras | Guardas no hook, `Footer.jsx`, `BucketRow.jsx` e modais em `App.jsx` |
| `isGameOver`, `winState`, `winReward` | `src/hooks/useGameLogic.js:153-154,161` | `initLevel`, `resolveTurn`, compras em `buyItem` | Modais de fim de jogo (`NextLevelModal`, `GameOverModal`) |
| `fireBallActive`, `magicActive` | `src/hooks/useGameLogic.js:155-156` | Compras em `buyItem`, limpos após uso em `resolveTurn` | `GameCanvas.jsx` (propriedades da bola) e `BucketRow.jsx` |
| `luckySpinReward` | `src/hooks/useGameLogic.js:160` | `spinLuckySpin` (define), `claimLuckySpinReward` (consome) | `LuckySpin.jsx` |
| `canvasRef`, `runnerRef` | `src/App.jsx:176`; `src/components/GameCanvas.jsx:47` | Refs de montagem e controle do ciclo de vida | Invocação de `dropBall` e cancelamento de física no unmount |
| `audioSettings` | `src/App.jsx:23-27` | Hidratação e `src/components/SideMenu.jsx:55-82` | Persistência `bplm.audio.v1`, BGM/SFX em `App.jsx` e `SideMenu.jsx` |
| `gameStarted` | `src/App.jsx:47` | Seleção de modo na Home e botão Home do menu lateral | Alternância de tela Home vs. Jogo em `src/App.jsx:240-449` |
| `messageModal` | `src/App.jsx:156` | `showMessage` / `closeMessage` em eventos de jogo | Renderização do `MessageModal` para toasts e celebrações |
| `showMagicModal`, `showFireballConfirm` | `src/App.jsx:158-159` | Botões do rodapé em `src/App.jsx:374-380` | Visibilidade dos diálogos de poder |

---

## 5. Fronteira Física / Render

- **Matter.js**: Gerencia os corpos rígidos físicos (bolas, pinos, paredes laterais, divisores e sensores), gravidade e detecção de colisões. `Runner.run` avança o relógio da simulação e `Render.run` desenha na camada Canvas interna (`src/components/GameCanvas.jsx:153-168,441-445`).
- **React / DOM**: Renderiza toda a interface do usuário (cartela, cabeçalho, rodapé com cestos alinhados ao Canvas, modais e menu lateral).
- **Interface React ↔ Matter**:
  - *Comando de Entrada*: `canvasRef.current.dropBall(colIndex, isFireball)` cria o corpo no mundo físico.
  - *Evento de Saída*: `onBallLandedRef.current(binIdx, isFireball)` notifica o orquestrador React sobre o cesto atingido.

---

## 6. Convenção de Assets

- **Imagens**: A pasta `public/Images/` divide-se em `Standard/` (skin visual padrão: fundo, cartela, balões, botões e sprites físicos `ball.png`, `peg.png`, `triangle.png`) e `Immutable/` (elementos invariantes como `roleta.png`). A resolução de caminhos é centralizada em `src/hooks/useTheme.js:1-17`.
- **Áudio**: A pasta `public/Audio/` segue a mesma convenção: `Standard/` (`song.mp3`, `peg.mp3`, `buttons.mp3`) e `Immutable/` (`Theme.mp3`, `slot.mp3`, `fireball.mp3`, `explosion.mp3`, `lucky.mp3`, `BINGO!.mp3`, `palheta.mp3`).

---

## 7. Onde Mexer Para (10 Tarefas Essenciais)

| Tarefa | Arquivo exato / ponto atual |
| --- | --- |
| 1. Mudar gravidade do jogo | `src/utils/plinkoPhysics.js:40` (`PHYSICS_CONFIG.GRAVITY_Y`) e `src/components/GameCanvas.jsx:154`. |
| 2. Adicionar ou alterar modo de jogo | `src/hooks/useGameLogic.js:9-25` (`MODE_CONFIG`), `src/hooks/useGameLogic.js:59-86` (funções de vitória) e `src/App.jsx:258-296` (botões da Home). |
| 3. Trocar áudio ou volume dos pinos | `public/Audio/Standard/peg.mp3`; volume e pooling em `src/App.jsx:83` e resolução em `src/hooks/useTheme.js:6`. |
| 4. Ajustar valores da economia (moedas/custos) | `src/hooks/useGameLogic.js:83-86,291-300,432-475`; modais em `src/components/Modal/FireballModal.jsx:15`, `src/components/Modal/MagicNumberModal.jsx:30`, `src/components/Modal/GameOverModal.jsx:24`. |
| 5. Adicionar nova tela ou modal de interface | `src/App.jsx:240-449` — controle de renderização condicional e modais. |
| 6. Mudar faixas numéricas de bingo por nível | `src/hooks/useGameLogic.js:27-54` (`getLevelRanges`). |
| 7. Alterar chances e distribuição de colunas douradas | `src/utils/mathUtils.js:25-95` e `src/hooks/useGameLogic.js:320-355`. |
| 8. Modificar a força de assistência aos pinos | `src/utils/sessionPhysics.js:70-94` e `src/components/GameCanvas.jsx:335-373`. |
| 9. Alterar prêmios ou posições da roleta Lucky Spin | `src/components/LuckySpin.jsx:7-8,83-115` e imagem `public/Images/Immutable/roleta.png`. |
| 10. Ajustar física de resize, pinos ou sensores | `src/utils/plinkoPhysics.js:6-43,59-178` (`PHYSICS_CONFIG`, `buildStaticWorld`, `computeFloorFallbackBin`) e `src/components/GameCanvas.jsx:449-472` (`handleResize`). |

---

## 8. Armadilhas e Mitigações Arquiteturais

1. **Retorno à Home e Isolamento de Partidas**:
   - *Problema*: Retornar à Home durante o giro numérico (`SPINNING`) deixava temporizadores pendentes que disparavam `DROP` na partida seguinte com cartela desincronizada (`[0,0,0,0,0]`).
   - *Mitigação*: `useGameLogic.js` implementa `timersRef` e `safeTimeout`. A função `initLevel()` executa `clearAllTimers()`, cancelando imediatamente qualquer timer pendente de rodadas anteriores (`src/hooks/useGameLogic.js:157-185,248`).
2. **Garantia de Encerramento de Turno & Fallback de Chão**:
   - *Problema*: Bolas que não atingiam os sensores de cesto poderiam deixar a fase congelada em `RESOLVE`.
   - *Mitigação*: O listener de colisão trata `isFloor` e calcula o cesto pelo eixo horizontal com `computeFloorFallbackBin(ball.position.x, width)`, despachando o evento para `onBallLandedRef.current`. Além disso, bolas só são debitadas se `dropBall()` retornar `true` (`src/components/GameCanvas.jsx:449-464`; `src/utils/plinkoPhysics.js:49-52`).
3. **Reconstrução Estática no Resize e Orientação de Tela**:
   - *Problema*: Corpos estáticos (`isStatic: true`) mantinham posições calculadas na montagem inicial; ao redimensionar a janela ou rotacionar o celular, cestos, pinos e chão ficavam desalinhados da interface React.
   - *Mitigação*: `handleResize` invoca `buildStaticWorld(engine, width, height)` de forma debounced, removendo todos os corpos estáticos antigos e reconstruindo paredes, chão, pinos, funis e sensores milimetricamente proporcionais às novas dimensões (`src/components/GameCanvas.jsx:449-472`; `src/utils/plinkoPhysics.js:59-178`).
4. **Idempotência no Crédito da Roleta (Lucky Spin)**:
   - *Problema*: Chamar `claimLuckySpinReward` repetidamente acumulava créditos adicionais indevidos.
   - *Mitigação*: A função consome imediatamente `luckySpinReward`, redefinindo-o para `null`. Chamadas subsequentes retornam `0` sem alterar a carteira de moedas (`src/hooks/useGameLogic.js:291-300`).
5. **Compra Segura de Poderes**:
   - *Mitigação*: `startSpin` valida a fase e retorna um valor booleano. A dedução de moedas em `App.jsx` só ocorre após a confirmação de que o sorteio foi aceito pelo motor lógico (`src/App.jsx:195-206`).
6. **Conformidade com Regras de Hooks no React 19**:
   - *Mitigação*: Remoção de efeitos com chamadas a `setState` desnecessárias; `BucketRow.jsx` utiliza presets determinísticos de chama (`FLAME_PRESETS`) eliminando `Math.random()` durante o fluxo de renderização; `MessageModal.jsx` isola confete em componente filho dedicado (`CelebrationContent`) (`src/components/BucketRow.jsx:5-11,48-126`; `src/components/Modal/MessageModal.jsx:53-125`).
