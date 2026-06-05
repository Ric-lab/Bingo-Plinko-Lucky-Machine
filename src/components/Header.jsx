import React from 'react';
import { Plus, Menu, Palette } from 'lucide-react';

export default function Header({ level, coins, onOpenShop, onOpenThemes, onOpenMenu, getImage, getImmutableImage }) {
    const currentLevel = level || 1;
    let balloonImage = 'balloongreen.png';
    if (currentLevel % 5 === 0) {
        balloonImage = 'balloonred.png';
    } else if (currentLevel % 2 === 0) {
        balloonImage = 'balloonyellow.png';
    }

    return (
        <div className="w-full h-[50px] backdrop-blur-md bg-white/10 flex items-center justify-between px-4 z-30 flex-shrink-0 relative">

            {/* Left: Coins + Buy */}
            <button onClick={onOpenShop} className="flex items-center gap-1 bg-gray-100 pl-2 pr-0.5 py-0.5 rounded-full border border-gray-200 shadow-sm hover:bg-gray-200 transition-colors relative z-10">
                <img src={getImmutableImage('Coin.png')} alt="Coins" className="w-[18px] h-[18px] object-contain" />
                <span className="font-black text-sm text-gray-700 tracking-wide">{coins}</span>
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                    <Plus size={13} className="text-blue-500" strokeWidth={3} />
                </div>
            </button>

            {/* Center: Card Level Balloon */}
            {level && getImage && (
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            backgroundImage: `url(${getImage(balloonImage)})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            width: '90px',
                            height: '24px'
                        }}
                    >
                        <span className="text-[12px] sm:text-xs font-bold text-white uppercase tracking-[0.2em] leading-none drop-shadow-sm pb-[1px]">
                            CARD {currentLevel}
                        </span>
                    </div>
                </div>
            )}


            {/* Right: Themes & Menu */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenThemes}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm"
                >
                    <Palette size={18} className="text-purple-500" />
                </button>

                <button
                    onClick={onOpenMenu}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm text-gray-700"
                >
                    <Menu size={18} />
                </button>
            </div>

        </div>
    );
}
