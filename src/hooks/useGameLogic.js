import { useState, useEffect, useCallback } from 'react';

const COLS = ['B', 'I', 'N', 'G', 'O'];
const RANGES = {
    'B': [1, 15], 'I': [16, 30], 'N': [31, 45], 'G': [46, 60], 'O': [61, 75]
};

// CONFIGURATION
const BALLS_PER_LEVEL = 50;

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

function checkBingo(card) {
    // 1. Rows (0-4)
    for (let r = 0; r < 5; r++) {
        const rowCells = card.filter(c => c.row === r);
        if (rowCells.every(c => c.marked)) return true;
    }

    // 2. Columns (0-4)
    for (let c = 0; c < 5; c++) {
        const colCells = card.filter(cell => cell.col === c);
        if (colCells.every(c => c.marked)) return true;
    }

    // 3. Diagonal Top-Left to Bottom-Right
    // (0,0), (1,1), (2,2), (3,3), (4,4)
    const diag1 = [
        card.find(c => c.col === 0 && c.row === 0),
        card.find(c => c.col === 1 && c.row === 1),
        card.find(c => c.col === 2 && c.row === 2),
        card.find(c => c.col === 3 && c.row === 3),
        card.find(c => c.col === 4 && c.row === 4)
    ];
    if (diag1.every(c => c.marked)) return true;

    // 4. Diagonal Top-Right to Bottom-Left
    // (4,0), (3,1), (2,2), (1,3), (0,4)
    const diag2 = [
        card.find(c => c.col === 4 && c.row === 0),
        card.find(c => c.col === 3 && c.row === 1),
        card.find(c => c.col === 2 && c.row === 2),
        card.find(c => c.col === 1 && c.row === 3),
        card.find(c => c.col === 0 && c.row === 4)
    ];
    if (diag2.every(c => c.marked)) return true;

    return false;
}

