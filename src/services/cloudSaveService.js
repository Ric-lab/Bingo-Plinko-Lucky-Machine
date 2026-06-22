import { GoogleGameServices } from 'capacitor-google-game-services';
import { Capacitor } from '@capacitor/core';

const isAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

// Memory fallback for browser/stub mode
let mockSaveData = null;
let mockSignedIn = false;

export const signIn = async () => {
  if (!isAndroid()) {
    console.log('[CloudSave Stub] Sign in requested on web.');
    mockSignedIn = true;
    return { isAuthenticated: true };
  }
  try {
    console.log('[CloudSave Service] Invoking Native Google Game Services Sign In...');
    const result = await GoogleGameServices.signIn();
    console.log('[CloudSave Service] Sign In result:', result);
    return result; // { isAuthenticated: boolean }
  } catch (e) {
    console.error('[CloudSave Service] Sign In failed:', e);
    return { isAuthenticated: false };
  }
};

export const isAuthenticated = async () => {
  if (!isAndroid()) {
    return { isAuthenticated: mockSignedIn };
  }
  try {
    const result = await GoogleGameServices.isAuthenticated();
    return result; // { isAuthenticated: boolean }
  } catch (e) {
    console.error('[CloudSave Service] Check auth failed:', e);
    return { isAuthenticated: false };
  }
};

export const saveToCloud = async (gameData) => {
  const dataStr = JSON.stringify(gameData);
  if (!isAndroid()) {
    console.log('[CloudSave Stub] Saving to web fallback memory:', dataStr);
    mockSaveData = dataStr;
    localStorage.setItem('bplm.cloudSaveMock', dataStr);
    return true;
  }
  try {
    const auth = await GoogleGameServices.isAuthenticated();
    if (!auth.isAuthenticated) {
      console.log('[CloudSave Service] User not signed in. Attempting sign in first...');
      const authResult = await GoogleGameServices.signIn();
      if (!authResult.isAuthenticated) {
        console.error('[CloudSave Service] User not signed in, cannot save.');
        return false;
      }
    }
    console.log('[CloudSave Service] Saving game state to Google Play Cloud...');
    await GoogleGameServices.saveGame({
      title: 'savenameTemp',
      data: dataStr
    });
    console.log('[CloudSave Service] Cloud save successful!');
    return true;
  } catch (e) {
    console.error('[CloudSave Service] Cloud save failed:', e);
    return false;
  }
};

export const loadFromCloud = async () => {
  if (!isAndroid()) {
    console.log('[CloudSave Stub] Loading from web fallback...');
    const local = localStorage.getItem('bplm.cloudSaveMock') || mockSaveData;
    if (!local) return null;
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  try {
    const auth = await GoogleGameServices.isAuthenticated();
    if (!auth.isAuthenticated) {
      console.log('[CloudSave Service] User not authenticated. Attempting sign in...');
      const authResult = await GoogleGameServices.signIn();
      if (!authResult.isAuthenticated) {
        console.error('[CloudSave Service] Authentication required to load cloud data.');
        return null;
      }
    }
    console.log('[CloudSave Service] Loading game state from Google Play Cloud...');
    const result = await GoogleGameServices.loadGame();
    console.log('[CloudSave Service] Loaded result:', result);
    if (result && result.data) {
      return JSON.parse(result.data);
    }
    return null;
  } catch (e) {
    console.error('[CloudSave Service] Cloud load failed:', e);
    return null;
  }
};
