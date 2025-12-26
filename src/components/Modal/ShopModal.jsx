import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Crown, Coins } from 'lucide-react';

export default function ShopModal({ isOpen, onClose, buyItem }) {
  const offers = [
    {
      id: 'starter',
      title: 'INICIANTE',
      coins: 1000,
      price: 'R$ 2,99',
      icon: <Coins className="w-8 h-8 text-amber-400" />,
      color: 'bg-blue-500',
      highlight: false,
    },
    {
      id: 'super',
      title: 'SUPER PACK',
      coins: 5000,
      price: 'R$ 4,99',
      icon: <Star className="w-8 h-8 text-yellow-300" />,
      color: 'bg-purple-500',
      highlight: false,
    },
    {
      id: 'noads',
      title: 'OFERTA GOLD',
      coins: 5000,
      price: 'R$ 9,99',
      sub: 'SEM ANÚNCIOS',
      icon: <Crown className="w-10 h-10 text-yellow-200" />,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      highlight: true,
      badge: 'MELHOR OFERTA'
    }
  ];

  const handleBuy = (offer) => {
    // Simulation
    console.log("Comprando:", offer.title);
    if (buyItem) buyItem('coins', -offer.coins); // Negative cost adds coins in cheat/debug mode, but here we just log
    // In real implementation, this triggers payment flow
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400"
          >
            {/* Header */}
            <div className="bg-yellow-400 p-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-white w-6 h-6 drop-shadow-md" />
                <h2 className="text-2xl font-black text-white drop-shadow-md tracking-wide">LOJA</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 bg-yellow-50">
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex items-center justify-between p-4 rounded-2xl shadow-lg
                    ${offer.highlight ? 'ring-4 ring-yellow-400 ring-offset-2 scale-105 my-2' : ''}
                    ${offer.color}
                  `}
                >
                  {/* Badge for Highlght */}
                  {offer.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                      {offer.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      {offer.icon}
                    </div>
                    <div className="flex flex-col text-white">
                      <span className="font-black text-xl drop-shadow-md">{offer.title}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-200 font-bold">+{offer.coins}</span>
                        <span className="text-xs opacity-90">moedas</span>
                      </div>
                      {offer.sub && (
                        <div className="inline-block bg-black/30 px-2 py-0.5 rounded text-[10px] font-bold mt-1 max-w-fit">
                          {offer.sub}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(offer)}
                    className="bg-white text-gray-800 font-bold py-2 px-4 rounded-xl shadow-md active:scale-95 transition-transform border-b-4 border-gray-300 active:border-b-0 active:translate-y-1"
                  >
                    {offer.price}
                  </button>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-yellow-100 p-2 text-center text-xs text-yellow-800 font-medium">
              Transações seguras via Google Play
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
