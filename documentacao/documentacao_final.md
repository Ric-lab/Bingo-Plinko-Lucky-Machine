# 📄 Documentação Final do Sistema — Bingo Plinko Lucky Machine

Esta documentação descreve de forma ultra detalhada a arquitetura, o fluxo de dados, a lógica física e matemática, e os arquivos integradores do projeto **Bingo Plinko Lucky Machine** para Android (compilado via Capacitor/Vite).

---

## 🏛️ 1. Visão Geral da Arquitetura

O jogo combina a mecânica clássica do **Bingo** com a física de queda de bolas do **Plinko**. O projeto foi estruturado em **React** (v19) compilado por **Vite** no frontend, motor de física **Matter.js** para o simulador de Plinko, e empacotado para o ecossistema Android nativo usando o **Capacitor**.

### Principais Tecnologias Utilizadas
*   **React 19:** Biblioteca principal de interface declarativa e gerenciamento de estado.
*   **Matter.js (0.20.0):** Motor físico rígido bidimensional para simular colisões, velocidade e gravidade das bolas do Plinko.
*   **Capacitor (8.0.0):** Framework de conteinerização nativa Android/iOS.
*   **Framer Motion (12.x):** Animações fluidas de UI.
*   **Lucide React:** Conjunto moderno de ícones de interface.
*   **AdMob Plugin (`@capacitor-community/admob`):** Integração nativa de publicidade.
*   **Native Purchases (`@capgo/native-purchases`):** Faturamento e faturamento Google Play IAP.
*   **Google Game Services (`capacitor-google-game-services`):** Cloud Save e Autenticação no Play Games.

---

## 📁 2. Estrutura de Pastas e Arquivos

```
V8 - Bingo Plinko Lucky Machine/
├── android/                         # Projeto Android nativo compilado pelo Gradle
├── public/                          # Assets estáticos (Imagens, Áudios, Política)
│   ├── Audio/                       # Áudios temáticos e imutáveis
│   ├── Images/                      # Skins e imagens organizadas por tema
│   └── privacy-policy.html          # Termos legais e política de privacidade
├── src/                             # Código fonte da aplicação React
│   ├── components/                  # Componentes de interface e jogabilidade
│   │   ├── Modal/                   # Telas sobrepostas de compras, itens e estados
│   │   ├── BingoCard.jsx            # Cartela dinâmica de Bingo
│   │   ├── BucketRow.jsx            # Canos do topo do Plinko
│   │   ├── GameCanvas.jsx           # Motor de física física do Matter.js
│   │   ├── Footer.jsx               # Rodapé com botões de ação e poderes
│   │   └── Tutorial.jsx             # Destaque spotlight para o nível 1
│   ├── hooks/                       # Custom hooks para desacoplar a lógica
│   │   ├── useGameLogic.js          # Máquina de estados do jogo principal
│   │   ├── useSound.js              # Controlador de Audio e overlays
│   │   └── useTheme.js              # Troca de Skins, imagens e sons
│   ├── services/                    # Integrações com SDKs nativos (AdMob, IAP, Play Games)
│   │   ├── adService.js
│   │   ├── purchaseService.js
│   │   ├── cloudSaveService.js
│   │   └── productConfig.js
│   ├── utils/                       # Cálculos e funções auxiliares
│   │   ├── mathUtils.js             # Probabilidades e interpolações lineares
│   │   └── storage.js               # Leitura e escrita persistente
│   ├── App.jsx                      # Orquestrador central e layout raiz
│   ├── main.jsx                     # Ponto de entrada do React
│   └── index.css                    # Folha de estilo e tokens de animação
```

---

## ⚙️ 3. Detalhamento de Arquivos e Código Fonte

### 3.1. Arquivo de Entrada e Orquestração: [App.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/App.jsx)
Orquestra todos os modais, injeta os estados retornados pelos Hooks de tema, som e economia, e gerencia os gatilhos globais de anúncios e sincronização em nuvem.

*   **Inicialização do IAP e Anúncios (linhas 39-43):**
    No evento de montagem (`useEffect`), chama `initAds()` e `initPurchases()`.
*   **Gerenciamento de Volume (linhas 89-105):**
    Calcula dinamicamente a intensidade da música tema principal e de fundo. O volume da BGM (`bgmVolume`) sofre um decremento de 10% quando o usuário está rodando a roleta (`BONUS_WHEEL`), destacando o efeito de som do ponteiro.
