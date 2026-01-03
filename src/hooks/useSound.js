import { useRef, useEffect, useCallback } from 'react';

export function useSound(src, options = { volume: 1.0, loop: false, multi: false }) {
    const audioRef = useRef(null);
    const poolRef = useRef([]); // For multi-shot sounds

    // Track options with a ref to keep callbacks stable
    const optionsRef = useRef(options);

    // Update ref when options change
    useEffect(() => {
        optionsRef.current = options;
    }, [options.volume, options.loop, options.multi]);

    useEffect(() => {
        // Initialize main audio (Only when SRC changes)
        audioRef.current = new Audio(src);

        // Apply initial settings
        audioRef.current.volume = options.volume;
        audioRef.current.loop = options.loop;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            // Cleanup pool
            poolRef.current.forEach(a => a.pause());
            poolRef.current = [];
        };
    }, [src]);

    // React to Volume/Loop changes properly (Dynamic update)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = options.volume;
            audioRef.current.loop = options.loop;
        }
    }, [options.volume, options.loop]);

    const play = useCallback(() => {
        if (!audioRef.current) return;

        const opts = optionsRef.current;

        if (opts.multi) {
            // Clone for overlapping sounds
            if (poolRef.current.length > 10) {
                const available = poolRef.current.find(a => a.ended || a.paused);
                if (available) {
                    available.currentTime = 0;
                    available.play().catch(e => console.warn("Audio play error", e));
                    return;
                }
            }

            const clone = audioRef.current.cloneNode();
            clone.volume = opts.volume;
            clone.play().catch(e => console.warn("Audio play error", e));
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
            audioRef.current.play().catch(e => console.warn("Audio play error", e));
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
