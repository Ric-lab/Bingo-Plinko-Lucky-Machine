import { useRef, useState } from 'react';
import Header from './components/Header';
import BingoCard from './components/BingoCard';
import GameCanvas from './components/GameCanvas';
import BucketRow from './components/BucketRow';
import Footer from './components/Footer';
import { useGameLogic } from './hooks/useGameLogic';

export default function App() {
  const {
    state: { coins, balls, level, bingoCard, slotsResult, isGameOver, winState, phase },
    actions: { initLevel, startSpin, dropBall, resolveTurn, buyItem }
  } = useGameLogic();

  const canvasRef = useRef();

  const handleSlotClick = (colIndex) => {
    // Attempt logic drop
    if (dropBall(colIndex)) {
      // Visual drop (ball)
      if (canvasRef.current) {
        canvasRef.current.dropBall(colIndex);
      }
    }
  };

  const handleBallLanded = (binIndex) => {
    const landedNumber = slotsResult[binIndex];
    resolveTurn(landedNumber);
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
        />
      </div>

      {/* Compact Footer */}
      <div className="flex-shrink-0 z-30">
        <Footer
          phase={phase}
          onSpin={startSpin}
          onPowerUp={(type) => console.log('PowerUp', type)}
        />
      </div>

      {/* Game Over Modal */}
      {(phase === 'GAME_OVER') && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col text-white animate-fade-in p-6 text-center">
          <h1 className="text-4xl font-extrabold mb-2 text-accent-gold drop-shadow-md">
            {winState ? 'BINGO!' : 'GAME OVER'}
          </h1>
          <p className="mb-6 text-xl text-gray-200">
            {winState ? 'Level Complete!' : 'Out of balls!'}
          </p>
          <button
            onClick={initLevel}
            className="bg-accent-pink px-10 py-4 rounded-full font-bold text-2xl shadow-xl hover:scale-105 transition-transform border-4 border-white/20"
          >
            {winState ? 'Next Level ▶' : 'Try Again ↺'}
          </button>
        </div>
      )}
    </div>
  );
}