*   **Fluxo de Disparo do Plinko (`handleSlotClick`, linhas 354-370):**
    Garante o lançamento da bola chamando a API exposta pelo ref do canvas (`canvasRef.current.dropBall()`). Caso a bola seja do tipo Bola de Fogo (`fireBallActive`), o som `playFireball()` é ativado.
*   **Fluxo de Resolução de Turno (`handleBallLanded`, linhas 372-383):**
    O callback `onBallLanded` do canvas invoca `resolveTurn()`. Se o turno não resultar em marcação ("hit"), renderiza temporariamente o modal "Try Again" (`showMessage('minimal', ...)`).
*   **Tratamento de Avanço de Nível (`handleNextLevel`, linhas 305-325):**
    Garante a transição de fase exibindo um anúncio Interstitial nativo (`showInterstitialAd()`) antes de disparar o avanço `nextLevel()`.

---

### 3.2. Hook de Lógica Central: [useGameLogic.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/hooks/useGameLogic.js)
Define a máquina de estados, regras de vitória, recompensas por modo e gerações numéricas baseadas no nível atual.

*   **Configuração de Limites por Nível (`getLevelRanges`, linhas 9-43):**
    A faixa de números nas colunas **L-U-C-K-Y** é dinâmica e escalável de acordo com o nível da fase:
    *   **Níveis fáceis (Ímpares, ex: 1, 3, 7):** Intervalo de 10 em 10 números (ex: L de 1 a 10, U de 11 a 20...). Total de 50 números possíveis.
    *   **Níveis médios (Pares, ex: 2, 4, 6):** Padrão do Bingo clássico de 15 em 15 números (Total 75 números).
    *   **Níveis difíceis (Múltiplos de 5, ex: 5, 10, 15):** Intervalos estendidos de 20 números por letra, indo até o número 99 na última coluna.
*   **Regras de Vitória por Modo de Jogo (linhas 65-97):**
    *   **FINGO:** Completa o jogo alinhando 5 números adjacentes em linha horizontal, vertical ou diagonal (`checkLineMatch`). Recompensa: `100 + nível` moedas.
    *   **BINGO:** Exige o preenchimento total da cartela (Blackout/Full Card, `checkFullCard`). Recompensa: `300 + nível` moedas.
    *   **SPINGO:** Vitória simples ao marcar quaisquer 5 células livres na cartela selecionadas pelo jogador (`checkAnyFive`). Recompensa: `50 + nível` moedas.
*   **Geração Inteligente do Giro (Rubber Banding, linhas 296-424):**
    Ao invocar `startSpin`, o sistema analisa a cartela do jogador para identificar quais números marcariam o ponto da vitória imediata ("criticalNumbers"). A probabilidade de surgimento de números úteis (Dourados) é interpolada linearmente a partir do nível atual via `calculateProbabilities(currentLevel)`.
    *   *Mecanismo de Desafio:* Se um número crítico for sorteado, a inteligência do jogo aplica uma redução de 80% de chance de exibi-lo caso existam outras alternativas viáveis, evitando que o jogo seja fácil demais em fases avançadas.
*   **Prevenção de Perda de Bolas em Transições (linha 426):**
    O método `dropBall()` decrementa o saldo de bolas de maneira síncrona através do `ballsRef.current` para que o turno seguinte não opere com um valor de closure desatualizado.

---

### 3.3. O Motor Físico do Canvas: [GameCanvas.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/GameCanvas.jsx)
Inicializa o motor Matter.js, desenha os pinos (pegs), sensores de colisão, paredes bônus e controla os efeitos de partículas em tempo real.

*   **Configurações de Rebatimento Física (`PHYSICS_CONFIG`, linhas 14-43):**
    *   `BALL_RADIUS_RATIO`: Raio da bola proporcional à largura da tela (`0.03`).
    *   `BALL_RESTITUTION`: Elasticidade da bola ajustada em `0.59`.
    *   `PEG_RESTITUTION_LARGE` / `PEG_RESTITUTION_SMALL`: Coeficiente de ricochete dos pinos configurado de forma a impulsionar a bola horizontalmente e verticalmente de forma natural (`0.9` e `1.0`).
    *   `GRAVITY_Y`: A aceleração da gravidade é fixada em `1.2`.