export function useGameLogic() {
    const [coins, setCoins] = useState(40000);
    const [balls, setBalls] = useState(50);
    const [level, setLevel] = useState(1);
    const [bingoCard, setBingoCard] = useState([]);
    const [slotsResult, setSlotsResult] = useState([0, 0, 0, 0, 0]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winState, setWinState] = useState(false);
    const [combo, setCombo] = useState(0);
    const [fireBallActive, setFireBallActive] = useState(false);
    // Track mercy triggers: { num: number, count: howManyTimesAppeared, lastBall: ballCountAtLastAppear }
    const [mercyTrack, setMercyTrack] = useState({});
    const [magicActive, setMagicActive] = useState(false);

    // PHASE: 'SPIN' (Modal showing) | 'SPINNING' (Slot animation) | 'DROP' (Waiting for click) | 'RESOLVE' (Ball falling)
    const [phase, setPhase] = useState('SPIN');


    // Initialize Level
    const initLevel = useCallback(() => {
        console.log("Initializing Level:", level);
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

        // RESET GAME CONDITIONS (Preserve Coins)
        setBalls(BALLS_PER_LEVEL);
        setMercyTrack({});
        setCombo(0);
        setSlotsResult([0, 0, 0, 0, 0]);
        setFireBallActive(false);
        setMagicActive(false);
    }, [level]);

    // Setup on mount
    useEffect(() => {
        console.log("Effect triggered for Level:", level);
        initLevel();
    }, [initLevel]);

    const nextLevel = () => {
        console.log("Next Level Requested");
        setLevel(prev => prev + 1);
        // initLevel will automatically trigger via useEffect because it depends on level
    };

    // Trigger Spin Logic with SMART RNG
    const startSpin = (magicNumberOverride = null) => {
        if (phase !== 'SPIN') return;

        // 0. Set Phase to SPINNING immediately
        setPhase('SPINNING');

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

        // --- MAGIC SPIN OVERRIDE ---
        let forceCol = -1;
        let forceNum = -1;

        // Check if a specific number is forced (Magic Power-Up)
        // usage: startSpin(numberToForce)
        const magicNumber = typeof magicNumberOverride === 'number' ? magicNumberOverride : null;

        if (magicNumber !== null) {
            // Find the column for this number
            const cell = bingoCard.find(c => c.num === magicNumber);
            if (cell) {
                forceCol = cell.col;
                forceNum = magicNumber;
                setMagicActive(true);
            }
        }
        // ---------------------------

        // --- MERCY LOGIC START ---

        // Check for Near Miss Condition (One away from Bingo)
        // Only active if balls <= 10
        let mercyOverride = false;
        let mercyTargetCol = -1;
        let mercyTargetNum = -1;

        if (balls <= 10) {
            // Find all numbers that complete a line
            const nearMisses = [];

            // Helper to see if a set has 4 marked and 1 unmarked
            const checkNearMiss = (cellList) => {
                const unmarked = cellList.filter(c => !c.marked && !c.isFree);
                if (unmarked.length === 1) {
                    nearMisses.push(unmarked[0]);
                }
            };

            // 1. Rows
            for (let r = 0; r < 5; r++) checkNearMiss(bingoCard.filter(c => c.row === r));
            // 2. Cols
            for (let c = 0; c < 5; c++) checkNearMiss(bingoCard.filter(c => c.col === c));
            // 3. Diagonals
            const diag1 = [0, 1, 2, 3, 4].map(i => bingoCard.find(c => c.col === i && c.row === i));
            checkNearMiss(diag1);
            const diag2 = [0, 1, 2, 3, 4].map(i => bingoCard.find(c => c.col === (4 - i) && c.row === i));
            checkNearMiss(diag2);

            const uniqueCandidates = [...new Set(nearMisses.map(c => c.num))];

            // Filter candidates that are actually in availableCols (should be all?)
            // Just double check we have a valid col for them
            const validCandidates = uniqueCandidates.filter(num => {
                // find col
                const cell = bingoCard.find(c => c.num === num);
                return cell && availableCols.includes(cell.col);
            });

            if (validCandidates.length > 0) {
                // Pick one candidate to focus on (consistency)
                // If we already have a track record for one, stick to it or pick the first
                // For simplicity, let's target the first one found to be deterministic per spin or pick random
                // Let's pick random from valid candidates
                const targetNum = validCandidates[Math.floor(Math.random() * validCandidates.length)];
                const targetCell = bingoCard.find(c => c.num === targetNum);

                if (targetCell) {
                    // Check history
                    const track = mercyTrack[targetNum] || { count: 0, lastBall: -1 };

                    // Logic: We need it to appear 2 times in the remaining balls.
                    // If balls = 10, and count = 0, we have 10 turns to show 2 times.
                    // We must NOT show it if lastBall = balls + 1 (consecutive)

                    const canShow = (track.lastBall !== balls + 1); // Ensure non-consecutive
                    const timesNeeded = 2 - track.count;
                    const turnsLeft = balls;

                    if (timesNeeded > 0 && canShow) {
                        // Probability to force it now?
                        // If we have plenty of turns, small chance. If we are running out, 100% chance.
                        // Example: Needed 2, Turns 5. We must trigger soon.
                        // Simple heuristic: Chance = Needed / TurnsLeft * 1.5 (boosted)
                        // Or just FORCE it if (TurnsLeft <= Needed * 2) or randomness.

                        let chance = (timesNeeded / turnsLeft);
                        // Boost it slightly so we don't wait till the very last second
                        chance = Math.min(chance * 1.5, 1.0);

                        if (Math.random() < chance) {
                            mercyOverride = true;
                            mercyTargetCol = targetCell.col;
                            mercyTargetNum = targetNum;

                            // Update Track
                            setMercyTrack(prev => ({
                                ...prev,
                                [targetNum]: {
                                    count: track.count + 1,
                                    lastBall: balls
                                }
                            }));
                        }
                    }
                }
            }
        }
        // --- MERCY LOGIC END ---

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

        if (magicNumber !== null) {
            // MAGIC NUMBER MODE: User chose a specific number.
            // Requirement: "COLOCAR O VALOR QUE ELA ESCOLHEU EM TODOS OS CANOS"
            // We fill ALL slots with the chosen number so they win no matter where they drop.
            newSlots.fill(magicNumber);
        } else {
            // NORMAL SPIN MODE
            for (let c = 0; c < 5; c++) {
                if (mercyOverride && c === mercyTargetCol) {
                    // FORCE THE MERCY NUMBER
                    newSlots[c] = mercyTargetNum;
                } else if (chosenIndices.includes(c)) {
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
                        .map(cell => cell.num);

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
        }

        setSlotsResult(newSlots);

        // Transition to DROP after delay (SLOT MACHINE TIME)
        setTimeout(() => {
            setPhase('DROP');
        }, 2200); // 2.2 seconds (buffer for animation)
    };


    const completeSpin = () => {
        setPhase('DROP');
    };

    // Called when player clicks a slot
    const dropBall = (colIndex) => {
        if (phase !== 'DROP' || balls <= 0) return false;

        setPhase('RESOLVE');
        setBalls(b => b - 1);

        // DO NOT Reset Fireball here - wait for resolveTurn
        // if (fireBallActive) {
        //    setFireBallActive(false);
        // }

        return true;
    };

    // Revised internal handler for when we have the number
    const resolveTurn = (numberVal, colIndex) => {
        // Reset Fireball now that ball has landed
        if (fireBallActive) setFireBallActive(false);
        if (magicActive) setMagicActive(false);

        // Clear numbers on ALL pipes (show letters)

        setSlotsResult([0, 0, 0, 0, 0]);

        let hit = false;
        const newCard = bingoCard.map(cell => {
            if (cell.num === numberVal && !cell.marked) {
                hit = true;
                return { ...cell, marked: true };
            }
            return cell;
        });

        let earned = 0;

        if (hit) {
            setBingoCard(newCard);
            setCombo(prev => prev + 1);
            earned = 5; // Fixed reward, no combo multiplier
            setCoins(prev => prev + earned);

            const hasBingo = checkBingo(newCard); // NEW check
            if (hasBingo) {
                setWinState(true);
                setIsGameOver(true);
                setPhase('GAME_OVER');
                setCoins(prev => prev + (100 + level)); // REWARD 100 + Level COINS
            } else {
                // If NO Bingo, we must still check if we are out of balls
                if (balls <= 0) {
                    setIsGameOver(true);
                    setPhase('GAME_OVER');
                    isDefeat = true;
                } else {
                    // Back to SPIN
                    setPhase('SPIN');
                }
            }
        } else {
            setCombo(0);

            // Check balls for defeat
            if (balls <= 0) {
                if (!winState) { // Should be covered, but safety check
                    setIsGameOver(true);
                    setPhase('GAME_OVER');
                    isDefeat = true;
                }
            } else {
                setPhase('SPIN');
            }
        }

        const hasBingo = hit && checkBingo(newCard);
        return {
            hit,
            earned,
            combo: hit ? combo + 1 : 0,
            hasBingo: winState || hasBingo,
            isDefeat
        };
    };

    const buyItem = (item, cost) => {
        if (coins >= cost) {
            setCoins(c => c - cost);
            if (item === 'balls') {
                setBalls(b => b + 5);
                setIsGameOver(false);
                if (phase === 'GAME_OVER') setPhase('SPIN');
            } else if (item === 'continue') {
                setBalls(b => b + 10);
                setIsGameOver(false);
                setPhase('SPIN');
            } else if (item === 'fireball') {
                setFireBallActive(true);
            } else if (item === 'magic') {
                // Magic is handled in startSpin usually, but if we need state here:
                // (Currently magic logic is immediate in handleMagicConfirm)
            }
            return true;
        }
        return false;
    };

    return {
        state: { coins, balls, level, bingoCard, slotsResult, isGameOver, winState, phase, fireBallActive, magicActive },
        actions: { initLevel, startSpin, completeSpin, dropBall, resolveTurn, buyItem, nextLevel }
    };
}
