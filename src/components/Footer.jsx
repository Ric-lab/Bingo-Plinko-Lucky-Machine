import React from 'react';
import { Flame, Wand2, Calculator } from 'lucide-react';

export default function Footer({ phase, onSpin, onPowerUp, coins, balls }) {
    const isSpinning = phase === 'SPIN';
    const canAffordFireball = coins >= 250;
    const canAffordMagic = coins >= 500;

    return (
        <div
            className="w-full h-[80px] border-t border-gray-200 flex items-center justify-between px-4 pb-2 pt-2 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0"
            style={{
                backgroundImage: "url('/Images/Standard/footerbg.png')",
                backgroundSize: '100% 100%',
                backgroundPosition: 'center'
            }}
        >

            {/* Fireball (Triangle-ish) */}
            {/* Fireball (Asset) */}
            <button
                onClick={() => onPowerUp('fireball')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all border-b-4 active:border-b-0 active:mt-1 disabled:opacity-50 overflow-hidden
                ${canAffordFireball
                        ? 'bg-red-500 border-red-800'
                        : 'bg-gray-700 border-gray-800 grayscale'}
                `}
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <img
                    src="/Images/Standard/fireball.png"
                    alt="Fireball"
                    className="w-full h-full object-cover"
                />
            </button>

            {/* SPIN BUTTON (Pill) */}
            <button
                onClick={onSpin}
                disabled={phase !== 'SPIN'}
                className={`
          flex-1 mx-4 h-16 rounded-full flex items-center justify-center text-2xl font-black tracking-widest shadow-xl transition-all active:scale-95 active:mt-1 overflow-hidden relative
          ${phase === 'SPIN'
                        ? 'text-white hover:brightness-110'
                        : 'text-gray-500 cursor-not-allowed grayscale'}
        `}
            >
                <img
                    src="/Images/Standard/spin.png"
                    alt="Spin"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    {phase === 'SPIN' ? balls : phase === 'DROP' ? 'DROP !' : 'WAIT'}
                </span>
            </button>

            {/* Magic (Asset) */}
            <button
                onClick={() => onPowerUp('magic')}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all border-b-4 active:border-b-0 active:mt-1 disabled:opacity-50 overflow-hidden
                ${canAffordMagic
                        ? 'bg-indigo-600 border-indigo-800'
                        : 'bg-gray-700 border-gray-800 grayscale'}
                `}
                disabled={phase === 'RESOLVE' || phase === 'GAME_OVER'}
            >
                <img
                    src="/Images/Standard/magicnumber.png"
                    alt="Magic Number"
                    className="w-full h-full object-cover"
                />
            </button>

        </div>
    );
}