*   **Evitando Trapaça de Vitória Consecutiva (linhas 360-367):**
    Caso o jogador esteja em uma sequência superior a 3 vitórias (`ball.customWinStreak >= 3`), a física aplica uma força magnética invisível para o lado no momento em que a bola passa pelos pinos inferiores, induzindo um desvio e garantindo o fator balanceado de aleatoriedade do Plinko.
*   **Glow dos Pinos (linhas 540-569):**
    A cada pino atingido, a física captura a coordenada e insere em `litPegs.current` com um timestamp de duração de `350ms`. O renderizador redesenha um círculo desfocado dourado usando `source-over` com canal Alpha em decaimento cúbico para simular o acendimento físico.
*   **Controle de Partículas de Fogo (linhas 453-538):**
    Para evitar travamento de hardware móvel, as fagulhas geradas pela Bola de Fogo são recicladas limitando o array `particles` a 300 elementos. O renderizador utiliza mistura aditiva (`screen` blending) para intensificar a sensação de calor do gradiente de fogo.

---

### 3.4. Canos do Tabuleiro: [BucketRow.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/BucketRow.jsx)
Exibe as cinco opções de números gerados.

*   **Animação do Giro (Rolling Slot, linhas 7-46):**
    Ao acionar o giro, o componente simula os cilindros de um caça-níquel alternando números aleatórios a cada `60ms` por meio de um loop de `requestAnimationFrame`. Cada coluna para progressivamente com base em um delay incremental (`300ms`, `700ms`, `1100ms`, `1500ms`, `1900ms`).
*   **Filtro de Purity do React 19 (linhas 49-127):**
    A chama estilizada de fogo do sensor ativo de fireball (`FlameUnit`) foi reestruturada para computar posições e durações de animações baseadas no método puro `getDeterministicRandom(id)` resolvendo problemas com a compilação rigorosa do React.

---

### 3.5. Componentes Visuais e Menus

#### [BingoCard.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/BingoCard.jsx)
Desenha as 25 células da cartela do Bingo.
*   *Estilização Temática (linhas 4-15):* Cada uma das 5 colunas tem chaves de estilos específicas (`THEMES`) mapeando tons pastéis e bordas sutis correspondendo às iniciais de L-U-C-K-Y.
*   *Padrão de Visualização (linhas 27-30):* Renderiza um painel com a imagem esticada da moldura da cartela carregada via `getImmutableImage('card.png')`.

#### [SideMenu.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/SideMenu.jsx)
Gaveta lateral de opções adicionais.
*   *Configurações de Controle de Volume (linhas 6-21):* O alternador cíclico (`toggleSetting`) rotaciona a intensidade de áudio e efeitos em três níveis (0: Mudo, 0.5: 50% de volume, 1: Volume máximo).
*   *Link da Política:* O botão no menu lateral redireciona e abre a política de privacidade offline local em uma nova janela (`/privacy-policy.html`).

#### [Header.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/Header.jsx)
Barra superior de controle. Exibe a carteira de moedas em tempo real e desenha um balão colorido indicando o nível atual da fase (`balloonImage` alterna entre verde, amarelo e vermelho a cada 5 níveis para indicar maior dificuldade).

#### [Footer.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/Footer.jsx)
Contém os atalhos de poderes especiais (Bola de Fogo à esquerda, Número Mágico à direita) e a cápsula principal de SPIN contendo o medidor de bolas pendentes para a partida.

#### [LuckySpin.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/LuckySpin.jsx)
Painel da Roleta de Bônus exibido a cada 25 fases.
*   *Mapeamento da Imagem (linhas 6-8):* O array `PRIZE_SLICES` define os prêmios na sequência em que estão desenhados na imagem da roleta (`5, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 10000`).
*   *Análise Geométrica de Rotação (linhas 31-80):* Durante o giro de 8 segundos guiado por uma curva de atenuação suave `cubic-bezier(0.05, 0.7, 0.0, 1)`, a função `checkRotation` extrai a matriz CSS 2D em tempo real para calcular a posição angular da roleta. A cada 36 graus de rotação percorrida, emite uma batida na escala pentatônica maior (`playTicker`) com modulação de tom aleatória.

#### [Tutorial.jsx](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/components/Tutorial.jsx)
Sistema de introdução sobreposto ao primeiro nível.
*   *Efeito Spotlight (linhas 134-146):* Aplica uma borda dourada de contorno no elemento destacado e desenha um sombreamento robusto (`boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'`) simulando um foco de luz apagando o restante do tabuleiro.

