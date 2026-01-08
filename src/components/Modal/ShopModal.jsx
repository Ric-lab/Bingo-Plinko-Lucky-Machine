import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Crown, Coins, Palette, CheckCircle2, Lock, Ban, Trophy } from 'lucide-react';

export default function ShopModal({
  isOpen,
  onClose,
  buyItem,
  playClick,
  coins,
  currentSkin,
  setCurrentSkin,
  ownedSkins,
  unlockSkin
}) {

  const [activeTab, setActiveTab] = useState('coins'); // 'coins' | 'skins'

  // Real Money Offers
  // Real Money Offers
  const coinOffers = [
    {
      id: 'starter',
      title: 'STARTER',
      coins: 2500,
      price: 'R$ 4,99',
      icon: <Coins className="w-6 h-6 text-cyan-100" />,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      highlight: false,
    },
    {
      id: 'winner',
      title: 'WINNER',
      coins: 5000,
      price: 'R$ 9,99',
      icon: <Trophy className="w-6 h-6 text-purple-100" />,
      color: 'bg-gradient-to-br from-violet-600 to-purple-600',
      highlight: true,
    },
    {
      id: 'super',
      title: 'SUPER',
      coins: 7500,
      price: 'R$ 14,99',
      icon: <Star className="w-6 h-6 text-rose-100" />,
      color: 'bg-gradient-to-br from-fuchsia-500 to-rose-500',
      highlight: false,
    }
  ];

  // Skin Offers (Virtual Currency)
  const skinOffers = [
    {
      id: 'Standard',
      title: 'ROYAL BINGO',
      price: 0,
      gradient: 'from-amber-100 to-orange-100', // Royal/Classic feel
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

  const handleBuyCoins = (offer) => {
    playClick?.();
    // Simulation
    console.log("Comprando Coins:", offer.title);
    // Positive Amount = Cheat/Simulate Add
    // In real app, this waits for Payment Gateway
    if (buyItem) buyItem('coins', -offer.coins);
  };

  const handleBuyNoAds = () => {
    playClick?.();
    console.log("Comprando No Ads");
    // Trigger No Ads Logic
  };

  const handleSkinAction = (skin) => {
    playClick?.();
    const isOwned = ownedSkins.includes(skin.id);

    if (isOwned) {
      // Equip
      setCurrentSkin(skin.id);
    } else {
      // Buy
      if (coins >= skin.price) {
        if (buyItem('coins', skin.price)) { // Deduct coins
          unlockSkin(skin.id);
        }
      } else {
        // Shake or feedback for insufficient funds
        console.log("Moedas insuficientes");
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

          {/* Modal Content - Card Style Fixed Dimensions */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-[90%] max-w-[380px] h-[75vh] bg-gray-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
          >
            {/* Header Fixed */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 p-2 rounded-xl">
                  <ShoppingCart className="text-white w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-wide">LOJA</h2>
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

            {/* HIGH PRIORITY: Fixed No Ads Offer - Premium Card Design */}
            <div className="p-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg relative overflow-hidden flex-shrink-0 z-0">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative flex justify-between items-center z-10">
                <div className="flex flex-col gap-1">
                  {/* Tag */}
                  <div className="flex items-center gap-1 self-start bg-amber-400/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black text-amber-900 shadow-sm mb-1">
                    <Crown className="w-3 h-3" />
                    <span>BEST OFFER</span>
                  </div>

                  {/* Main Title & Icon */}
                  <div className="flex items-center gap-3">
                    {/* Icon Container with Glow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/30 blur-lg rounded-full" />
                      <img src="/Images/Immutable/NoAds.png" alt="No Ads" className="relative w-12 h-12 object-contain drop-shadow-md transform -rotate-6" />
                    </div>

                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md leading-none">
                        NO ADS
                      </h3>
                      <div className="flex items-center gap-1 mt-1 bg-black/20 px-2 py-0.5 rounded-md border border-white/10 w-fit">
                        <span className="text-yellow-300 font-bold text-sm">+ 10.000</span>
                        <Coins className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={handleBuyNoAds}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-yellow-950 font-black py-3 px-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xl border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 min-w-[100px]"
                >
                  <span>R$ 14,99</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-2 bg-white border-b border-gray-100 gap-2 flex-shrink-0">
              <TabButton
                isActive={activeTab === 'coins'}
                onClick={() => { playClick?.(); setActiveTab('coins'); }}
                icon={<Coins size={18} />}
                label="MOEDAS"
                color="bg-amber-100 text-amber-700"
              />
              <TabButton
                isActive={activeTab === 'skins'}
                onClick={() => { playClick?.(); setActiveTab('skins'); }}
                icon={<Palette size={18} />}
                label="TEMAS"
                color="bg-purple-100 text-purple-700"
              />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">

              {activeTab === 'coins' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  {coinOffers.map((offer) => (
                    <div key={offer.id} className={`relative flex items-center justify-between p-3 rounded-2xl shadow-lg border border-white/10 overflow-hidden group ${offer.color}`}>

                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                      <div className="flex items-center gap-3 relative z-10 overflow-hidden">
                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner flex-shrink-0">
                          {offer.icon}
                        </div>
                        <div className="text-white min-w-0">
                          <h4 className="font-black text-lg italic tracking-tight drop-shadow-sm whitespace-nowrap pr-2">{offer.title}</h4>
                          <div className="flex items-center gap-1 font-bold text-yellow-300 text-sm">
                            <span>+{offer.coins}</span>
                            <Coins size={12} fill="currentColor" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyCoins(offer)}
                        className="relative z-10 bg-white text-gray-900 font-black py-2 px-3 rounded-lg shadow-xl active:scale-95 transition-all text-sm border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 whitespace-nowrap"
                      >
                        {offer.price}
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'skins' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
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
              )}

            </div>

            {/* Safe Area for Mobile */}
            <div className="h-safe-bottom bg-gray-50/50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TabButton({ isActive, onClick, icon, label, color }) {
  return (
    <button
      onClick={onClick}
      className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                ${isActive
          ? `${color} shadow-sm ring-2 ring-inset ring-black/5`
          : 'text-gray-400 hover:bg-gray-50'}
            `}
    >
      {React.cloneElement(icon, {
        className: isActive ? 'scale-110' : 'scale-100 opacity-70',
        strokeWidth: 2.5
      })}
      {label}
    </button>
  );
}
