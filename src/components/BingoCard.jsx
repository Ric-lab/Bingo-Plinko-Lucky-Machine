import React from 'react';

const COLS = ['B', 'I', 'N', 'G', 'O'];
const THEMES = [
    { name: 'B', bg: 'bg-rose-50', text: 'text-rose-600', header: 'bg-rose-500', border: 'border-rose-200' },
    { name: 'I', bg: 'bg-sky-50', text: 'text-sky-600', header: 'bg-sky-500', border: 'border-sky-200' },
    { name: 'N', bg: 'bg-emerald-50', text: 'text-emerald-600', header: 'bg-emerald-500', border: 'border-emerald-200' },
    { name: 'G', bg: 'bg-amber-50', text: 'text-amber-600', header: 'bg-amber-500', border: 'border-amber-200' },
    { name: 'O', bg: 'bg-violet-50', text: 'text-violet-600', header: 'bg-violet-500', border: 'border-violet-200' },
];

export default function BingoCard({ card, level }) {
    if (!card || card.length === 0) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="w-full bg-white/50 backdrop-blur-md p-1 rounded-xl border-2 border-white/50 shadow-sm overflow-hidden">
            <div className="w-full">
                {/* Level Detail */}
                <div className="flex justify-center mb-1">
                    <div className="px-20 py-0 bg-white/50 rounded-full border border-white/40 shadow-sm backdrop-blur-sm">
                        <span className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em] leading-none drop-shadow-sm">
                            CARTELA {level || 1}
                        </span>
                    </div>
                </div>

                {/* HEADERS */}
                <div className="grid grid-cols-5 gap-1 mb-1 mt-1">
                    {THEMES.map((t, i) => (
                        <div key={i} className={`${t.header} text-white font-black text-center text-xs py-1 rounded-sm shadow-sm`}>
                            {t.name}
                        </div>
                    ))}
                </div>

                {/* CELLS */}
                <div className="grid grid-cols-5 gap-1">
                    {card.map((cell) => {
                        const theme = THEMES[cell.col];
                        return (
                            <div
                                key={cell.id}
                                className={`
                      h-8 flex items-center justify-center rounded-md font-bold text-xl tracking-widest shadow-sm border transition-all duration-300 relative overflow-hidden
                      ${cell.marked
                                        ? 'bg-amber-200 border-amber-500 text-amber-900 ring-2 ring-amber-300 scale-105 z-10 shadow-lg'
                                        : `${theme.bg} ${theme.text} ${theme.border} bg-white hover:brightness-95`}
                    `}
                            >
                                {/* Content - Fade out number slightly when marked to let checkmark shine */}
                                <span className={`transition-opacity duration-300 ${cell.marked ? 'opacity-30 blur-[0.5px]' : ''}`}>
                                    {cell.num === 'FREE' ? '★' : cell.num}
                                </span>

                                {/* Checkmark Overlay */}
                                {cell.marked && (
                                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300 z-20">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-600 drop-shadow-md filter stroke-2 stroke-white">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
