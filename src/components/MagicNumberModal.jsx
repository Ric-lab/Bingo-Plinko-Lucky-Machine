import React, { useState } from 'react';
import { X, Check, Wand2 } from 'lucide-react';

export default function MagicNumberModal({ isOpen, onClose, onConfirm, bingoCard }) {
    const [selectedId, setSelectedId] = useState(null);

    if (!isOpen) return null;

    // Helper to get selection details
    const selectedCell = bingoCard.find(c => c.id === selectedId);
    const selectedNumber = selectedCell ? selectedCell.num : null;

    const handleConfirm = () => {
        if (selectedNumber) {
            onConfirm(selectedNumber);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-scale-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between text-white shadow-md">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                            <Wand2 size={24} className="text-yellow-300" />
                            Target Selector
                        </h2>
                        <p className="text-indigo-100 text-xs font-medium mt-1">
                            SELECT YOUR GUARANTEED PRIZE
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Instruction */}
                <div className="px-6 pt-4 pb-2 bg-indigo-50/50 border-b border-indigo-100 text-center">
                    <p className="text-indigo-900 font-bold text-sm">
                        Tap a number to force it in the next spin!
                    </p>
                </div>

                {/* Grid */}
                <div className="p-6 grid grid-cols-5 gap-3 bg-gray-50 flex-1 overflow-y-auto max-h-[60vh]">
                    {bingoCard.map((cell) => {
                        const isMarked = cell.marked || cell.isFree;
                        const isSelected = cell.id === selectedId;

                        return (
                            <button
                                key={cell.id}
                                disabled={isMarked}
                                onClick={() => setSelectedId(cell.id)}
                                className={`
                                    relative aspect-square rounded-xl flex items-center justify-center font-black text-lg transition-all shadow-sm
                                    ${isMarked
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-transparent'
                                        : isSelected
                                            ? 'bg-yellow-400 text-yellow-900 scale-110 shadow-lg border-2 border-yellow-600/50 z-10'
                                            : 'bg-white text-gray-700 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300 hover:scale-105 active:scale-95'
                                    }
                                `}
                            >
                                {cell.isFree ? '★' : cell.num}

                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-0.5 shadow-md">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer / Confirm */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedNumber}
                        className={`
                            w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all
                            ${selectedNumber
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {selectedNumber ? (
                            <>
                                <span>CONFIRM</span>
                                <span className="bg-black/20 px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1">
                                    -300 🟡
                                </span>
                            </>
                        ) : (
                            'Select a Number'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
