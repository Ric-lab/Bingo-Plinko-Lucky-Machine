import { Preferences } from '@capacitor/preferences';

// Capacitor Preferences uses native KV stores on Android/iOS and falls back to
// localStorage on the web, so the same async API works for both.

export async function loadJSON(key) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key, data) {
  try {
    await Preferences.set({ key, value: JSON.stringify(data) });
  } catch {
    // Best-effort: storage failures should never crash the game.
  }
}
