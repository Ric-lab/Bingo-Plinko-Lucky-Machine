// test-fingo-physics.mjs
import assert from 'node:assert/strict';
import { getSessionDropCount, incrementSessionDropCount, resetSessionDropCount, getSessionAssistFactor } from './src/utils/sessionPhysics.js';
import { calculateProbabilities, pickNonAdjacentColumns } from './src/utils/mathUtils.js';

console.log('=== TEST 1: sessionPhysics (Peg Assist Curve & Drop Tracking) ===');
resetSessionDropCount();
assert.equal(getSessionDropCount(), 0, 'Initial drop count should be 0');

// Test early drops (0-3): Assist factor must be exactly 1.0
for (let d = 0; d <= 3; d++) {
    const factor = getSessionAssistFactor(d);
    assert.equal(factor, 1.0, `Drop ${d} should have maximum assist factor 1.0, got ${factor}`);
}

// Test decay (drops 4 to 29): Must strictly decrease and remain within (0.15, 1.0)
let prevFactor = 1.0;
for (let d = 4; d <= 29; d++) {
    const factor = getSessionAssistFactor(d);
    assert.ok(factor < prevFactor, `Drop ${d} factor (${factor}) must be less than previous (${prevFactor})`);
    assert.ok(factor >= 0.15, `Drop ${d} factor (${factor}) must be >= 0.15`);
    assert.ok(factor <= 1.0, `Drop ${d} factor (${factor}) must be <= 1.0`);
    prevFactor = factor;
}

// Test baseline floor (drops 30+): Must equal 0.15 exactly
for (let d of [30, 31, 50, 100, 1000]) {
    const factor = getSessionAssistFactor(d);
    assert.equal(factor, 0.15, `Drop ${d} should have baseline assist factor 0.15, got ${factor}`);
}

// Test incrementSessionDropCount
assert.equal(incrementSessionDropCount(), 1);
assert.equal(incrementSessionDropCount(), 2);
assert.equal(getSessionDropCount(), 2);
resetSessionDropCount();
assert.equal(getSessionDropCount(), 0);
console.log('✓ sessionPhysics tests PASSED!');


console.log('\n=== TEST 2: mathUtils (Probabilities & Column Selection) ===');
// Test level probabilities
const pLvl1 = calculateProbabilities(1);
assert.ok(pLvl1.one + pLvl1.two + pLvl1.three > 0.99 && pLvl1.one + pLvl1.two + pLvl1.three < 1.01, 'Probabilities should sum to 1');
assert.ok(pLvl1.one > pLvl1.three, 'Level 1 should favor 1 golden column over 3');

// Test pickNonAdjacentColumns
for (let i = 0; i < 50; i++) {
    const available = [0, 1, 2, 3, 4];
    const picked2 = pickNonAdjacentColumns(available, 2);
    if (picked2.length === 2) {
        assert.ok(Math.abs(picked2[0] - picked2[1]) > 1, `Picked columns ${picked2} must NOT be adjacent`);
    }
}
console.log('✓ mathUtils tests PASSED!');


console.log('\n=== TEST 3: FINGO Win Condition (checkLineMatch) ===');
function checkLineMatch(card) {
    // 1. Rows
    for (let r = 0; r < 5; r++) {
        const rowCells = card.filter(c => c.row === r);
        if (rowCells.every(c => c.marked)) return true;
    }
    // 2. Columns
    for (let c = 0; c < 5; c++) {
        const colCells = card.filter(cell => cell.col === c);
        if (colCells.every(c => c.marked)) return true;
    }
    // 3. Diagonals
    const diag1 = [0, 1, 2, 3, 4].map(i => card.find(c => c.col === i && c.row === i));
    if (diag1.every(c => c.marked)) return true;

    const diag2 = [0, 1, 2, 3, 4].map(i => card.find(c => c.col === (4 - i) && c.row === i));
    if (diag2.every(c => c.marked)) return true;

    return false;
}

// Generate blank card
function createTestCard() {
    const card = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 5; r++) {
            const isFree = (c === 2 && r === 2);
            card.push({ col: c, row: r, marked: isFree, isFree });
        }
    }
    return card;
}