---

### 3.6. Custom Hooks de Persistência e Integrações

#### [useTheme.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/hooks/useTheme.js)
Gerencia skins selecionadas e compradas pelo jogador (`'Normal'`, `'Royal Bingo'` ou `'Pets'`).
*   *Resolução de Som Temático:* Caso o tema ativo não possua arquivos de áudio dedicados no diretório de recursos, reverte o retorno automaticamente para o diretório padrão `/Audio/Immutable/` para evitar exceções de arquivos ausentes em tempo de execução.

#### [useSound.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/hooks/useSound.js)
Controlador nativo de áudio HTML5 Audio API.
*   *Reprodução Simultânea (Pool de Overlap, linhas 48-69):* Sons repetitivos e rápidos (como colisões em pinos) utilizam clonagem de nós de áudio em pool (`cloneNode`). Se o pool ultrapassar 10 elementos em execução ativa, pesquisa e reaproveita elementos inativos. O tamanho máximo da pilha do pool de áudio é limitado a 20 para evitar sobrecarga de memória do WebView.

---

## 🔌 4. Serviços de Integrações Nativas (Capacitor)

### 4.1. Serviços de Anúncios: [adService.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/services/adService.js)
Responsável por conectar com as APIs do AdMob nativo para carregar vídeos e banners promocionais.

*   *Banners (linhas 44-63):* Exibidos no topo da tela do lobby (`BannerAdPosition.TOP_CENTER`) usando IDs de teste do AdMob Google.
*   *Interstitials (linhas 97-121):* Carregam e mostram o ad de 15 segundos na troca de fases.
*   *Rewarded Video (linhas 123-182):* Escuta os eventos `Rewarded` e `Dismissed` do AdMob. Possui um temporizador de segurança (`setTimeout` de 120s) para destravar a interface do jogo caso a rede do jogador falhe ou o vídeo trave.

### 4.2. Sistema de Faturamento IAP: [purchaseService.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/services/purchaseService.js) e [productConfig.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/services/productConfig.js)
Implementa compras seguras na Google Play Store.

*   *Consumo de Consumíveis (linhas 55-61):* Imediatamente após uma transação de compra de moedas aprovada no Android, o serviço invoca `consumePurchase` passando o token de compra. Isso limpa a fila do faturamento do Google Play Games, creditando as moedas na carteira do jogador e permitindo novas aquisições do mesmo pacote.
*   *Faturamento do Premium Sem Anúncios (linhas 70-93):* A compra do produto `'no_ads'` desabilita anúncios e ativa a experiência de jogo premium onde todos os itens bonificados por propaganda são resgatados instantaneamente.

### 4.3. Sincronização em Nuvem: [cloudSaveService.js](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/src/services/cloudSaveService.js)
Sincroniza o progresso do usuário no Google Play Games Services na nuvem de forma automática ou manual.

*   *Autenticação automática:* Verifica `isAuthenticated()` antes de invocar métodos de sincronização de estado.
*   *Lógica de Sincronização (linhas 201-258 do App.jsx):* Compara a string de data formatada em ISO 8601 (`savedAt`). Se a nuvem contiver um registro posterior ao gerado localmente, aplica o progresso no dispositivo do jogador; caso contrário, atualiza a nuvem com os dados armazenados localmente.

---

## 🔒 5. Termos Legais e Isenção de Responsabilidade

### [privacy-policy.html](file:///c:/Users/ROG/Desktop/V8%20-%20Bingo%20Plinko%20Lucky%20Machine/public/privacy-policy.html)
Página oficial de termos legais inclusa localmente. Contém:
1.  **Isenção Judicial Completa (Arbitragem):** Estipula de forma expressa que o jogador concorda em resolver quaisquer divergências ou problemas por meio de processos amigáveis ou arbitragem individual, renunciando expressamente a processos coletivos em tribunais contra os desenvolvedores do jogo.
2.  **Consentimento Legal de Uso:** Deixa explícito no texto da política de privacidade que o mero ato de abrir ou jogar o jogo constitui uma aceitação plena de todos os termos nela estipulados.
3.  **Tratamento de Dados:** Transparência sobre o uso de dados anônimos para o Google Play Games Services e exibição de anúncios pelo Google AdMob.
