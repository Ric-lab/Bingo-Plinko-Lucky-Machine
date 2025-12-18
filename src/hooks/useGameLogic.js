import { useState, useEffect, useCallback } from 'react';

const COLS = ['B', 'I', 'N', 'G', 'O'];
const RANGES = {
    'B': [1, 15], 'I': [16, 30], 'N': [31, 45], 'G': [46, 60], 'O': [61, 75]
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUniqueRandoms(min, max, count) {
    let arr = [];
    while (arr.length < count) {
        let r = getRandomInt(min, max);
        if (!arr.includes(r)) arr.push(r);
    }
    return arr;
}

export function useGameLogic() {
    const [coins, setCoins] = useState(0);
    const [balls, setBalls] = useState(50);
    const [level, setLevel] = useState(1);
    const [bingoCard, setBingoCard] = useState([]);
    const [slotsResult, setSlotsResult] = useState([0, 0, 0, 0, 0]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winState, setWinState] = useState(false);
    const [combo, setCombo] = useState(0);

    // PHASE: 'SPIN' (Modal showing) | 'DROP' (Waiting for click) | 'RESOLVE' (Ball falling)
    const [phase, setPhase] = useState('SPIN');

    // Initialize Level
    const initLevel = useCallback(() => {
        // Generate Numbers per Column first (so we have valid ranges)
        let colsData = [[], [], [], [], []];
        for (let c = 0; c < 5; c++) {
            colsData[c] = getUniqueRandoms(RANGES[COLS[c]][0], RANGES[COLS[c]][1], 5);
        }

        // Now flatten into ROW-MAJOR order for the 5x5 Grid
        // [Col0Row0, Col1Row0, Col2Row0, Col3Row0, Col4Row0, Col0Row1...]
        let newCard = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                let isFree = (c === 2 && r === 2);
                newCard.push({
                    id: `cell-${c}-${r}`,
                    col: c,
                    row: r,
                    num: isFree ? 'FREE' : colsData[c][r],
                    marked: isFree,
                    isFree
                });
            }
        }

        setBingoCard(newCard);
        setWinState(false);
        setIsGameOver(false);
        setPhase('SPIN'); // Start with spin
    }, [level]);

    // Setup on mount
    useEffect(() => {
        initLevel();
    }, [initLevel]);

    // Trigger Spin Logic with SMART RNG
    const startSpin = () => {
        if (phase !== 'SPIN') return;

        // 1. Identify Needed Numbers (Unmarked, Non-Free)
        // Group them by column for easier access
        const neededByCol = [[], [], [], [], []];
        bingoCard.forEach(cell => {
            if (!cell.marked && !cell.isFree) {
                neededByCol[cell.col].push(cell.num);
            }
        });

        // 2. Determine Count based on Weighted Probability
        // 70% = 1 match, 25% = 2 matches, 5% = 3 matches
        const rand = Math.random();
        let targetCount = 1;
        if (rand < 0.70) targetCount = 1;
        else if (rand < 0.95) targetCount = 2;
        else targetCount = 3;

        // 3. Pick Valid Indices (Golden Buckets)
        let chosenIndices = [];

        // Helper to check if we can actually fulfill a match in a column
        // If a column has no needed numbers, we can't force a match there
        const availableCols = [0, 1, 2, 3, 4].filter(c => neededByCol[c].length > 0);

        // If we can't support the target count, degrade it
        if (availableCols.length < targetCount) {
            targetCount = availableCols.length;
        }

        if (targetCount === 0) {
            chosenIndices = []; // No matches possible (player almost won or full card?)
        } else if (targetCount === 1) {
            // Pick any random index from available columns
            const idx = Math.floor(Math.random() * availableCols.length);
            chosenIndices = [availableCols[idx]];
        } else if (targetCount === 2) {
            // Pick from valid non-adjacent pairs that are currently available
            // Valid Pairs: [0,2], [0,3], [0,4], [1,3], [1,4], [2,4]
            const allPairs = [
                [0, 2], [0, 3], [0, 4],
                [1, 3], [1, 4],
                [2, 4]
            ];
            // Filter pairs to ones where BOTH cols are available
            const validPairs = allPairs.filter(p =>
                neededByCol[p[0]].length > 0 && neededByCol[p[1]].length > 0
            );

            if (validPairs.length > 0) {
                chosenIndices = validPairs[Math.floor(Math.random() * validPairs.length)];
            } else {
                // Fallback to 1 match if no valid pairs conform to availabilty
                // (Should be rare unless columns are specifically cleared)
                const idx = Math.floor(Math.random() * availableCols.length);
                chosenIndices = [availableCols[idx]];
            }
        } else {
            // Target 3: Only [0, 2, 4]
            const triplet = [0, 2, 4];
            const isPossible = triplet.every(c => neededByCol[c].length > 0);

            if (isPossible) {
                chosenIndices = triplet;
            } else {
                // Fallback to 2 logic (copy-paste logic or simplify by recursing? simpler to just fallback to 1 for safety)
                // Let's try to fit 2 if 3 failed
                const allPairs = [
                    [0, 2], [0, 3], [0, 4],
                    [1, 3], [1, 4],
                    [2, 4]
                ];
                const validPairs = allPairs.filter(p =>
                    neededByCol[p[0]].length > 0 && neededByCol[p[1]].length > 0
                );
                if (validPairs.length > 0) {
                    chosenIndices = validPairs[Math.floor(Math.random() * validPairs.length)];
                } else {
                    const idx = Math.floor(Math.random() * availableCols.length);
                    chosenIndices = [availableCols[idx]];
                }
            }
        }

        // 4. Fill Data
        const newSlots = [0, 0, 0, 0, 0];

        for (let c = 0; c < 5; c++) {
            if (chosenIndices.includes(c)) {
                // Golden Match: Pick a needed number
                const possible = neededByCol[c];
                // Randomly pick one of the needed numbers
                newSlots[c] = possible[Math.floor(Math.random() * possible.length)];
            } else {
                // Standard: Pick a number NOT on the card for this column
                const range = RANGES[COLS[c]];
                let candidate = -1;

                // Get all existing numbers in this column to exclude
                const existingInCol = bingoCard
                    .filter(cell => cell.col === c)
                    .map(cell => cell.num); // Includes 'FREE' but that's a string, num is int usually (except FREE)

                // Safety break
                let attempts = 0;
                do {
                    candidate = getRandomInt(range[0], range[1]);
                    attempts++;
                } while (
                    (existingInCol.includes(candidate) || candidate === 'FREE') && attempts < 50
                );

                newSlots[c] = candidate;
            }
        }

        setSlotsResult(newSlots);

        // Transition to DROP after delay
        setTimeout(() => {
            setPhase('DROP');
        }, 1000);
    };


    const completeSpin = () => {
        setPhase('DROP');
    };

    // Called when player clicks a slot
    const dropBall = (colIndex) => {
        if (phase !== 'DROP' || balls <= 0) return false;

        setPhase('RESOLVE');
        setBalls(b => b - 1);

        return true;
    };

    // Revised internal handler for when we have the number
    const resolveTurn = (numberVal) => {
        let hit = false;
        const newCard = bingoCard.map(cell => {
            if (cell.num === numberVal && !cell.marked) {
                hit = true;
                return { ...cell, marked: true };
            }
            return cell;
        });

        if (hit) {
            setBingoCard(newCard);
            setCombo(prev => prev + 1);
            setCoins(prev => prev + 10 + (combo * 2));

            const remaining = newCard.filter(c => !c.marked).length;
            if (remaining === 0) {
                setWinState(true);
                setIsGameOver(true);
                setPhase('GAME_OVER');
            } else {
                // Back to SPIN
                setPhase('SPIN');
            }
        } else {
            setCombo(0);
            setPhase('SPIN');
        }

        // Check balls
        if (balls <= 0 && !hit) {
            if (!winState) {
                setIsGameOver(true);
                setPhase('GAME_OVER');
            }
        }
    };

    const buyItem = (item, cost) => {
        if (coins >= cost) {
            setCoins(c => c - cost);
            if (item === 'balls') {
                setBalls(b => b + 5);
                setIsGameOver(false);
                if (phase === 'GAME_OVER') setPhase('SPIN');
            }
            return true;
        }
        return false;
    };

    return {
        state: { coins, balls, level, bingoCard, slotsResult, isGameOver, winState, phase },
        actions: { initLevel, startSpin, completeSpin, dropBall, resolveTurn, buyItem }
    };
}