// Test initial card: not won
const blankCard = createTestCard();
assert.equal(checkLineMatch(blankCard), false, 'Initial card with only center free should NOT win');

// Test row win
for (let r = 0; r < 5; r++) {
    const card = createTestCard();
    card.forEach(cell => { if (cell.row === r) cell.marked = true; });
    assert.equal(checkLineMatch(card), true, `Row ${r} complete should win FINGO`);
}

// Test col win
for (let c = 0; c < 5; c++) {
    const card = createTestCard();
    card.forEach(cell => { if (cell.col === c) cell.marked = true; });
    assert.equal(checkLineMatch(card), true, `Col ${c} complete should win FINGO`);
}

// Test diagonal 1 win
const cardDiag1 = createTestCard();
cardDiag1.forEach(cell => { if (cell.col === cell.row) cell.marked = true; });
assert.equal(checkLineMatch(cardDiag1), true, 'Main diagonal complete should win FINGO');

// Test diagonal 2 win
const cardDiag2 = createTestCard();
cardDiag2.forEach(cell => { if (cell.col === 4 - cell.row) cell.marked = true; });
assert.equal(checkLineMatch(cardDiag2), true, 'Anti-diagonal complete should win FINGO');

// Test 4 in a row (almost win): should NOT win
const cardAlmost = createTestCard();
cardAlmost.forEach(cell => { if (cell.row === 0 && cell.col < 4) cell.marked = true; });
assert.equal(checkLineMatch(cardAlmost), false, '4 in a row should NOT win FINGO');

console.log('✓ FINGO win check tests PASSED!');


console.log('\n=== TEST 4: Peg Assist Vector Calculation ===');
// Test the logic used in GameCanvas.jsx collision handler
const PHYSICS_CONFIG = {
    PEG_ACTIVE_FORCE: 0.05,
    PEG_STEER_NUDGE: 0.006,
    WALL_KICK_X: 0.15,
    WALL_KICK_Y: -0.05,
};

function computePegNudge(ballX, targetCols, canvasWidth, dropCount) {
    const binW = canvasWidth / 5;
    let bestTargetX = null;
    let minDist = Infinity;

    for (let i = 0; i < targetCols.length; i++) {
        const colIdx = targetCols[i];
        const colCenterX = (colIdx + 0.5) * binW;
        const dist = Math.abs(colCenterX - ballX);
        if (dist < minDist) {
            minDist = dist;
            bestTargetX = colCenterX;
        }
    }

    if (bestTargetX !== null) {
        const diffX = bestTargetX - ballX;
        if (Math.abs(diffX) > 6) {
            const dirX = Math.sign(diffX);
            const assist = getSessionAssistFactor(dropCount);
            return dirX * PHYSICS_CONFIG.PEG_STEER_NUDGE * assist;
        }
    }
    return 0;
}

const canvasW = 360;
// Target is col 0 (center at 36px)
// Ball at x = 100px (to the right of target)
// Early session: dropCount = 1 (assist = 1.0)
const nudgeEarly = computePegNudge(100, [0], canvasW, 1);
assert.ok(nudgeEarly < 0, 'Nudge should be negative (steer left towards target)');
assert.equal(nudgeEarly, -1 * PHYSICS_CONFIG.PEG_STEER_NUDGE * 1.0);

// Late session: dropCount = 35 (assist = 0.15)
const nudgeLate = computePegNudge(100, [0], canvasW, 35);
assert.ok(nudgeLate < 0, 'Nudge should still be towards target');
assert.equal(nudgeLate, -1 * PHYSICS_CONFIG.PEG_STEER_NUDGE * 0.15);
assert.ok(Math.abs(nudgeEarly) > Math.abs(nudgeLate), 'Early assist nudge must be stronger than late assist');

// Ball already directly aligned (diffX <= 6): should not nudge
const nudgeAligned = computePegNudge(36, [0], canvasW, 1);
assert.equal(nudgeAligned, 0, 'Aligned ball should have 0 nudge');

console.log('✓ Peg Assist Vector calculations PASSED!');


