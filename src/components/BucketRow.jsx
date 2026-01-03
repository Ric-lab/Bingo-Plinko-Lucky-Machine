import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// --- REUSABLE FLAME UNIT ---
const FlameUnit = ({ delay, scale, xOffset, id }) => {
    // Unique ID for gradients based on xOffset/scale to allow slight variations if needed, or just standard gradients
    const gradId = `fire-grad-${id}`;

    return (
        <div className="absolute bottom-0" style={{ left: `${50 + xOffset}%`, transform: `translateX(-50%) scale(${scale})` }}>
            <div className="relative w-10 h-16 flex items-end justify-center"> {/* Smaller Base Size */}
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <linearGradient id={`${gradId}-red`} x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#7f1d1d" /> {/* Dark Red Base */}
                            <stop offset="40%" stopColor="#dc2626" /> {/* Red Body */}
                            <stop offset="100%" stopColor="#ef4444" /> {/* Light Red Tip */}
                        </linearGradient>
                        <linearGradient id={`${gradId}-orange`} x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#c2410c" /> {/* Dark Orange */}
                            <stop offset="100%" stopColor="#fb923c" /> {/* Light Orange */}
                        </linearGradient>
                        <linearGradient id={`${gradId}-yellow`} x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" /> {/* Amber */}
                            <stop offset="100%" stopColor="#fef3c7" /> {/* Pale Yellow */}
                        </linearGradient>
                    </defs>
                </svg>

                {/* Individual Glow Blur */}
                <motion.div
                    animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: delay }}
                    className="absolute bottom-2 left-0 right-0 -translate-x-1/2 w-10 h-12 bg-orange-500/50 rounded-full blur-[15px] z-[-1]"
                />

                {/* 1. Outer Flame (Red Gradient) */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute bottom-0 w-10 h-16 drop-shadow-sm"
                    animate={{ scaleY: [1, 1.1, 0.9, 1], scaleX: [1, 0.9, 1.1, 1], skewX: [0, 2, -2, 0] }}
                    transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, ease: "easeInOut", delay: delay }}
                >
                    <path d="M50 0 C65 40 85 50 85 80 C85 100 70 100 50 100 C30 100 15 100 15 80 C15 50 35 40 50 0 Z" fill={`url(#${gradId}-red)`} />
                </motion.svg>

                {/* 2. Middle Flame (Orange Gradient) */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute bottom-0 w-8 h-12"
                    animate={{ scaleY: [1, 1.15, 0.9], rotate: [-3, 3, -3] }}
                    transition={{ duration: 0.6 + Math.random() * 0.3, repeat: Infinity, ease: "easeInOut", delay: delay + 0.1 }}
                    style={{ originX: 0.5, originY: 1 }}
                >
                    <path d="M50 10 C60 45 75 55 75 80 C75 95 65 95 50 95 C35 95 25 95 25 80 C25 55 40 45 50 10 Z" fill={`url(#${gradId}-orange)`} />
                </motion.svg>

                {/* 3. Core Flame (Yellow Gradient) */}
                <motion.svg
                    viewBox="0 0 100 100"
                    className="absolute bottom-0 w-4 h-8"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.4 + Math.random() * 0.2, repeat: Infinity, ease: "easeInOut", delay: delay }}
                    style={{ originX: 0.5, originY: 1 }}
                >
                    <path d="M50 20 C58 50 65 60 65 80 C65 90 60 95 50 95 C40 95 35 90 35 80 C35 60 42 50 50 20 Z" fill={`url(#${gradId}-yellow)`} />
                </motion.svg>

                {/* Sparkling Embers */}
                <motion.div
                    animate={{ y: [0, -40], opacity: [1, 0], x: [0, Math.random() * 10 - 5] }}
                    transition={{ duration: 0.8 + Math.random() * 0.5, repeat: Infinity, ease: "easeOut", delay: delay }}
                    className="absolute bottom-4 left-1/2 w-0.5 h-0.5 bg-yellow-200 rounded-full shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                />
                <motion.div
                    animate={{ y: [0, -30], opacity: [1, 0], x: [0, Math.random() * 10 - 5] }}
                    transition={{ duration: 1 + Math.random() * 0.5, repeat: Infinity, ease: "easeOut", delay: delay + 0.3 }}
                    className="absolute bottom-2 left-1/2 w-0.5 h-0.5 bg-orange-200 rounded-full shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                />
            </div>
        </div>
    );
};

