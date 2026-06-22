import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ConfirmationReward from './ConfirmationReward';

import { showRewardedAd } from '../../services/adService';

export default function FireballModal({
    isOpen,
    onClose,
    coins,
    buyItem,
    showMessage,
    playClick,
    onOpenShop,
    noAds = false
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
            if (buyItem('fireball', COST)) onClose();
        } else {
            onClose();
            if (onOpenShop) onOpenShop();
        }
    };

    const handleWatchVideo = async () => {
        playClick?.();
        if (noAds) {
            // Bypass ad instantly if No Ads is purchased
            buyItem('fireball', 0);
            setShowReward(true);
            return;
        }
        showMessage('info', 'Loading Ad...', 'Please wait...', 1000);

        const success = await showRewardedAd();
        if (success) {
            buyItem('fireball', 0);
            setShowReward(true);
        } else {
            showMessage('error', 'Oops!', 'Ad failed to complete.');
        }
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
