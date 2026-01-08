import { useState } from 'react';

export function useTheme() {
    // Current Skin (Default: 'Standard')
    // This could also be loaded from localStorage in the future
    // Current Skin (Default: 'Standard')
    // This could also be loaded from localStorage in the future
    const [currentSkin, setCurrentSkin] = useState('Standard');
    // Track Owned Skins
    const [ownedSkins, setOwnedSkins] = useState(['Standard']);

    const unlockSkin = (skinId) => {
        if (!ownedSkins.includes(skinId)) {
            setOwnedSkins(prev => [...prev, skinId]);
        }
    };


    /**
     * Get path for a Skinned Asset (Image)
     * @param {string} filename 
     */
    const getImage = (filename) => {
        return `/Images/${currentSkin}/${filename}`;
    };

    /**
     * Get path for an Immutable Asset (Image)
     * Assets that never change regardless of skin
     */
    const getImmutableImage = (filename) => {
        return `/Images/Immutable/${filename}`;
    };

    /**
     * Get path for a Skinned Audio
     * @param {string} filename 
     */
    const getSound = (filename) => {
        return `/Audio/${currentSkin}/${filename}`;
    };

    /**
     * Get path for an Immutable Audio
     */
    const getImmutableSound = (filename) => {
        return `/Audio/Immutable/${filename}`;
    };

    // Generic "Smart" Helper (Optional, but useful if we want to guess)
    // For now, explicit is better to avoid "Magic" checks on file existence.

    return {
        currentSkin,
        setCurrentSkin,
        ownedSkins,
        unlockSkin,
        // Expose explicit helpers
        getImage,
        getImmutableImage,
        getSound,
        getImmutableSound,
        // Legacy/Generic alias if needed (renamed from getAsset to avoid confusion, but keeping getAsset as alias for backward compat if I missed something, though I read all files)
        getAsset: getImage
    };
}
