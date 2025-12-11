// ABOUTME: Unit tests for Dice class
// ABOUTME: Tests dice rolling and cloning

import {describe, expect, it} from "vitest";
import {Dice, RESULT_INFANTRY, RESULT_ARMOR, RESULT_GRENADE, RESULT_STAR, RESULT_FLAG} from "../../src/domain/Dice";

describe("Dice", () => {
    describe("customizable dice faces", () => {
        it("should use default faces when none provided", () => {
            const rng = () => 0.0; // Always return first face
            const dice = new Dice(rng);

            const results = dice.roll(1);

            expect(results[0]).toBe(RESULT_INFANTRY); // First face in default is INF
        });

        it("should use custom faces when provided", () => {
            const customFaces = [RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR];
            const rng = () => 0.5; // Any value should return STAR
            const dice = new Dice(rng, customFaces);

            const results = dice.roll(3);

            expect(results).toHaveLength(3);
            expect(results[0]).toBe(RESULT_STAR);
            expect(results[1]).toBe(RESULT_STAR);
            expect(results[2]).toBe(RESULT_STAR);
        });

        it("should correctly select from custom distribution", () => {
            const customFaces = [RESULT_GRENADE, RESULT_ARMOR];
            const rngValues = [0.0, 0.49, 0.5, 0.99]; // First two select index 0, last two select index 1
            let rngIndex = 0;
            const rng = () => rngValues[rngIndex++];
            const dice = new Dice(rng, customFaces);

            const roll1 = dice.roll(1);
            const roll2 = dice.roll(1);
            const roll3 = dice.roll(1);
            const roll4 = dice.roll(1);

            expect(roll1[0]).toBe(RESULT_GRENADE);
            expect(roll2[0]).toBe(RESULT_GRENADE);
            expect(roll3[0]).toBe(RESULT_ARMOR);
            expect(roll4[0]).toBe(RESULT_ARMOR);
        });

        it("should handle custom faces with different lengths", () => {
            const customFaces = [RESULT_FLAG, RESULT_FLAG, RESULT_FLAG, RESULT_INFANTRY]; // 4 faces
            const rng = () => 0.75; // Should select index 3 (INFANTRY)
            const dice = new Dice(rng, customFaces);

            const results = dice.roll(1);

            expect(results[0]).toBe(RESULT_INFANTRY);
        });

        it("should never return undefined results with custom faces", () => {
            const customFaces = [RESULT_FLAG, RESULT_STAR, RESULT_GRENADE];
            const dice = new Dice(Math.random, customFaces);

            // Roll many times to test various RNG values
            for (let i = 0; i < 100; i++) {
                const results = dice.roll(6);

                expect(results).toHaveLength(6);

                // Verify no result is undefined
                results.forEach((result) => {
                    expect(result).toBeDefined();
                    expect(result.name).toBeDefined();
                    expect(typeof result.name).toBe('string');
                    // Verify result is one of the custom faces
                    expect(customFaces).toContain(result);
                });
            }
        });

        it("should work with all FLAGS distribution", () => {
            const allFlagFaces = [RESULT_FLAG, RESULT_FLAG, RESULT_FLAG, RESULT_FLAG, RESULT_FLAG, RESULT_FLAG];
            const dice = new Dice(Math.random, allFlagFaces);

            const results = dice.roll(10);

            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result).toBe(RESULT_FLAG);
                expect(result.name).toBe('FLAG');
            });
        });
    });

    describe("clone", () => {
        it("should share the same RNG function reference", () => {
            let callCount = 0;
            const rng = () => {
                callCount++;
                return 0.5;
            };
            const dice = new Dice(rng);

            const cloned = dice.clone();

            // Roll on original
            dice.roll(1);
            expect(callCount).toBe(1);

            // Roll on clone - should use same RNG
            cloned.roll(1);
            expect(callCount).toBe(2);
        });

        it("should produce consistent sequence of rolls across original and clone", () => {
            const values = [0.1, 0.3, 0.5, 0.7, 0.9];
            let index = 0;
            const rng = () => values[index++];

            const dice = new Dice(rng);
            const cloned = dice.clone();

            // Roll on original
            const roll1 = dice.roll(1);
            // Roll on clone
            const roll2 = cloned.roll(1);
            // Roll on original again
            const roll3 = dice.roll(1);

            // All three rolls should use the shared RNG in sequence
            expect(roll1.length).toBe(1);
            expect(roll2.length).toBe(1);
            expect(roll3.length).toBe(1);
            // RNG should have been called 3 times total
            expect(index).toBe(3);
        });

        it("should work with default Math.random RNG", () => {
            const dice = new Dice();
            const cloned = dice.clone();

            // Both should be able to roll
            const roll1 = dice.roll(2);
            const roll2 = cloned.roll(2);

            expect(roll1.length).toBe(2);
            expect(roll2.length).toBe(2);
        });

        it("should preserve custom faces when cloning", () => {
            const customFaces = [RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_STAR];
            const rng = () => 0.5;
            const dice = new Dice(rng, customFaces);

            const cloned = dice.clone();
            const results = cloned.roll(2);

            expect(results).toHaveLength(2);
            expect(results[0]).toBe(RESULT_STAR);
            expect(results[1]).toBe(RESULT_STAR);
        });
    });
});
