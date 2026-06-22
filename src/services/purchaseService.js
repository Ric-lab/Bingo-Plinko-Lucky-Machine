import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { Capacitor } from '@capacitor/core';
import { PRODUCTS } from './productConfig';

const NO_ADS_STORAGE_KEY = 'bplm.noads.v1';

export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

export const initPurchases = async () => {
  if (!isNativeApp()) {
    console.log('[IAP Stub] Initializing billing on web...');
    return;
  }
  try {
    const supported = await NativePurchases.isBillingSupported();
    console.log('[IAP Service] Billing supported on device:', supported);
  } catch (e) {
    console.error('[IAP Service] Initialization error:', e);
  }
};

export const isNoAdsPurchased = () => {
  const saved = localStorage.getItem(NO_ADS_STORAGE_KEY);
  return saved === 'true';
};

const setNoAdsPurchased = (val) => {
  localStorage.setItem(NO_ADS_STORAGE_KEY, val ? 'true' : 'false');
};

export const buyCoins = async (offerId) => {
  const offer = PRODUCTS[offerId];
  if (!offer) {
    console.error('[IAP Service] Invalid offerId:', offerId);
    return 0;
  }

  if (!isNativeApp()) {
    console.log(`[IAP Stub] Mocking successful purchase of ${offer.coins} coins...`);
    return offer.coins;
  }

  try {
    console.log('[IAP Service] Requesting purchase of:', offer.id);
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: offer.id,
      productType: PURCHASE_TYPE.INAPP || 'INAPP',
      quantity: 1
    });

    console.log('[IAP Service] Purchase transaction succeeded:', transaction);

    // Consume the consumable purchase immediately on Android so it can be bought again
    if (Capacitor.getPlatform() === 'android' && transaction.purchaseToken) {
      console.log('[IAP Service] Consuming purchase on Android:', transaction.purchaseToken);
      await NativePurchases.consumePurchase({
        token: transaction.purchaseToken
      });
    }

    return offer.coins;
  } catch (e) {
    console.error('[IAP Service] Purchase failed:', e);
    return 0;
  }
};

export const buyNoAds = async () => {
  const offer = PRODUCTS.no_ads;
  if (!isNativeApp()) {
    console.log('[IAP Stub] Mocking successful purchase of No Ads...');
    setNoAdsPurchased(true);
    return true;
  }

  try {
    console.log('[IAP Service] Requesting purchase of:', offer.id);
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: offer.id,
      productType: PURCHASE_TYPE.INAPP || 'INAPP',
      quantity: 1
    });

    console.log('[IAP Service] No Ads transaction succeeded:', transaction);
    setNoAdsPurchased(true);
    return true;
  } catch (e) {
    console.error('[IAP Service] No Ads purchase failed:', e);
    return false;
  }
};

export const restorePurchases = async () => {
  if (!isNativeApp()) {
    console.log('[IAP Stub] Mocking restore purchases...');
    return isNoAdsPurchased();
  }

  try {
    console.log('[IAP Service] Restoring purchases...');
    const result = await NativePurchases.restorePurchases();
    console.log('[IAP Service] Restore result:', result);

    const purchases = result.customerInfo?.activeSubscriptions || result.customerInfo?.allPurchasedProductIdentifiers || [];
    const hasNoAds = purchases.includes(PRODUCTS.no_ads.id);

    setNoAdsPurchased(hasNoAds);
    return hasNoAds;
  } catch (e) {
    console.error('[IAP Service] Restore failed:', e);
    return isNoAdsPurchased();
  }
};
