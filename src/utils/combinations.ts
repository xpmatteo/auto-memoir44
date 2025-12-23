// ABOUTME: Utility functions for generating combinations and cartesian products
// ABOUTME: Used by AI and command cards to enumerate possible unit orderings

/**
 * Generate all combinations of size k from array
 */
export function combinations<T>(array: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > array.length) return [];
    if (k === array.length) return [array];

    const result: T[][] = [];

    for (let i = 0; i <= array.length - k; i++) {
        const head = array[i];
        const tailCombs = combinations(array.slice(i + 1), k - 1);
        for (const tail of tailCombs) {
            result.push([head, ...tail]);
        }
    }

    return result;
}

/**
 * Generate all combinations from size 1 up to maxSize
 */
export function combinationsUpTo<T>(array: T[], maxSize: number): T[][] {
    const result: T[][] = [];
    const actualMaxSize = Math.min(maxSize, array.length);

    for (let size = 1; size <= actualMaxSize; size++) {
        result.push(...combinations(array, size));
    }

    return result;
}

/**
 * Generate cartesian product of arrays
 * Example: cartesianProduct([[1,2], [3,4]]) => [[1,3], [1,4], [2,3], [2,4]]
 */
export function cartesianProduct<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.some(arr => arr.length === 0)) return [];

    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);

    const result: T[][] = [];
    for (const item of first) {
        for (const restItems of restProduct) {
            result.push([item, ...restItems]);
        }
    }

    return result;
}
