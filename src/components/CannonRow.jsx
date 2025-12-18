import React from 'react';

const CANNON_COLORS = [
    'from-rose-400 to-rose-600 border-rose-700',      // B
    'from-sky-400 to-sky-600 border-sky-700',         // I
    'from-emerald-400 to-emerald-600 border-emerald-700', // N
    'from-amber-400 to-amber-600 border-amber-700',   // G
    'from-violet-400 to-violet-600 border-violet-700'  // O
];

export default function CannonRow({ phase, onSlotClick }) {
    return (
        <div className="w-full h-[50px] flex items-start justify-around px-2 relative z-20 pointer-events-none">
            {CANNON_COLORS.map((color, i) => (
                <div key={i} className="flex flex-col items-center group relative w-1/5 h-full justify-start pointer-events-auto">

                    {/* Cannon Tube */}
                    <button
                        onClick={() => phase === 'DROP' && onSlotClick(i)}
                        className={`
                    w-10 h-16 bg-gradient-to-r ${color} 
                    rounded-b-xl border-x-4 shadow-xl 
                    flex items-end justify-center relative overflow-visible transition-transform duration-200
                    ${phase === 'DROP' ? 'cursor-pointer hover:translate-y-1 active:scale-95' : 'grayscale opacity-80'}
                `}
                    >
                        {/* Muzzle Ring (Top) */}
                        <div className="absolute -top-1 w-12 h-2 bg-gray-800 rounded-full border border-gray-600 shadow-md z-10" />

                        {/* Fuse/Detail */}
                        {phase === 'DROP' && (
                            <div className="mb-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                        )}
                    </button>

                    {/* Arrow Hint below cannon */}
                    <div className={`mt-1 text-accent-pink transition-opacity ${phase === 'DROP' ? 'opacity-100' : 'opacity-0'}`}>
                        ▼
                    </div>
                </div>
            ))}
        </div>
    );
}
