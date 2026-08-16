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
        <div className="w-full h-[50px] backdrop-blur-md bg-[#090222]/80 flex items-center justify-between px-4 z-30 flex-shrink-0 relative border-b border-yellow-300/25 shadow-[0_4px_18px_rgba(0,0,0,0.35)]">

            {/* Left: Coins + Buy */}
            <button onClick={onOpenShop} className="flex items-center gap-1 bg-gradient-to-b from-[#fff3bd] to-[#d79b18] pl-2 pr-0.5 py-0.5 rounded-full border border-yellow-100/80 shadow-[0_2px_7px_rgba(245,158,11,0.35)] hover:brightness-110 transition-colors relative z-10">
                <img src={getImmutableImage('Coin.png')} alt="Coins" className="w-[18px] h-[18px] object-contain" />
                <span className="font-black text-sm text-[#412300] tracking-wide">{coins}</span>
                <div className="w-5 h-5 rounded-full bg-[#652500] border border-yellow-100/70 flex items-center justify-center">
                    <Plus size={13} className="text-yellow-100" strokeWidth={3} />
                </div>
            </button>

            {/* Center: Card Level Balloon */}
            {level && getImage && (
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <div
                        className="flex items-center justify-center"
                        style={{
                            backgroundImage: `url(${getImmutableImage(balloonImage)})`,
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
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-colors shadow-sm"
                >
                    <Palette size={18} className="text-yellow-200" />
                </button>

                <button
                    onClick={onOpenMenu}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-colors shadow-sm text-white"
                >
                    <Menu size={18} />
                </button>
            </div>

        </div>
    );
}