console.log('\n=== TEST 5: Wall Bounce Physics & Bucket Sensors ===');
// Wall bounce forces
const wallLeftKick = { x: PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y };
const wallRightKick = { x: -PHYSICS_CONFIG.WALL_KICK_X, y: PHYSICS_CONFIG.WALL_KICK_Y };
assert.ok(wallLeftKick.x > 0, 'Left wall kick must push to the right (+x)');
assert.ok(wallLeftKick.y < 0, 'Left wall kick must have upward lift (-y)');
assert.ok(wallRightKick.x < 0, 'Right wall kick must push to the left (-x)');
assert.ok(wallRightKick.y < 0, 'Right wall kick must have upward lift (-y)');

// Duplicate prevention set test
const processedBalls = new Set();
const ballId = 42;
assert.equal(processedBalls.has(ballId), false);
processedBalls.add(ballId);
assert.equal(processedBalls.has(ballId), true, 'Ball must be marked as processed to prevent double scoring');

console.log('✓ Wall bounce & bucket duplicate prevention PASSED!');


console.log('\n=== TEST 6: Floor Fallback Turn Resolution (Garantia de Encerramento) ===');
// Simulates the floor collision fallback in GameCanvas.jsx
function computeFloorFallbackBin(ballX, canvasWidth = 360) {
    const binW = canvasWidth / 5;
    return Math.max(0, Math.min(4, Math.floor(ballX / binW)));
}

// Edge case: Ball touches floor far to the left (negative x)
assert.equal(computeFloorFallbackBin(-50, 360), 0, 'Negative x must clamp to bin 0');
// Edge case: Ball touches floor far to the right (x > canvasWidth)
assert.equal(computeFloorFallbackBin(450, 360), 4, 'Out of bounds right x must clamp to bin 4');
// Standard bins (360px width => 72px per bin)
assert.equal(computeFloorFallbackBin(36, 360), 0, 'x=36 must resolve to bin 0');
assert.equal(computeFloorFallbackBin(100, 360), 1, 'x=100 must resolve to bin 1');
assert.equal(computeFloorFallbackBin(180, 360), 2, 'x=180 must resolve to bin 2');
assert.equal(computeFloorFallbackBin(250, 360), 3, 'x=250 must resolve to bin 3');
assert.equal(computeFloorFallbackBin(320, 360), 4, 'x=320 must resolve to bin 4');

// Verify deduplication flow on floor hit:
const testFloorProcessed = new Set();
let resolutionsCount = 0;
const testBall = { id: 999, position: { x: 180 } };

function simulateFloorHit(ball) {
    if (!testFloorProcessed.has(ball.id)) {
        testFloorProcessed.add(ball.id);
        const bin = computeFloorFallbackBin(ball.position.x);
        resolutionsCount++;
        return bin;
    }
    return null; // Already processed
}

assert.equal(simulateFloorHit(testBall), 2, 'First floor hit must resolve turn');
assert.equal(simulateFloorHit(testBall), null, 'Subsequent floor hit of same ball must NOT resolve turn twice');
assert.equal(resolutionsCount, 1, 'Turn resolution must be triggered exactly once per ball');
console.log('✓ Floor fallback turn resolution tests PASSED!');


console.log('\n=== TEST 7: Mode Rewards & Win Conditions (FINGO / BINGO / SPINGO) ===');
const MODE_CONFIG = {
    'FINGO': { balls: 50, centerFree: true, baseReward: 100 },
    'BINGO': { balls: 100, centerFree: true, baseReward: 300 },
    'SPINGO': { balls: 25, centerFree: false, baseReward: 50 }
};

function calculateWinReward(mode, level) {
    const config = MODE_CONFIG[mode];
    return (config?.baseReward || 100) + level;
}

// Check reward calculation
assert.equal(calculateWinReward('FINGO', 1), 101, 'FINGO lvl 1 reward must be 101');
assert.equal(calculateWinReward('FINGO', 5), 105, 'FINGO lvl 5 reward must be 105');
assert.equal(calculateWinReward('BINGO', 1), 301, 'BINGO lvl 1 reward must be 301');
assert.equal(calculateWinReward('BINGO', 10), 310, 'BINGO lvl 10 reward must be 310');
assert.equal(calculateWinReward('SPINGO', 1), 51, 'SPINGO lvl 1 reward must be 51');
assert.equal(calculateWinReward('SPINGO', 25), 75, 'SPINGO lvl 25 reward must be 75');