// --- DISTRIBUTED FIRE CONTAINER ---
const DistributedFire = () => {
    return (
        <div className="absolute bottom-[-20px] left-0 right-0 z-0 pointer-events-none h-32 overflow-visible flex justify-center items-end">
            {/* Container logic: 
                - left-0 right-0 ensures full width 
                - flex justify-center ensures 0% xOffset is visually center
                - items-end aligns flames to bottom
             */}
            <div className="relative w-full h-full">
                <FlameUnit id={1} xOffset={-30} scale={0.8} delay={0.2} />
                <FlameUnit id={2} xOffset={-15} scale={0.9} delay={0} />
                <FlameUnit id={3} xOffset={0} scale={1.1} delay={0.4} />
                <FlameUnit id={4} xOffset={15} scale={0.9} delay={0.1} />
                <FlameUnit id={5} xOffset={30} scale={0.8} delay={0.3} />
            </div>
        </div>
    );
};

export default function BucketRow({ slotsResult, bingoCard, onSlotClick, phase, fireBallActive, magicActive, playClick }) {
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
        // Back to Standard Full Width
        <div className="absolute bottom-0 left-0 right-0 h-[70px] flex items-end justify-between w-full px-0 z-20 pointer-events-auto">
            {slotsResult.map((num, i) => {
                const isUseful = checkIsUseful(num);
                const theme = PIPE_COLORS[i];
                // Only show GOLD if the slot is revealed (or phase is DROP/RESOLVE)
                // OR if FIREBALL is active (all/target glow)
                const isFireTarget = fireBallActive;

                // VISUAL RULE: Gold if Useful AND Revealed, OR if Magic Active (All Pipes)
                const showGold = (isUseful && (phase === 'DROP' || phase === 'RESOLVE' || (phase === 'SPINNING' && revealed[i]))) || magicActive;
                // IMPORTANT: We do NOT override the color for Fire anymore. We just add an effect.

                // Determine Base Style based solely on Gold state or Normal state
                let rimClasses = '';
                let bodyClasses = '';

                if (showGold) {
                    // Golden Text only (box is invisible)
                    rimClasses = 'opacity-0';
                    bodyClasses = 'bg-transparent text-yellow-300 font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] scale-110 z-10';
                } else {
                    // Normal Text only (box is invisible)
                    rimClasses = 'opacity-0';
                    bodyClasses = 'bg-transparent text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]';
                }

                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full pointer-events-auto cursor-pointer group relative"
                        onClick={() => {
                            if (phase === 'DROP') {
                                playClick?.();
                                onSlotClick(i);
                            }
                        }}>


                        {/* FIREBALL OVERLAY EFFECT (Realistic Particles) */}
                        {/* FIREBALL OVERLAY EFFECT (Distributed Vector Style) */}
                        {isFireTarget && <DistributedFire />}

                        {/* Pipe Rim (Top) - Solid & Opaque */}
                        <div className={`
                 w-[90%] h-5 rounded-sm border-2 border-black/20 shadow-lg z-20 flex items-center justify-center relative transition-all duration-200
                 ${rimClasses}
                 ${isFireTarget ? 'shadow-[0_0_15px_rgba(255,69,0,0.6)]' : ''} 
             `}>
                            <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40" /> {/* Highlight */}
                        </div>

                        {/* Pipe Body (Bottom) - Solid & Opaque */}
                        <div className={`
                 w-[80%] h-14 flex items-center justify-center pb-3 transition-all duration-200 relative overflow-visible
                 ${bodyClasses}
                 ${(phase === 'DROP' || isFireTarget) ? 'group-hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'}
             `}>
                            {/* Texture/Highlight REMOVED */}

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
