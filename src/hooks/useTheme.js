import { useEffect, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEY = 'bplm.theme.v1';

export function useTheme() {
    const [currentSkin, setCurrentSkin] = useState('Normal');
    const [ownedSkins, setOwnedSkins] = useState(['Normal']);

    const hydratedRef = useRef(false);
    useEffect(() => {
        let cancelled = false;
        loadJSON(STORAGE_KEY).then(saved => {
            if (cancelled) return;
            if (saved) {
                if (typeof saved.currentSkin === 'string') setCurrentSkin(saved.currentSkin);
                if (Array.isArray(saved.ownedSkins) && saved.ownedSkins.length) {
                    // Merge saved skins with default ones
                    setOwnedSkins(prev => Array.from(new Set([...prev, ...saved.ownedSkins])));
                }
            }
            hydratedRef.current = true;
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!hydratedRef.current) return;
        saveJSON(STORAGE_KEY, { currentSkin, ownedSkins });
    }, [currentSkin, ownedSkins]);

    const unlockSkin = (skinId) => {
        if (!ownedSkins.includes(skinId)) {
            setOwnedSkins(prev => [...prev, skinId]);
        }
    };

    const syncThemeState = (data) => {
        if (!data) return;
        if (typeof data.currentSkin === 'string') setCurrentSkin(data.currentSkin);
        if (Array.isArray(data.ownedSkins)) {
            setOwnedSkins(prev => Array.from(new Set([...prev, ...data.ownedSkins])));
        }
    };

    const getImage = (filename) => `/Images/${encodeURIComponent(currentSkin)}/${filename}`;
    // The new default theme ships its scene as PNG, while the legacy themes
    // use JPG. Keep that format detail here so UI components never point to a
    // missing asset.
    const getBackgroundImage = () => currentSkin === 'Normal'
        ? getImage('Background.png')
        : getImage('Background.jpg');

    // Only Beach currently has a bespoke footer texture. Other skins use the
    // premium CSS fallback instead of requesting a file that does not exist.
    const getFooterBackgroundImage = () => currentSkin === 'Beach'
        ? getImage('footerbg.png')
        : null;
    const getImmutableImage = (filename) => `/Images/Immutable/${filename}`;
    
    // Fallback to Immutable audio since custom audio folders don't exist yet
    const SKINS_WITH_CUSTOM_AUDIO = [];
    const getSound = (filename) => {
        if (SKINS_WITH_CUSTOM_AUDIO.includes(currentSkin)) {
            return `/Audio/${encodeURIComponent(currentSkin)}/${filename}`;
        }
        return `/Audio/Immutable/${filename}`;
    };
    const getImmutableSound = (filename) => `/Audio/Immutable/${filename}`;

    return {
        currentSkin,
        setCurrentSkin,
        ownedSkins,
        unlockSkin,
        syncThemeState,
        getImage,
        getBackgroundImage,
        getFooterBackgroundImage,
        getImmutableImage,
        getSound,
        getImmutableSound,
    };
}
