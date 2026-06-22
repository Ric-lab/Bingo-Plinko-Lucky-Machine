import { showRewardedAd } from '../../services/adService';

export default function GameOverModal({
    coins,
    onRestart,
    buyItem,
    showMessage,
    playClick,
    noAds = false
}) {
    return (
        <div className="absolute inset-0 z-50 bg-red-900/90 backdrop-blur-md flex items-center justify-center flex-col text-white animate-fade-in p-4 text-center overflow-hidden w-full h-full">

            <h1 className="text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-scale-pulse">
                GAME OVER
            </h1>

            <div className="flex flex-col gap-4 w-full max-w-xs px-4">
                {/* CONTINUE WITH VIDEO AD */}
                <button
                    onClick={async () => {
                        playClick?.();
                        if (noAds) {
                            // Bypass ad instantly if No Ads is purchased
                            buyItem('continue', 0);
                            return;
                        }
                        showMessage('info', 'Loading Ad...', 'Please wait...', 1000);
                        const success = await showRewardedAd();
                        if (success) {
                            buyItem('continue', 0);
                        } else {
                            showMessage('error', 'Oops!', 'Ad failed to complete.');
                        }
                    }}
                    className="group relative px-6 py-3 rounded-full font-black text-xl shadow-xl transition-all border-4 border-white/30 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 cursor-pointer shadow-[0_5px_0_rgb(29,78,216)] active:translate-y-[5px] active:shadow-none"
                >
                    <span className="drop-shadow-md flex flex-col items-center leading-none">
                        <span>+10 BALLS</span>
                        <span className="text-sm text-yellow-300">VIDEO 📺</span>
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                {/* CONTINUE WITH COINS */}
                <button
                    onClick={() => {
                        playClick?.();
                        if (coins >= 1000) {
                            buyItem('continue', 1000);
                        } else {
                            // Alert
                            showMessage('error', 'Oops!', 'Not enough coins to Continue!');
                        }
                    }}
                    disabled={coins < 1000}
                    className={`group relative px-6 py-3 rounded-full font-black text-xl shadow-xl transition-all border-4 border-white/30 ${coins >= 1000 ? 'bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 cursor-pointer shadow-[0_5px_0_rgb(180,83,9)] active:translate-y-[5px] active:shadow-none' : 'bg-gray-500 opacity-50 cursor-not-allowed'}`}
                >
                    <span className="drop-shadow-md flex flex-col items-center leading-none">
                        <span>+10 BALLS</span>
                        <span className="text-sm text-yellow-300">1000 🟡</span>
                    </span>
                    {coins >= 1000 && (
                        <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
                </button>

                <button
                    onClick={() => { playClick?.(); onRestart(); }}
                    className="group relative bg-gradient-to-b px-6 py-3.5 rounded-full font-black text-2xl shadow-xl transition-all border-4 border-white/30 from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-[0_5px_0_rgb(185,28,28)] active:shadow-none active:translate-y-[5px]"
                >
                    <span className="drop-shadow-md">
                        RESTART ↺
                    </span>

                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

            </div>
        </div>
    );
}
