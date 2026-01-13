// ABOUTME: Unit tests for permutation generation utility

import {expect, test, describe} from "vitest";
import {generatePermutations} from "../../../src/utils/permutations";

describe("generatePermutations", () => {
    interface PermCase {
        name: string;
        input: number[];
        want: number[][];
    }

    const cases: PermCase[] = [
        {
            name: "empty array",
            input: [],
            want: [[]],
        },
        {
            name: "single element",
            input: [1],
            want: [[1]],
        },
        {
            name: "two elements",
            input: [1, 2],
            want: [[1, 2], [2, 1]],
        },
        {
            name: "three elements",
            input: [1, 2, 3],
            want: [
                [1, 2, 3],
                [1, 3, 2],
                [2, 1, 3],
                [2, 3, 1],
                [3, 1, 2],
                [3, 2, 1],
            ],
        },
    ];

    test.each(cases)("$name", ({input, want}) => {
        const got = generatePermutations(input);

        // Check that we have the right number of permutations
        expect(got.length).toBe(want.length);

        // Check that each expected permutation is present
        for (const expectedPerm of want) {
            const found = got.some(perm =>
                perm.length === expectedPerm.length &&
                perm.every((val, idx) => val === expectedPerm[idx])
            );
            expect(found).toBe(true);
        }
    });

    test("generates correct number of permutations", () => {
        // n! permutations for n elements
        const factorial = (n: number): number => {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
        };

        for (let n = 0; n <= 5; n++) {
            const input = Array.from({length: n}, (_, i) => i);
            const perms = generatePermutations(input);
            expect(perms.length).toBe(factorial(n));
        }
    });

    test("all permutations are unique", () => {
        const input = [1, 2, 3, 4];
        const perms = generatePermutations(input);

        // Convert each permutation to a string for easy comparison
        const permStrings = perms.map(p => JSON.stringify(p));
        const uniquePermStrings = new Set(permStrings);

        expect(uniquePermStrings.size).toBe(perms.length);
    });
});
