import React from 'react';
import { ShoppingCart, Gamepad2 } from 'lucide-react';

export default function Header({ coins, level, onOpenShop }) {
    return (
        <div className="w-full h-[60px] bg-white text-text-dark flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 border-b border-gray-100 relative">

            {/* Left: Coins */}
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <img src="/Images/Immutable/Coin.png" alt="Coins" className="w-6 h-6 object-contain" />
                <span className="font-extrabold text-sm text-gray-700">{coins}</span>
            </div>

            {/* Center: Level (Absolute) */}
            <div className="absolute left-1/2 -translate-x-1/2 bg-gray-100 px-4 py-1.5 rounded-full font-bold text-sm text-gray-700 border border-gray-200 shadow-sm">
                Level {level}
            </div>

            {/* Right: Shop */}
            <button
                onClick={onOpenShop}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm"
            >
                <ShoppingCart size={20} className="text-accent-blue" />
            </button>

        </div>
    );
}
