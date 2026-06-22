import { useRef, useEffect, useCallback } from 'react';

export function useSound(src, { volume = 1.0, loop = false, multi = false } = {}) {
    const audioRef = useRef(null);
    const poolRef = useRef([]); // For multi-shot sounds

    // Track options with a ref to keep callbacks stable
    const optionsRef = useRef({ volume, loop, multi });

    // Update ref when options change
    useEffect(() => {
        optionsRef.current = { volume, loop, multi };
    }, [volume, loop, multi]);

    useEffect(() => {
        // Initialize main audio (Only when SRC changes)
        audioRef.current = new Audio(src);

        // Apply initial settings
        audioRef.current.volume = volume;
        audioRef.current.loop = loop;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            // Cleanup pool
            poolRef.current.forEach(a => a.pause());
            poolRef.current = [];
        };
    }, [src, volume, loop]);

    // React to Volume/Loop changes properly (Dynamic update)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.loop = loop;
        }
    }, [volume, loop]);

    const play = useCallback((overrideOptions = {}) => {
        if (!audioRef.current) return;

        const opts = optionsRef.current;
        const rate = overrideOptions.playbackRate || 1.0;

        if (opts.multi) {
            // Clone for overlapping sounds
            if (poolRef.current.length > 10) {
                const available = poolRef.current.find(a => a.ended || a.paused);
                if (available) {
                    available.currentTime = 0;
                    available.volume = opts.volume; // Reset volume in case it changed
                    available.playbackRate = rate;
                    available.play().catch(() => {});
                    return;
                }
            }

            const clone = audioRef.current.cloneNode();
            clone.volume = opts.volume;
            clone.playbackRate = rate;
            clone.play().catch(() => {});
            poolRef.current.push(clone);

            if (poolRef.current.length > 20) {
                poolRef.current = poolRef.current.filter(a => !a.ended);
            }
        } else {
            // Single track
            if (opts.loop && !audioRef.current.paused && audioRef.current.currentTime > 0) {
                return;
            }

            if (audioRef.current.currentTime > 0 && !audioRef.current.paused) {
                audioRef.current.currentTime = 0;
            }
            // CRITICAL: Force loop property before playing (Native Audio sometimes resets or ignores dynamic prop)
            audioRef.current.loop = opts.loop;
            audioRef.current.playbackRate = rate;
            return audioRef.current.play();
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    const setVolume = useCallback((vol) => {
        if (audioRef.current) audioRef.current.volume = vol;
    }, []);

    return { play, stop, setVolume };
}
