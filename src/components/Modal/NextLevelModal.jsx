import React from 'react';

export default function NextLevelModal({
    level,
    onNextLevel,
    playClick
}) {
    return (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center flex-col text-white animate-fade-in p-4 text-center overflow-hidden w-full h-full">

            {/* Festive Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
                <div className="absolute top-20 right-20 text-6xl animate-pulse">✨</div>
                <div className="absolute bottom-10 left-20 text-6xl animate-spin-slow">🎈</div>
                <div className="absolute bottom-30 right-10 text-6xl animate-bounce delay-100">🎊</div>
            </div>

            <h1 className="text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-scale-pulse">
                BINGO!!!
            </h1>

            <div className="mb-6 space-y-2">
                <p className="text-xl text-gray-200 font-bold">
                    🎉 LEVEL COMPLETE! 🎉
                </p>
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 text-white px-8 py-2 rounded-xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-bounce">
                    <p className="text-2xl font-black tracking-wider">REWARD: +{100 + level} 🟡</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-xs px-4">
                <button
                    onClick={() => { playClick?.(); onNextLevel(); }}
                    className="group relative bg-gradient-to-b px-6 py-3.5 rounded-full font-black text-2xl shadow-xl transition-all border-4 border-white/30 from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 shadow-[0_5px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[5px]"
                >
                    <span className="drop-shadow-md">
                        NEXT LEVEL ➡️
                    </span>

                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
            </div>
        </div>
    );
}
