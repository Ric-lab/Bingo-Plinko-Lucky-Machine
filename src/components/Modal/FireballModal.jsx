import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationReward from './ConfirmationReward';

export default function FireballModal({
    isOpen,
    onClose,
    coins,
    buyItem,
    showMessage,
    playClick
}) {
    const [showReward, setShowReward] = useState(false);
    const COST = 250;

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) setShowReward(false);
    }, [isOpen]);

    const handleConfirm = () => {
        playClick?.();
        if (coins >= COST) {
            if (buyItem('fireball', COST)) {
                // Success handled by hook/App, but we can show message here if needed
                // App.jsx commented out the message, so we'll stick to that or Add it back if requested.
                // The original code had: // showMessage('success', 'Fireball Ready!', 'Next drop will be flaming hot!');
                onClose();
            }
        } else {
            showMessage('error', 'Oops!', 'Not enough coins for Fireball!');
        }
    };

    const handleWatchVideo = () => {
        playClick?.();
        // Simulated Ad Logic
        showMessage('info', 'Watching Ad...', 'Please wait 2 seconds...', 2000);

        setTimeout(() => {
            // Grant reward for free
            buyItem('fireball', 0);
            // Always show reward modal after video
            setShowReward(true);
        }, 2500);
    };

    const handleCloseReward = () => {
        playClick?.();
        setShowReward(false);
        onClose();
    };

    if (showReward) {
        return (
            <ConfirmationReward
                isOpen={true}
                onClose={handleCloseReward}
                Icon={Flame}
            />
        );
    }

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={() => { playClick?.(); onClose(); }}
            onConfirm={handleConfirm}
            confirmLabel={
                <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-black">{COST}</span>
                    <img src="/Images/Immutable/Coin.png" alt="Coin" className="w-10 h-10 object-contain drop-shadow-md" />
                </div>
            }
            colorTheme="fireball"
            Icon={Flame}
            showCancel={false}
            secondaryLabel="Watch Video 📺"
            secondaryAction={handleWatchVideo}
        />
    );
}
