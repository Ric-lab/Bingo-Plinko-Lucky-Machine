import React, { useState, useEffect, useLayoutEffect } from 'react';

const COLS = ['B', 'I', 'N', 'G', 'O'];

const PIPE_COLORS = [
    { base: 'bg-rose-500', rim: 'bg-rose-600', hue: 'rose' },
    { base: 'bg-sky-500', rim: 'bg-sky-600', hue: 'sky' },
    { base: 'bg-emerald-500', rim: 'bg-emerald-600', hue: 'emerald' },
    { base: 'bg-amber-500', rim: 'bg-amber-600', hue: 'amber' },
    { base: 'bg-violet-500', rim: 'bg-violet-600', hue: 'violet' }
];

// Rolling Slot Component
const RollingSlot = ({ target, delay, onFinish }) => {
    // Start with a random number so we don't show the answer immediately
    const [displayNum, setDisplayNum] = useState(() => Math.floor(Math.random() * 75) + 1);
    const [isFinal, setIsFinal] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        let animationFrameId;

        const update = () => {
            const now = Date.now();
            const elapsed = now - startTime;

            if (elapsed < delay) {
                // Determine if we should update the number (throttle to every ~60ms for visibility)
                if (now % 60 < 20) { // widened window to 20ms to catch frames
                    setDisplayNum(Math.floor(Math.random() * 75) + 1);
                }
                animationFrameId = requestAnimationFrame(update);
            } else {
                setDisplayNum(target);
                setIsFinal(true);
                // Delay the "finish" signal slightly to let the number settle visually before showing Gold
                setTimeout(() => {
                    if (onFinish) onFinish();
                }, 200);
            }
        };

        animationFrameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, delay]); // Removed onFinish from dependency to prevent restart loops

    return (
        <span className={`text-3xl font-black drop-shadow-md relative z-10 block w-full text-center ${isFinal ? "animate-bounce-short" : "blur-[1px] opacity-80"}`}>
            {displayNum}
        </span>
    );
};

export default function BucketRow({ slotsResult, bingoCard, onSlotClick, phase }) {
    // State to track which slots have finished spinning
    const [revealed, setRevealed] = useState({});

    // Reset revealed state when spin starts (useLayoutEffect to prevent flash)
    useLayoutEffect(() => {
        if (phase === 'SPINNING') {
            setRevealed({});
        }
    }, [phase]);

    // Check if a number is "useful" (exists in card and not marked)
    const checkIsUseful = (num) => {
        if (!bingoCard || !num) return false;
        const cell = bingoCard.find(c => c.num === num);
        return cell && !cell.marked;
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[90px] flex items-end justify-around px-2 z-20 pointer-events-auto">
            {slotsResult.map((num, i) => {
                const isUseful = checkIsUseful(num);
                const theme = PIPE_COLORS[i];
                // Only show GOLD if the slot is revealed (or phase is DROP/RESOLVE)
                const showGold = isUseful && (phase === 'DROP' || phase === 'RESOLVE' || (phase === 'SPINNING' && revealed[i]));

                return (
                    <div key={i} className="w-1/5 flex flex-col items-center justify-end h-full pointer-events-auto cursor-pointer group relative"
                        onClick={() => phase === 'DROP' && onSlotClick(i)}>

                        {/* Hint Arrow */}
                        <div className={`absolute -top-6 transition-all duration-300 animate-bounce ${phase === 'DROP' ? 'opacity-100' : 'opacity-0'} text-xs font-black text-white drop-shadow-md z-30`}>
                            TAP
                        </div>

                        {/* Pipe Rim (Top) - Solid & Opaque */}
                        <div className={`
                 w-[90%] h-5 rounded-sm border-2 border-black/20 shadow-lg z-20 flex items-center justify-center relative
                 ${showGold
                                ? 'bg-yellow-400 border-yellow-200 ring-2 ring-yellow-200 animate-pulse' // GOLD MODE
                                : `${theme.rim} border-white/20`}
             `}>
                            <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40" /> {/* Highlight */}
                        </div>

                        {/* Pipe Body (Bottom) - Solid & Opaque */}
                        <div className={`
                 w-[80%] h-14 border-x-2 border-b-2 border-black/10 shadow-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden
                 ${showGold
                                ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 border-yellow-600 text-yellow-900 scale-105 z-10' // GOLD MODE
                                : `${theme.base} border-${theme.hue}-700 text-white`
                            }
                 ${phase === 'DROP' ? 'group-hover:brightness-110 active:scale-95 cursor-pointer' : 'brightness-95 cursor-default'}
             `}>
                            {/* Texture/Highlight */}
                            <div className="absolute left-1 top-0 bottom-0 w-2 bg-white/20 blur-[1px]" />

                            {phase === 'SPINNING' ? (
                                <RollingSlot
                                    key={`rolling-${i}-${num}`}
                                    target={num}
                                    delay={300 + (i * 400)} // 300, 700, 1100, 1500, 1900
                                    onFinish={() => setRevealed(prev => ({ ...prev, [i]: true }))}
                                />
                            ) : (
                                <span className="text-3xl font-black drop-shadow-md relative z-10">
                                    {num > 0 ? num : COLS[i]}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
