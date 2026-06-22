// In-App Purchase products configuration mapping to Google Play Console / App Store Connect
export const PRODUCTS = {
  'starter': { id: 'coins_2500', coins: 2500 },
  'winner': { id: 'coins_5000', coins: 5000 },
  'super': { id: 'coins_7500', coins: 7500 },
  'no_ads': { id: 'no_ads', type: 'non-consumable' }
};

export const PRODUCT_IDS = Object.values(PRODUCTS).map(p => p.id);
