import React from 'react';
import { Flame, Wand2, Calculator } from 'lucide-react';

export default function Footer({ phase, onSpin, onPowerUp }) {
    const isSpinning = phase === 'SPIN';

    return (
        <div className="w-full h-[80px] bg-white border-t border-gray-200 flex items-center justify-between px-4 pb-2 pt-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0">

            {/* Fireball (Triangle-ish) */}
            <button
                onClick={() => onPowerUp('fireball')}
                className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:scale-105 active:scale-95 transition-all text-white border-b-4 border-red-700 active:border-b-0 active:mt-1 disabled:opacity-50 grayscale disabled:grayscale"
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <Flame size={28} fill="currentColor" />
            </button>

            {/* SPIN BUTTON (Pill) */}
            <button
                onClick={onSpin}
                disabled={phase !== 'SPIN'}
                className={`
          flex-1 mx-4 h-16 rounded-full flex items-center justify-center text-2xl font-black tracking-widest shadow-xl transition-all border-b-8 active:border-b-0 active:mt-2
          ${phase === 'SPIN'
                        ? 'bg-gradient-to-r from-accent-pink to-accent-gold text-white border-pink-700 hover:brightness-110 animate-pulse'
                        : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'}
        `}
            >
                {phase === 'SPIN' ? 'SPIN !' : phase === 'DROP' ? 'DROP !' : 'WAIT'}
            </button>

            {/* Magic (Pentagon-ish approx) */}
            <button
                onClick={() => onPowerUp('magic')}
                className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-white border-b-4 border-purple-800 active:border-b-0 active:mt-1 disabled:opacity-50 grayscale disabled:grayscale"
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <Wand2 size={26} />
            </button>

        </div>
    );
}
