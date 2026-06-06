
/**
 * Linearly interpolates between two values.
 * @param {number} start - The start value.
 * @param {number} end - The end value.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 */
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Calculates the probabilities for generating 1, 2, or 3 numbers based on the current level.
 * Performs a linear interpolation (Lerp) from Level 1 to Level 250.
 * 
 * Level 1:
 * 1 Number: 34%
 * 2 Numbers: 33%
 * 3 Numbers: 33%
 * 
 * Level 250 (and above):
 * 1 Number: 95%
 * 2 Numbers: 4%
 * 3 Numbers: 1%
 * 
 * @param {number} currentLevel - The current game level.
 * @returns {Object} An object containing the probabilities { p1, p2, p3 }.
 */
export function calculateProbabilities(currentLevel) {
    // Clamp level to max 250 for calculation
    const effectiveLevel = Math.min(Math.max(currentLevel, 1), 250);
    const maxLevel = 250;

    // Calculate t (0.0 at level 1, 1.0 at level 250)
    const t = (effectiveLevel - 1) / (maxLevel - 1);

    const p1 = lerp(0.34, 0.95, t);
    const p2 = lerp(0.33, 0.04, t);
    const p3 = lerp(0.33, 0.01, t);

    return {
        one: p1,
        two: p2,
        three: p3
    };
}
