import React, { useState } from 'react';

const COLS = ['B', 'I', 'N', 'G', 'O'];

export default function UIOverlay({
    coins,
    balls,
    level,
    slotsResult,
    phase,
    onSlotClick,
    onBuyItem,
    onSpin
}) {
    const [shopOpen, setShopOpen] = useState(false);

    return (
        <>
            {/* TOP HUD */}
            <div className="absolute top-0 left-0 w-full z-10 flex flex-col">
                {/* Info Bar */}
                <div className="flex justify-between items-center p-3 bg-white/20 backdrop-blur-md shadow-sm">
                    <div className="flex gap-2">
                        <div className="bg-white px-3 py-1 rounded-full shadow text-text-dark font-bold flex items-center gap-1">
                            <span className="text-accent-gold text-xl">●</span> {coins}
                        </div>
                        {/* Shop Button */}
                        <button
                            onClick={() => setShopOpen(true)}
                            className="bg-white px-3 py-1 rounded-full shadow text-xl cursor-pointer hover:scale-105 transition-transform"
                        >
                            🛒
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="bg-white px-3 py-1 rounded-full shadow text-text-dark font-bold flex items-center gap-1">
                            <span className="text-accent-pink text-xl">●</span> {balls}
                        </div>
                        <div className="bg-white px-3 py-1 rounded-full shadow text-text-dark font-bold text-sm flex items-center">
                            Level {level}
                        </div>
                    </div>
                </div>

                {/* SLOTS (Pre-Draw) */}
                <div className="grid grid-cols-5 gap-1 p-2 bg-white/40 border-b-2 border-white backdrop-blur-sm relative">
                    {COLS.map((letter, i) => (
                        <div
                            key={letter}
                            className={`flex flex-col items-center transition-transform group ${phase === 'DROP' ? 'cursor-pointer active:scale-95' : 'opacity-70'}`}
                            onClick={() => phase === 'DROP' && onSlotClick(i)}
                        >
                            <span className="text-xs font-bold text-text-dark opacity-60 mb-1">{letter}</span>
                            <div className="w-full aspect-square bg-gradient-to-br from-white to-gray-100 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-text-dark relative overflow-hidden">
                                {/* Only show number if NOT spinning (or maybe show '?' or animate) */}
                                {phase === 'SPIN' ? '?' : slotsResult[i]}
                            </div>
                            {/* Arrow hint - Only in DROP phase */}
                            <div className={`text-accent-pink text-xs transition-opacity ${phase === 'DROP' ? 'opacity-100' : 'opacity-0'}`}>▼</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SPIN PHASE OVERLAY */}
            {phase === 'SPIN' && (
                <div className="absolute top-[160px] left-0 right-0 z-40 flex justify-center items-center pointer-events-auto animate-bounce-in">
                    <button
                        onClick={onSpin}
                        className="bg-gradient-to-r from-accent-pink to-accent-gold text-white text-3xl font-extrabold px-10 py-5 rounded-full shadow-2xl hover:scale-110 transition-transform border-4 border-white tracking-wider"
                    >
                        SPIN!
                    </button>
                </div>
            )}

            {/* SHOP OVERLAY (Modal) */}
            {shopOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                        <h2 className="text-2xl font-bold text-text-dark mb-4">Item Shop</h2>

                        <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center mb-3">
                            <div className="text-left">
                                <div className="font-bold">Fireball (WIP)</div>
                                <div className="text-xs text-gray-500">Goes straight down</div>
                            </div>
                            <button
                                onClick={() => onBuyItem('fireball', 100)}
                                className="bg-accent-blue text-white px-4 py-2 rounded-full font-bold shadow hover:bg-blue-500 transition-colors"
                            >
                                100 🟡
                            </button>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center mb-4">
                            <div className="text-left">
                                <div className="font-bold">+5 Balls</div>
                                <div className="text-xs text-gray-500">Extend game</div>
                            </div>
                            <button
                                onClick={() => onBuyItem('balls', 500)}
                                className="bg-accent-blue text-white px-4 py-2 rounded-full font-bold shadow hover:bg-blue-500 transition-colors"
                            >
                                500 🟡
                            </button>
                        </div>

                        <button
                            onClick={() => setShopOpen(false)}
                            className="w-full bg-gray-400 text-white py-3 rounded-full font-bold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
