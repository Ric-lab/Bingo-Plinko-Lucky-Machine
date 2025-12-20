import React from 'react';
import { Flame, Wand2, Calculator } from 'lucide-react';

export default function Footer({ phase, onSpin, onPowerUp, coins }) {
    const isSpinning = phase === 'SPIN';
    const canAffordFireball = coins >= 250;
    const canAffordMagic = coins >= 500;

    return (
        <div className="w-full h-[80px] bg-white border-t border-gray-200 flex items-center justify-between px-4 pb-2 pt-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0">

            {/* Fireball (Triangle-ish) */}
            <button
                onClick={() => onPowerUp('fireball')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all border-b-4 active:border-b-0 active:mt-1 disabled:opacity-50 
                ${canAffordFireball
                        ? 'bg-red-500 border-red-800 text-yellow-300'
                        : 'bg-gradient-to-br from-orange-400 to-red-600 border-red-700 text-white grayscale'}
                `}
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <Flame size={28} fill={canAffordFireball ? "#ffd900" : "currentColor"} />
                <span className="absolute -bottom-2 bg-black/70 text-white text-[10px] px-1 rounded-full font-bold">250</span>
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
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all border-b-4 active:border-b-0 active:mt-1 disabled:opacity-50 
                ${canAffordMagic
                        ? 'bg-indigo-600 border-indigo-800 text-yellow-300'
                        : 'bg-gradient-to-br from-indigo-400 to-purple-600 border-purple-800 text-white grayscale'}
                `}
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <Wand2 size={26} />
                <span className="absolute -bottom-2 bg-black/70 text-white text-[10px] px-1 rounded-full font-bold">500</span>
            </button>

        </div>
    );
}
