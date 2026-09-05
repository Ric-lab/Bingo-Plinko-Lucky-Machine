import { useEffect, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEY = 'bplm.theme.v1';
const FIXED_SKIN = 'Standard';

export function useTheme() {
    const getImage = (filename) => `/Images/${FIXED_SKIN}/${filename}`;
    const getImmutableImage = (filename) => `/Images/Immutable/${filename}`;
    const getSound = (filename) => `/Audio/${FIXED_SKIN}/${filename}`;
    const getImmutableSound = (filename) => `/Audio/Immutable/${filename}`;

    return {
        currentSkin: FIXED_SKIN,
        getImage,
        getImmutableImage,
        getSound,
        getImmutableSound,
    };
}
