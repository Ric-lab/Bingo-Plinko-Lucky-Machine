import { useRef, useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';



import MagicNumberModal from './components/MagicNumberModal';
import MessageModal from './components/MessageModal';
import ConfirmationModal from './components/ConfirmationModal';

export default function App() {
  const {
    state: { coins, balls, level, bingoCard, slotsResult, winState, phase, fireBallActive, magicActive },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem, nextLevel }
  } = useGameLogic();

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

  const handleMagicConfirm = (number) => {
    // 1. Transaction
    if (buyItem('magic', 500)) {
      // 2. Force Spin
      startSpin(number); // Logic updated to accept this arg
      // 3. Close
      // 3. Close
      setShowMagicModal(false);
      // 4. Feedback (Removed specific success modal as requested)
      // showMessage('success', 'Magic Activated!', `Number ${number} guarantees a win!`);
    } else {
      // Error feedback
      showMessage('error', 'Oops!', 'Not enough coins to buy Magic!');
    }
  };

  const handleBallLanded = (binIndex) => {
    const landedNumber = slotsResult[binIndex];
    const result = resolveTurn(landedNumber, binIndex);

    // Trigger Feedback
    if (result) {
      if (result.hit) {
        // Show "LUCK!" only if NOT a Bingo (Game Over handles the celebration)
        if (!result.hasBingo) {
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
    <div className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden max-w-md mx-auto shadow-2xl border-x-2 border-gray-200 font-sans select-none">

      <Header
        coins={coins}
        balls={balls}
        level={level}
      // onOpenShop={() => {}} // Placeholder if needed
      />

      {/* Bingo Card (Wider: 95%) */}
      <div className="flex-shrink-0 w-full flex justify-center py-2 bg-gradient-to-b from-white to-gray-50 z-10 border-b border-gray-100">
        <div className="w-[95%]">
          <BingoCard card={bingoCard} />
        </div>
      </div>

      {/* Physics Area + Interactive Pipes */}
      <div className="flex-1 w-full relative bg-slate-100 overflow-hidden shadow-inner">
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
          onSpin={startSpin}
          onPowerUp={(type) => {
            if (type === 'fireball') {
              if (coins >= 250) {
                setShowFireballConfirm(true);
              } else {
                showMessage('error', 'Oops!', 'Not enough coins for Fireball!');
              }
            }
            else if (type === 'magic') setShowMagicModal(true);
            // else console.log('PowerUp', type);
          }}
        />
      </div>

      <MagicNumberModal
        isOpen={showMagicModal}
        onClose={() => setShowMagicModal(false)}
        onConfirm={handleMagicConfirm}
        bingoCard={bingoCard}
      />

      <ConfirmationModal
        isOpen={showFireballConfirm}
        onClose={() => setShowFireballConfirm(false)}
        onConfirm={() => {
          buyItem('fireball', 250);
          // showMessage('success', 'Fireball Ready!', 'Next drop will be flaming hot!');
        }}
        title="Fireball"
        message="Spend 250 coins to heat up the next drop?"
        confirmLabel={
          <>
            <span>CONFIRM</span>
            <span className="bg-black/20 px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1">
              -250 🟡
            </span>
          </>
        }
        colorTheme="fireball"
        Icon={Flame}
        showCancel={false}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessage}
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />

      {/* Game Over Modal */}
      {(phase === 'GAME_OVER') && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center flex-col text-white animate-fade-in p-4 text-center overflow-hidden w-full h-full">

          {/* Festive Background Elements */}
          {winState && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
              <div className="absolute top-20 right-20 text-6xl animate-pulse">✨</div>
              <div className="absolute bottom-10 left-20 text-6xl animate-spin-slow">🎈</div>
              <div className="absolute bottom-30 right-10 text-6xl animate-bounce delay-100">🎊</div>
            </div>
          )}

          <h1 className="text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-scale-pulse">
            {winState ? 'BINGO!!!' : 'GAME OVER'}
          </h1>

          <div className="mb-6 space-y-2">
            <p className="text-xl text-gray-200 font-bold">
              {winState ? '🎉 LEVEL COMPLETE! 🎉' : 'Out of balls!'}
            </p>
            {winState && (
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-8 py-2 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-bounce">
                <p className="text-2xl font-black tracking-wider">REWARD: +{100 + level} 🟡</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs px-4">
            {/* CONTINUE OPTION (Only on Defeat) */}
            {!winState && (
              <button
                onClick={() => {
                  if (coins >= 1000) {
                    buyItem('continue', 1000);
                  } else {
                    // Alert
                    showMessage('error', 'Oops!', 'Not enough coins to Continue!');
                  }
                }}
                disabled={coins < 1000}
                className={`group relative px-6 py-3 rounded-full font-black text-xl shadow-xl transition-all border-4 border-white/30 ${coins >= 1000 ? 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 cursor-pointer shadow-[0_5px_0_rgb(29,78,216)] active:translate-y-[5px] active:shadow-none' : 'bg-gray-500 opacity-50 cursor-not-allowed'}`}
              >
                <span className="drop-shadow-md flex flex-col items-center leading-none">
                  <span>CONTINUE (+10 BALLS)</span>
                  <span className="text-sm text-yellow-300">1000 🟡</span>
                </span>
                {coins >= 1000 && (
                  <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (winState) {
                  nextLevel();
                } else {
                  initLevel(); // Just restart same level
                }
              }}
              className={`group relative bg-gradient-to-b px-6 py-3.5 rounded-full font-black text-2xl shadow-xl transition-all border-4 border-white/30 ${winState ? 'from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 shadow-[0_5px_0_rgb(21,128,61)]' : 'from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-[0_5px_0_rgb(185,28,28)]'} active:shadow-none active:translate-y-[5px]`}
            >
              <span className="drop-shadow-md">
                {winState ? 'NEXT LEVEL ➡️' : 'GIVE UP & RESTART ↺'}
              </span>

              {/* Button Shine Effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
