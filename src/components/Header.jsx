import React from 'react';
import { ShoppingCart, Menu, CircleDollarSign, Gamepad2 } from 'lucide-react';

export default function Header({ coins, balls, level, onOpenShop }) {
    return (
        <div className="w-full h-[60px] bg-white text-text-dark flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 border-b border-gray-100">

            {/* Left: Coins */}
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <CircleDollarSign size={20} className="text-accent-gold fill-current" />
                <span className="font-extrabold text-sm text-gray-700">{coins}</span>
            </div>

            {/* Center-Left: Shop */}
            <button
                onClick={onOpenShop}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm"
            >
                <ShoppingCart size={20} className="text-accent-blue" />
            </button>

            {/* Center-Right: Balls */}
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="w-5 h-5 bg-accent-pink rounded-full border-2 border-white shadow-sm" />
                <span className="font-extrabold text-sm text-gray-700">{balls} Left</span>
            </div>

            {/* Right: Level & Menu */}
            <div className="flex items-center gap-2">
                <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-gray-200">
                    L{level}
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <Menu size={24} />
                </button>
            </div>

        </div>
    );
}
