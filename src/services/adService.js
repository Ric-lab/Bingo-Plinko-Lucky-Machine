import { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Standard Test Ad Unit IDs from Google
const AD_IDS = {
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
    ios: {
        banner: 'ca-app-pub-3940256099942544/2934735716',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
        rewarded: 'ca-app-pub-3940256099942544/1712485313',
    }
};

const getAdIds = () => {
    const platform = Capacitor.getPlatform();
    return AD_IDS[platform] || AD_IDS.android;
};

export const isNativeApp = () => {
    return Capacitor.isNativePlatform();
};

export const initAds = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Initializing AdMob on web/browser...');
        return;
    }
    try {
        console.log('[AdMob Service] Initializing AdMob native SDK...');
        await AdMob.initialize({
            requestTrackingAuthorization: true,
        });
    } catch (e) {
        console.error('[AdMob Service] Initialization error:', e);
    }
};

let bannerActive = false;

export const showBanner = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Showing banner ad at the top of Home screen...');
        return;
    }
    try {
        const ids = getAdIds();
        console.log('[AdMob Service] Showing banner ad...', ids.banner);
        await AdMob.showBanner({
            adId: ids.banner,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
            isTesting: true // Set to false when using real IDs in production
        });
        bannerActive = true;
    } catch (e) {
        console.error('[AdMob Service] Show banner error:', e);
    }
};

export const hideBanner = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Hiding banner ad...');
        return;
    }
    try {
        if (bannerActive) {
            console.log('[AdMob Service] Hiding banner ad...');
            await AdMob.hideBanner();
            bannerActive = false;
        }
    } catch (e) {
        console.error('[AdMob Service] Hide banner error:', e);
    }
};

export const removeBanner = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Removing banner ad...');
        return;
    }
    try {
        if (bannerActive) {
            console.log('[AdMob Service] Removing banner ad...');
            await AdMob.removeBanner();
            bannerActive = false;
        }
    } catch (e) {
        console.error('[AdMob Service] Remove banner error:', e);
    }
};

export const showInterstitialAd = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Showing Interstitial Ad (15s)...');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[AdMob Stub] Interstitial Ad finished.');
                resolve(true);
            }, 1500); // 1.5s visual placeholder for dev
        });
    }
    try {
        const ids = getAdIds();
        console.log('[AdMob Service] Preparing Interstitial...', ids.interstitial);
        await AdMob.prepareInterstitial({
            adId: ids.interstitial,
            isTesting: true
        });
        console.log('[AdMob Service] Showing Interstitial...');
        await AdMob.showInterstitial();
        return true;
    } catch (e) {
        console.error('[AdMob Service] Interstitial Ad error:', e);
        return false;
    }
};

export const showRewardedAd = async () => {
    if (!isNativeApp()) {
        console.log('[AdMob Stub] Showing Rewarded Ad (1min)...');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('[AdMob Stub] Rewarded Ad completed successfully.');
                resolve(true);
            }, 2000); // 2s placeholder for dev
        });
    }
    return new Promise((resolve) => {
        const run = async () => {
            let isRewarded = false;
            let rewardedListener;
            let dismissedListener;

            const cleanup = () => {
                if (rewardedListener) rewardedListener.remove();
                if (dismissedListener) dismissedListener.remove();
            };

            try {
                const ids = getAdIds();
                console.log('[AdMob Service] Preparing Rewarded Ad...', ids.rewarded);

                // Set up listeners BEFORE loading/showing the ad
                rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
                    console.log('[AdMob Service] User earned reward:', reward);
                    isRewarded = true;
                });

                dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    console.log('[AdMob Service] Rewarded ad dismissed/closed.');
                    cleanup();
                    resolve(isRewarded);
                });

                await AdMob.prepareRewardVideoAd({
                    adId: ids.rewarded,
                    isTesting: true
                });

                console.log('[AdMob Service] Showing Rewarded Ad...');
                await AdMob.showRewardVideoAd();

                // Safety fallback timeout: if ad hangs or listeners fail, resolve after 2 minutes
                setTimeout(() => {
                    cleanup();
                    resolve(isRewarded);
                }, 120000);

            } catch (e) {
                console.error('[AdMob Service] Rewarded Ad failed:', e);
                cleanup();
                resolve(false);
            }
        };
        run();
    });
};
