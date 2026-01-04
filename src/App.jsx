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

export default function App() {
  // Global Settings (Defined early to use in hooks)
  const [audioSettings, setAudioSettings] = useState({
    music: true,
    sfx: true,
    vibration: true
  });

  const {
    state: { coins, balls, level, bingoCard, slotsResult, winState, phase, fireBallActive, magicActive },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem, nextLevel }
  } = useGameLogic();

  const { getAsset } = useTheme();

  // Audio Hooks (BGM Volume 0.3, Pegs at 1.0)
  const { play: playBGM, stop: stopBGM } = useSound('/Audio/song.mp3', { volume: audioSettings.music ? 0.3 : 0, loop: true });
  const { play: playSpin, stop: stopSpin } = useSound('/Audio/slot.mp3', { volume: audioSettings.sfx ? 0.05 : 0, loop: true });
  const { play: playPeg } = useSound('/Audio/peg.mp3', { volume: audioSettings.sfx ? 1.0 : 0, multi: true });
  const { play: playClick } = useSound('/Audio/buttons.mp3', { volume: audioSettings.sfx ? 0.25 : 0 });
  // Fireball SFX
  const { play: playFireball, stop: stopFireball } = useSound('/Audio/fireball.mp3', { volume: audioSettings.sfx ? 0.3 : 0, loop: true });
  const { play: playExplosion } = useSound('/Audio/explosion.mp3', { volume: audioSettings.sfx ? 1.0 : 0 });
  const { play: playLucky } = useSound('/Audio/lucky.mp3', { volume: audioSettings.sfx ? 0.2 : 0 });
  const { play: playBingo } = useSound('/Audio/BINGO!.mp3', { volume: audioSettings.sfx ? 0.3 : 0 });

  // Manage Background Music based on Game Phase
  useEffect(() => {
    // There is no 'PLAYING' phase. The active phases are 'SPIN', 'SPINNING', 'DROP', 'RESOLVE'.
    const isGameActive = (phase !== 'GAME_OVER' && phase !== 'VICTORY');

    if (isGameActive) {
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
    }
  }, [phase, playBGM, stopBGM]);

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
        backgroundImage: `url(${getAsset('Background.jpg')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >

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
          <BingoCard card={bingoCard} level={level} />
        </div>
      </div>

      {/* Physics Area + Interactive Pipes */}
      <div className="flex-1 w-full relative bg-transparent overflow-hidden shadow-inner mt-[10px]">
        <div className="absolute inset-0">
          <GameCanvas
            ref={canvasRef}
            onBallLanded={handleBallLanded}
            onPegHit={playPeg}
            vibrationEnabled={audioSettings.vibration}
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
        />
      </div>

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
      />
    </div>
  );
}
