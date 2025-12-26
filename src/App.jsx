import { useRef, useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';
import { useTheme } from './hooks/useTheme';



import MagicNumberModal from './components/Modal/MagicNumberModal';
import MessageModal from './components/Modal/MessageModal';
// import ConfirmationModal from './components/Modal/ConfirmationModal'; // Removed as it was only used for Fireball
import GameOverModal from './components/Modal/GameOverModal';
import NextLevelModal from './components/Modal/NextLevelModal';
import FireballModal from './components/Modal/FireballModal';

export default function App() {
  const {
    state: { coins, balls, level, bingoCard, slotsResult, winState, phase, fireBallActive, magicActive },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem, nextLevel }
  } = useGameLogic();

  const { getAsset } = useTheme();

  // New Message Modal State
  const [messageModal, setMessageModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const [showMagicModal, setShowMagicModal] = useState(false);
  const [showFireballConfirm, setShowFireballConfirm] = useState(false);

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

  const handleBallLanded = (binIndex) => {
    const landedNumber = slotsResult[binIndex];
    const result = resolveTurn(landedNumber, binIndex);

    // Trigger Feedback
    if (result) {
      if (result.hit) {
        // Show "LUCK!" only if game continues (Not Bingo AND Not Defeat)
        if (!result.hasBingo && !result.isDefeat) {
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
      // onOpenShop={() => {}} // Placeholder if needed
      />

      {/* Bingo Card (Wider: 95%) */}
      <div className="flex-shrink-0 w-full flex justify-center py-2  backdrop-blur-sm z-10 border-b border-white/20">
        <div className="w-[95%]">
          <BingoCard card={bingoCard} />
        </div>
      </div>

      {/* Physics Area + Interactive Pipes */}
      <div className="flex-1 w-full relative bg-transparent overflow-hidden shadow-inner">
        <div className="absolute inset-0">
          <GameCanvas
            ref={canvasRef}
            onBallLanded={handleBallLanded}
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
        />



        {/* Visual Feedback Overlay (Inside Physics Area) - REMOVED, using Modal now */}
      </div>

      {/* Compact Footer */}
      <div className="flex-shrink-0 z-30">
        <Footer
          phase={phase}
          coins={coins}
          balls={balls}
          onSpin={startSpin}
          onPowerUp={(type) => {
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
      />

      <FireballModal
        isOpen={showFireballConfirm}
        onClose={() => setShowFireballConfirm(false)}
        coins={coins}
        buyItem={buyItem}
        showMessage={showMessage}
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
          />
        ) : (
          <GameOverModal
            coins={coins}
            onRestart={initLevel}
            buyItem={buyItem}
            showMessage={showMessage}
          />
        )
      )}
    </div>
  );
}
