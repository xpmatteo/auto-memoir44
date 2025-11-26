// ABOUTME: Unit tests for Dice class
// ABOUTME: Tests dice rolling and cloning

import {describe, expect, it} from "vitest";
import {Dice} from "../../src/domain/Dice";

describe("Dice", () => {
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
    });
});
