import { useRef, useState, useEffect } from 'react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';

import FeedbackOverlay from './components/FeedbackOverlay';
import MagicNumberModal from './components/MagicNumberModal';

export default function App() {
  const {
    state: { coins, balls, level, bingoCard, slotsResult, isGameOver, winState, phase, fireBallActive, magicActive },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem }
  } = useGameLogic();

  // Feedback State: { visible, type: 'success'|'failure', message, id }
  const [feedback, setFeedback] = useState({ visible: false, type: '', message: '' });
  const [showMagicModal, setShowMagicModal] = useState(false);
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
    if (buyItem('magic', 300)) {
      // 2. Force Spin
      startSpin(number); // Logic updated to accept this arg
      // 3. Close
      setShowMagicModal(false);
      // 4. Feedback
      setFeedback({
        visible: true,
        type: 'success',
        message: 'MAGIC ACTIVATED!',
        id: Date.now()
      });
      setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 1500);
    } else {
      // Error feedback?
      console.error("Not enough coins");
    }
  };

  const handleBallLanded = (binIndex) => {
    const landedNumber = slotsResult[binIndex];
    const result = resolveTurn(landedNumber, binIndex);

    // Trigger Feedback
    if (result) {
      if (result.hit) {
        setFeedback({
          visible: true,
          type: 'success',
          message: 'MATCH!',
          sub: `+${result.earned}🟡`,
          id: Date.now()
        });
      } else {
        setFeedback({
          visible: true,
          type: 'failure',
          message: 'TRY AGAIN',
          id: Date.now()
        });
      }

      // Auto-hide after delay
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, visible: false }));
      }, 1500);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col relative overflow-hidden max-w-md mx-auto shadow-2xl border-x-2 border-gray-200 font-sans select-none">

      <Header
        coins={coins}
        balls={balls}
        level={level}
        onOpenShop={() => console.log('Shop')}
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

        {/* Visual Feedback Overlay (Inside Physics Area) */}
        <FeedbackOverlay feedback={feedback} />
      </div>

      {/* Compact Footer */}
      <div className="flex-shrink-0 z-30">
        <Footer
          phase={phase}
          coins={coins}
          onSpin={startSpin}
          onPowerUp={(type) => {
            if (type === 'fireball') buyItem('fireball', 100);
            else if (type === 'magic') setShowMagicModal(true);
            else console.log('PowerUp', type);
          }}
        />
      </div>

      <MagicNumberModal
        isOpen={showMagicModal}
        onClose={() => setShowMagicModal(false)}
        onConfirm={handleMagicConfirm}
        bingoCard={bingoCard}
      />

      {/* Game Over Modal */}
      {(phase === 'GAME_OVER') && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center flex-col text-white animate-fade-in p-6 text-center overflow-hidden">

          {/* Festive Background Elements */}
          {winState && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
              <div className="absolute top-20 right-20 text-6xl animate-pulse">✨</div>
              <div className="absolute bottom-10 left-20 text-6xl animate-spin-slow">🎈</div>
              <div className="absolute bottom-30 right-10 text-6xl animate-bounce delay-100">🎊</div>
            </div>
          )}

          <h1 className="text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-scale-pulse">
            {winState ? 'BINGO!!!' : 'GAME OVER'}
          </h1>

          <div className="mb-8 space-y-2">
            <p className="text-2xl text-gray-200 font-bold">
              {winState ? '🎉 LEVEL COMPLETE! 🎉' : 'Out of balls!'}
            </p>
            {winState && (
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-6 py-3 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-bounce">
                <p className="text-3xl font-black tracking-wider">REWARD: +100 🟡</p>
              </div>
            )}
          </div>

          <button
            onClick={initLevel}
            className="group relative bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 px-12 py-5 rounded-full font-black text-3xl shadow-[0_10px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[10px] transition-all border-4 border-white/30"
          >
            <span className="drop-shadow-md">
              {winState ? 'PLAY AGAIN 🔄' : 'TRY AGAIN ↺'}
            </span>

            {/* Button Shine Effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      )}
    </div>
  );
}
