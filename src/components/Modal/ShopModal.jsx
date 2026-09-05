import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Palette, CheckCircle2, Lock } from 'lucide-react';
import { Coins } from 'lucide-react';

export default function ShopModal({
  isOpen,
  onClose,
  buyItem,
  playClick,
  coins,
  currentSkin,
  setCurrentSkin,
  ownedSkins,
  unlockSkin,
}) {

  // Skin Offers (Virtual Currency)
  const skinOffers = [
    {
      id: 'Standard',
      title: 'ROYAL BINGO',
      price: 0,
      gradient: 'from-amber-100 to-orange-100',
      textColor: 'text-amber-900'
    },
    {
      id: 'Ocean',
      title: 'OCEAN',
      price: 5000,
      gradient: 'from-cyan-400 to-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'Forest',
      title: 'FOREST',
      price: 5000,
      gradient: 'from-emerald-400 to-green-700',
      textColor: 'text-white'
    },
    {
      id: 'Tea',
      title: 'TEA',
      price: 7500,
      gradient: 'from-rose-200 to-pink-300',
      textColor: 'text-rose-900'
    },
    {
      id: 'Pets',
      title: 'PETS',
      price: 7500,
      gradient: 'from-orange-200 to-yellow-200',
      textColor: 'text-orange-800'
    },
    {
      id: 'OldGame',
      title: 'OLD GAME',
      price: 10000,
      gradient: 'from-gray-600 to-gray-800',
      textColor: 'text-gray-200'
    }
  ];

  const handleSkinAction = (skin) => {
    playClick?.();
    const isOwned = ownedSkins.includes(skin.id);

    if (isOwned) {
      setCurrentSkin(skin.id);
    } else if (coins >= skin.price) {
      if (buyItem('coins', skin.price)) {
        unlockSkin(skin.id);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { playClick?.(); onClose(); }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-none"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-[90%] max-w-[380px] h-[75vh] bg-gray-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
          >
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="bg-purple-400 p-2 rounded-xl">
                  <Palette className="text-white w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-wide">TEMAS</h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Coin Display */}
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-gray-700">{coins}</span>
                </div>

                <button
                  onClick={() => { playClick?.(); onClose(); }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {skinOffers.map((skin) => {
                  const isOwned = ownedSkins.includes(skin.id);
                  const isEquipped = currentSkin === skin.id;
                  const canAfford = coins >= skin.price;

                  return (
                    <div
                      key={skin.id}
                      className={`
                          relative flex flex-col items-center p-2 rounded-3xl border-2 transition-all overflow-hidden shadow-sm
                          ${isEquipped ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-100 bg-white hover:border-gray-200'}
                      `}
                    >
                      {/* Preview Gradient */}
                      <div className={`w-full h-24 rounded-2xl bg-gradient-to-br ${skin.gradient} mb-3 shadow-inner flex items-center justify-center relative`}>
                        {isEquipped && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                            <div className="bg-white/20 p-2 rounded-full border border-white/40">
                              <CheckCircle2 className="text-white w-8 h-8 drop-shadow-md" />
                            </div>
                          </div>
                        )}
                        {!isOwned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="text-black/20 w-5 h-5" />
                          </div>
                        )}
                        <span className={`font-black text-xl tracking-tighter uppercase drop-shadow-sm px-2 text-center leading-none ${skin.textColor}`}>{skin.title}</span>
                      </div>

                      <div className="w-full mt-auto">
                        {isOwned ? (
                          <button
                            onClick={() => handleSkinAction(skin)}
                            disabled={isEquipped}
                            className={`
                              w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all
                              ${isEquipped
                                ? 'bg-transparent text-green-600 cursor-default'
                                : 'bg-gray-800 text-white shadow-lg active:scale-95 border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 hover:bg-gray-700'}
                            `}
                          >
                            {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSkinAction(skin)}
                            disabled={!canAfford}
                            className={`
                              w-full py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg
                              ${canAfford
                                ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 active:scale-95'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-b-4 border-gray-200'}
                            `}
                          >
                            <Coins size={16} className="fill-current" />
                            {skin.price}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Safe Area for Mobile */}
            <div className="h-safe-bottom bg-gray-50/50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
