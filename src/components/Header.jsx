import React from 'react';
import { ShoppingCart, Gamepad2 } from 'lucide-react';

export default function Header({ coins, level, onOpenShop }) {
    return (
        <div className="w-full h-[50px] backdrop-blur-md bg-white/10 flex items-center justify-between px-4 z-30 flex-shrink-0 relative">

            {/* Left: Coins */}
            <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                <img src="/Images/Immutable/Coin.png" alt="Coins" className="w-[18px] h-[18px] object-contain" />
                <span className="font-black text-sm text-gray-700 tracking-wide">{coins}</span>
            </div>


            {/* Right: Shop */}
            <button
                onClick={onOpenShop}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm"
            >
                <ShoppingCart size={18} className="text-accent-blue" />
            </button>

        </div>
    );
}
