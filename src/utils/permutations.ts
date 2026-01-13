// ABOUTME: Utility functions for generating permutations of arrays

/**
 * Generate all permutations of an array
 * @param items Array of items to permute
 * @returns Array of all possible permutations
 *
 * @example
 * generatePermutations([1, 2, 3]) returns:
 * [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
 */
export function generatePermutations<T>(items: T[]): T[][] {
    if (items.length === 0) {
        return [[]];
    }

    if (items.length === 1) {
        return [[items[0]]];
    }

    const result: T[][] = [];

    for (let i = 0; i < items.length; i++) {
        const current = items[i];
        const remaining = [...items.slice(0, i), ...items.slice(i + 1)];
        const remainingPerms = generatePermutations(remaining);

        for (const perm of remainingPerms) {
            result.push([current, ...perm]);
        }
    }

    return result;
}
