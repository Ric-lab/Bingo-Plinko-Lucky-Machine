import { useEffect, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEY = 'bplm.theme.v1';

export function useTheme() {
    const [currentSkin, setCurrentSkin] = useState('Standard');
    const [ownedSkins, setOwnedSkins] = useState(['Standard']);

    const hydratedRef = useRef(false);
    useEffect(() => {
        let cancelled = false;
        loadJSON(STORAGE_KEY).then(saved => {
            if (cancelled) return;
            if (saved) {
                if (typeof saved.currentSkin === 'string') setCurrentSkin(saved.currentSkin);
                if (Array.isArray(saved.ownedSkins) && saved.ownedSkins.length) {
                    setOwnedSkins(saved.ownedSkins);
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

    const getImage = (filename) => `/Images/${currentSkin}/${filename}`;
    const getImmutableImage = (filename) => `/Images/Immutable/${filename}`;
    const getSound = (filename) => `/Audio/${currentSkin}/${filename}`;
    const getImmutableSound = (filename) => `/Audio/Immutable/${filename}`;

    return {
        currentSkin,
        setCurrentSkin,
        ownedSkins,
        unlockSkin,
        getImage,
        getImmutableImage,
        getSound,
        getImmutableSound,
    };
}
