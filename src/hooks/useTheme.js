import { useState } from 'react';

export function useTheme() {
    const [currentTheme, setCurrentTheme] = useState('standard');

    const getAsset = (assetName) => {
        // Enforce capitalization for the folder to match "Images/Standard" on disk
        const folder = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
        return `/Images/${folder}/${assetName}`;
    };

    return {
        currentTheme,
        setCurrentTheme,
        getAsset
    };
}