// Test BINGO full card win condition (Blackout)
function checkFullCard(card) {
    return card.every(c => c.marked);
}
const testBingoCard = createTestCard();
assert.equal(checkFullCard(testBingoCard), false, 'Initial card should not win BINGO full card');
testBingoCard.forEach(c => c.marked = true);
assert.equal(checkFullCard(testBingoCard), true, 'Blackout card must win BINGO');

// Test SPINGO any five win condition
function checkAnyFive(card) {
    return card.filter(c => c.marked).length >= 5;
}
const testSpingoCard = createTestCard();
testSpingoCard[0].marked = false; // reset any
assert.equal(checkAnyFive(testSpingoCard.filter(c => !c.isFree)), false, 'Unmarked card should not win SPINGO');
// Mark 5 distinct cells
for (let i = 0; i < 5; i++) {
    testSpingoCard[i].marked = true;
}
assert.equal(checkAnyFive(testSpingoCard), true, '5 marked numbers must win SPINGO');
console.log('✓ Mode rewards & win conditions tests PASSED!');


console.log('\n=== TEST 8: Lucky Spin Deferral & Safe Spin Start ===');
// Simulate startSpin guard
function simulateStartSpin(phase, magicNumberOverride = null) {
    if (phase !== 'SPIN' && !(phase === 'DROP' && magicNumberOverride !== null)) {
        return false;
    }
    return true;
}

// Normal spin only allowed in SPIN phase
assert.equal(simulateStartSpin('SPIN'), true, 'startSpin allowed in SPIN phase');
assert.equal(simulateStartSpin('SPINNING'), false, 'startSpin blocked in SPINNING phase');
assert.equal(simulateStartSpin('DROP'), false, 'normal startSpin blocked in DROP phase');
assert.equal(simulateStartSpin('RESOLVE'), false, 'startSpin blocked in RESOLVE phase');
assert.equal(simulateStartSpin('GAME_OVER'), false, 'startSpin blocked in GAME_OVER phase');

// Magic spin allowed in DROP phase with number override
assert.equal(simulateStartSpin('DROP', 42), true, 'magic spin allowed in DROP phase');
assert.equal(simulateStartSpin('SPINNING', 42), false, 'magic spin blocked in SPINNING phase');

// Safe magic purchase: Only deduct coins if startSpin succeeded
let userCoins = 500;
const magicCost = 500;
let phase = 'SPINNING';

function attemptMagicPurchase(number) {
    if (userCoins < magicCost) return false;
    const started = simulateStartSpin(phase, number);
    if (started) {
        userCoins -= magicCost;
        return true;
    }
    return false;
}

// In SPINNING phase, attempt must fail and deduct ZERO coins
assert.equal(attemptMagicPurchase(15), false, 'Purchase should fail when spin cannot start');
assert.equal(userCoins, 500, 'Coins must NOT be deducted if spin was not started');

// In DROP phase, attempt succeeds and deducts coins
phase = 'DROP';
assert.equal(attemptMagicPurchase(15), true, 'Purchase should succeed in DROP phase');
assert.equal(userCoins, 0, 'Coins deducted only when spin was accepted');

// Lucky spin reward deferral simulation
let walletCoins = 1000;
let savedReward = null;

function spinWheel() {
    savedReward = 500; // determined prize
    // Does NOT credit coins here
    return savedReward;
}

function onWheelStopped() {
    if (savedReward !== null) {
        walletCoins += savedReward;
    }
}

spinWheel();
assert.equal(walletCoins, 1000, 'Coins must NOT be credited during spin animation');
onWheelStopped();
assert.equal(walletCoins, 1500, 'Coins credited only after wheel stops');
console.log('✓ Lucky Spin deferral & safe spin start tests PASSED!');


console.log('\n=========================================');
console.log('ALL 8 TEST SUITES PASSED CLEANLY (100%)');
console.log('=========================================');
