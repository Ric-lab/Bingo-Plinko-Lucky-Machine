import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function FeedbackOverlay({ feedback }) {
    if (!feedback.visible) return null;

    const isSuccess = feedback.type === 'success';

    // Trigger Confetti
    useEffect(() => {
        if (isSuccess && feedback.visible) {
            // Center Burst
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 100
            });
            // Side Bursts for extra effect
            setTimeout(() => {
                confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, zIndex: 100 });
                confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, zIndex: 100 });
            }, 200);
        }
    }, [isSuccess, feedback.visible]);

    if (!isSuccess) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                {/* Shake Animation for Try Again */}
                <div className="animate-shake bg-black/80 backdrop-blur-md px-10 py-5 rounded-full border border-white/20 shadow-2xl">
                    <h1 className="text-3xl font-bold text-gray-200 uppercase tracking-widest">
                        {feedback.message}
                    </h1>
                </div>
            </div>
        );
    }

    // SVG "MATCH" OVERLAY
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center flex-col pointer-events-none overflow-hidden">

            {/* Background Light Beam */}
            <div className={`absolute w-full h-full animate-pulse opacity-50 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none`} />

            <div className="relative animate-pop-in flex flex-col items-center">

                {/* SVG Text for Perfect Gradient & Stroke Control */}
                <svg width="400" height="200" viewBox="0 0 400 150" className="drop-shadow-2xl filter overflow-visible">
                    <defs>
                        {/* Rich Gold Gradient */}
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFF7CC" />   {/* Lightest Gold */}
                            <stop offset="30%" stopColor="#FFD700" />  {/* Golden Yellow */}
                            <stop offset="60%" stopColor="#B8860B" />  {/* Dark Gold */}
                            <stop offset="100%" stopColor="#8B4513" /> {/* Bronze Shadow */}
                        </linearGradient>

                        {/* Drop Shadow Filter */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* The Text */}
                    <text
                        x="50%"
                        y="80%"
                        textAnchor="middle"
                        fontFamily="Arial, sans-serif"
                        fontWeight="900"
                        fontSize="70"
                        fontStyle="italic"
                        fill="url(#goldGradient)"
                        stroke="white"
                        strokeWidth="4"
                        filter="url(#glow)"
                        className="select-none"
                    >
                        {feedback.message}
                    </text>
                </svg>

                {/* Coins Bubble */}
                {feedback.sub && (
                    <div className="mt-[-20px] animate-float-up bg-white text-yellow-700 px-8 py-2 rounded-full font-black text-3xl shadow-xl border-4 border-yellow-400 z-10">
                        {feedback.sub}
                    </div>
                )}
            </div>
        </div>
    );
}
