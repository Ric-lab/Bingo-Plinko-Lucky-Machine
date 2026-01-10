import { useRef, useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import SideMenu from './components/SideMenu';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';
import { useTheme } from './hooks/useTheme';
import { useSound } from './hooks/useSound';



import MagicNumberModal from './components/Modal/MagicNumberModal';
import MessageModal from './components/Modal/MessageModal';
// import ConfirmationModal from './components/Modal/ConfirmationModal'; // Removed as it was only used for Fireball
import GameOverModal from './components/Modal/GameOverModal';
import NextLevelModal from './components/Modal/NextLevelModal';
import FireballModal from './components/Modal/FireballModal';
import ShopModal from './components/Modal/ShopModal';
import LuckySpin from './components/LuckySpin';

export default function App() {
  // Global Settings (Defined early to use in hooks)
  const [audioSettings, setAudioSettings] = useState({
    music: 1, // 0: Off, 0.5: Low, 1: High
    sfx: 1,
    vibration: 1
  });

  const {
    state: { coins, balls, level, bingoCard, slotsResult, winState, phase, fireBallActive, magicActive, luckySpinReward },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem, nextLevel, spinLuckySpin, completeLuckySpin, forceWin }
  } = useGameLogic();

  const {
    currentSkin,
    setCurrentSkin,
    ownedSkins,
    unlockSkin,
    getImage,
    getImmutableImage,
    getSound,
    getImmutableSound
  } = useTheme();

  // Home Screen State (Moved to top for audio logic accessibility)
  const [gameStarted, setGameStarted] = useState(false);

  // Audio Hooks (BGM Volume 0.3, Pegs at 1.0)
  // Ducking: Reduce volume by 75% (0.25 multiplier) during Lucky Spin
  const baseBgmVolume = 0.3 * audioSettings.music;
  const bgmVolume = phase === 'BONUS_WHEEL' ? baseBgmVolume * 0.9 : baseBgmVolume;

  const { play: playTheme, stop: stopTheme } = useSound(getImmutableSound('Theme.mp3'), { volume: baseBgmVolume, loop: true });
  const { play: playBGM, stop: stopBGM } = useSound(getSound('song.mp3'), { volume: bgmVolume, loop: true });
  const { play: playSpin, stop: stopSpin } = useSound(getImmutableSound('slot.mp3'), { volume: 0.05 * audioSettings.sfx, loop: true });
  const { play: playPeg } = useSound(getSound('peg.mp3'), { volume: 1.0 * audioSettings.sfx, multi: true });
  const { play: playClick } = useSound(getSound('buttons.mp3'), { volume: 0.25 * audioSettings.sfx });
  // Fireball SFX
  const { play: playFireball, stop: stopFireball } = useSound(getImmutableSound('fireball.mp3'), { volume: 0.3 * audioSettings.sfx, loop: true });
  const { play: playExplosion } = useSound(getImmutableSound('explosion.mp3'), { volume: 1.0 * audioSettings.sfx });
  const { play: playLucky } = useSound(getImmutableSound('lucky.mp3'), { volume: 0.2 * audioSettings.sfx });
  const { play: playBingo } = useSound(getImmutableSound('BINGO!.mp3'), { volume: 0.2 * audioSettings.sfx });
  const { play: playPalheta } = useSound(getImmutableSound('palheta.mp3'), { volume: 0.4 * audioSettings.sfx });

  // Manage Background Music based on Game Phase and Home Screen
  useEffect(() => {
    // If on Home Screen, play Theme and stop Game Music
    if (!gameStarted) {
      if (audioSettings.music > 0) {
        playTheme();
      }
      stopBGM();

      // Fallback for autoplay policy on Home Screen
      const handleHomeInteraction = () => {
        // Retry playing
        playTheme();
        window.removeEventListener('click', handleHomeInteraction);
      };
      window.addEventListener('click', handleHomeInteraction);
      return () => {
        window.removeEventListener('click', handleHomeInteraction);
        stopTheme(); // Ensure theme stops when effect re-runs or unmounts
      };
    }

    // GAME LOOP MUSIC
    // There is no 'PLAYING' phase. The active phases are 'SPIN', 'SPINNING', 'DROP', 'RESOLVE'.
    const isGameActive = (phase !== 'GAME_OVER' && phase !== 'VICTORY');

    if (isGameActive && gameStarted) {
      stopTheme(); // Ensure Theme is stopped
      playBGM();

      // FALLBACK: If autoplay blocked, try again on first interaction
      const handleInteraction = () => {
        playBGM();
        // Remove self after success (or attempt)
        window.removeEventListener('click', handleInteraction);
      };
      window.addEventListener('click', handleInteraction);
      return () => window.removeEventListener('click', handleInteraction);

    } else {
      stopBGM();
      if (gameStarted) stopTheme(); // Double confirm
    }
  }, [phase, gameStarted, playBGM, stopBGM, playTheme, stopTheme, audioSettings.music]);

  // Manage Spin Sound
  useEffect(() => {
    if (phase === 'SPINNING') {
      playSpin();
    } else {
      stopSpin();
    }
  }, [phase, playSpin, stopSpin]);

  // New Message Modal State
  const [messageModal, setMessageModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showFireballConfirm, setShowFireballConfirm] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper to show modal
  const showMessage = (type, title, message, autoCloseDuration = 0) => {
    setMessageModal({ isOpen: true, type, title, message });

    if (autoCloseDuration > 0) {
      setTimeout(() => {
        closeMessage();
      }, autoCloseDuration);
    }
  };

  const closeMessage = () => {
    setMessageModal(prev => ({ ...prev, isOpen: false }));
  };
  const canvasRef = useRef();

  const handleSlotClick = (colIndex) => {
    // Attempt logic drop
    const isFire = fireBallActive;
    if (dropBall(colIndex)) {
      // Visual drop (ball)
      if (canvasRef.current) {
        canvasRef.current.dropBall(colIndex, isFire);
      }

      // SFX for Fireball
      if (isFire) {
        playFireball();
      }
    }
  };

  const handleMagicSpin = (number, cost) => {
    // 1. Transaction
    if (buyItem('magic', cost)) {
      // 2. Force Spin
      startSpin(number);
      // 3. Close & Feedback handled by component
    }
    // Error handled by modal
  };

  const handleBallLanded = (binIndex, isFireball = false) => {
    // 1. Handle Fireball SFX
    if (isFireball) {
      stopFireball();
      playExplosion();
    }

    const landedNumber = slotsResult[binIndex];
    const result = resolveTurn(landedNumber, binIndex);

    // Trigger Feedback
    if (result) {
      if (result.hit) {
        // Show "LUCK!" only if game continues (Not Bingo AND Not Defeat)
        if (!result.hasBingo && !result.isDefeat) {
          playLucky();
          showMessage('celebration', 'LUCKY!', `+${result.earned}🟡`, 1750);
        }
      } else {
        // Minimal Try Again - Only loop if NOT Game Over
        if (!result.isDefeat) {
          showMessage('minimal', 'TRY AGAIN', '', 1000);
        }
      }
    }
  };

  return (
    <div
      className="w-full h-[100dvh] flex flex-col relative overflow-hidden md:max-w-md mx-auto shadow-2xl md:border-x-2 border-gray-200 font-sans select-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{
        backgroundImage: `url(${getImage('Background.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* HOME SCREEN OVERLAY */}
      {!gameStarted && (
        <div
          className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center"
        >
          {/* Background Image */}
          <img
            src={getImmutableImage('Home.png')}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Game Mode Buttons */}
          <div className="relative z-10 flex flex-col gap-6 items-center mt-[40vh]">
            {/* Bingo (Coming Soon) */}
            <button
              onClick={() => {
                playClick();
                showMessage('info', 'COMING SOON', 'This mode is still under construction! 🚧');
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('BingoButton.png')} alt="Bingo" className="w-full drop-shadow-2xl" />
            </button>

            {/* 5 Row (Current Game) */}
            <button
              onClick={() => {
                playClick();
                setGameStarted(true);
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('FingoButton.png')} alt="Fingo" className="w-full drop-shadow-2xl" />
            </button>

            {/* Spingo (Coming Soon) */}
            <button
              onClick={() => {
                playClick();
                showMessage('info', 'COMING SOON', 'This mode is still under construction! 🚧');
              }}
              className="w-64 transition-transform hover:scale-105 active:scale-95"
            >
              <img src={getImmutableImage('SpingoButton.png')} alt="Spingo" className="w-full drop-shadow-2xl" />
            </button>
          </div>
        </div>
      )}

      <Header
        coins={coins}
        balls={balls}
        level={level}
        onOpenShop={() => {
          playClick();
          setShowShopModal(true);
        }}
        onOpenMenu={() => {
          playClick();
          setIsMenuOpen(true);
        }}
        getImmutableImage={getImmutableImage}
      />

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={audioSettings}
        onUpdateSettings={setAudioSettings}
      />

      {/* Bingo Card (Compact: 85% width) */}
      <div className="flex-shrink-0 w-full flex justify-center pb-0 bg-white/10 backdrop-blur-md z-10 border-b border-white/20">
        <div className="w-[85%] max-w-[360px]">
          <BingoCard
            card={bingoCard}
            level={level}
            getImage={getImage}
          />
        </div>
      </div>

      {/* Physics Area + Interactive Pipes */}
      <div className="flex-1 w-full relative bg-transparent overflow-hidden shadow-inner mt-[10px]">
        <div className="absolute inset-0">
          <GameCanvas
            ref={canvasRef}
            onBallLanded={handleBallLanded}
            onPegHit={playPeg}
            vibrationLevel={audioSettings.vibration}
            getImage={getImage}
            key={currentSkin} // Force re-mount on skin change
          />
        </div>

        {/* Overlay Interactive Pipes */}
        <BucketRow
          slotsResult={slotsResult}
          bingoCard={bingoCard}
          onSlotClick={handleSlotClick} // Input moved here
          phase={phase}
          fireBallActive={fireBallActive}
          magicActive={magicActive}
          playClick={playClick}
        />



        {/* Visual Feedback Overlay (Inside Physics Area) - REMOVED, using Modal now */}
      </div>

      {/* Compact Footer */}
      <div className="flex-shrink-0 z-30">
        <Footer
          phase={phase}
          coins={coins}
          balls={balls}
          onSpin={(val) => {
            playClick();
            startSpin(val);
          }}
          onPowerUp={(type) => {
            playClick();
            if (type === 'fireball') {
              setShowFireballConfirm(true);
            }
            else if (type === 'magic') setShowMagicModal(true);
            // else console.log('PowerUp', type);
          }}
          getImage={getImage}
        />
      </div>

      {/* DEBUG BUTTON */}
      <button
        onClick={() => forceWin()}
        className="fixed top-20 left-4 bg-red-600/80 text-white z-50 p-2 text-xs rounded-md shadow-lg"
        id="debug-win-btn"
      >
        FORCE WIN (Lvl 50)
      </button>

      <MagicNumberModal
        isOpen={showMagicModal}
        onClose={() => setShowMagicModal(false)}
        coins={coins}
        onMagicSpin={handleMagicSpin}
        showMessage={showMessage}
        bingoCard={bingoCard}
        playClick={playClick}
      />

      <FireballModal
        isOpen={showFireballConfirm}
        onClose={() => setShowFireballConfirm(false)}
        coins={coins}
        buyItem={buyItem}
        showMessage={showMessage}
        playClick={playClick}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessage}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />


      {/* Game Over / Next Level Logic */}
      {phase === 'GAME_OVER' && (
        winState ? (
          <NextLevelModal
            level={level}
            onNextLevel={nextLevel}
            playClick={playClick}
            playBingo={playBingo}
          />
        ) : (
          <GameOverModal
            coins={coins}
            onRestart={initLevel}
            buyItem={buyItem}
            showMessage={showMessage}
            playClick={playClick}
          />
        )
      )}

      {/* Shop Modal */}
      <ShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        buyItem={buyItem}
        playClick={playClick}
        coins={coins}
        currentSkin={currentSkin}
        setCurrentSkin={setCurrentSkin}
        ownedSkins={ownedSkins}
        unlockSkin={unlockSkin}
      />
      {/* Lucky Wheel Bonus Phase */}
      {phase === 'BONUS_WHEEL' && (
        <LuckySpin
          spinLuckySpin={spinLuckySpin}
          completeLuckySpin={completeLuckySpin}
          reward={luckySpinReward}
          playTicker={playPalheta}
        />
      )}
    </div>
  );
}
