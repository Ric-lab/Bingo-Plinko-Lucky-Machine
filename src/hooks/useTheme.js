import { useState } from 'react';

export function useTheme() {
    const [currentSkin, setCurrentSkin] = useState('Standard');
    const [ownedSkins, setOwnedSkins] = useState(['Standard']);

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
