// ABOUTME: Tests for the scoring system type definitions
// ABOUTME: Verifies types can be instantiated and used correctly

import { describe, expect, test } from "vitest";
import type { ScoringContext, ScoringFunction, WeightedScorer } from "../../../../src/ai/scoring/types";
import { createTestGameState } from "../../../helpers/testHelpers";

describe("scoring types", () => {
    test("ScoringFunction can be defined and called", () => {
        const mockScorer: ScoringFunction = (gameState, _context) => {
            // Simple mock that returns number of units
            return gameState.getAllUnits().length;
        };

        const gameState = createTestGameState();
        const score = mockScorer(gameState);

        expect(typeof score).toBe("number");
    });

    test("ScoringFunction can use optional context", () => {
        const mockScorer: ScoringFunction = (_gameState, context) => {
            // Context is optional, should not throw if undefined
            return context ? 100 : 50;
        };

        const gameState = createTestGameState();
        const context: ScoringContext = {};

        expect(mockScorer(gameState)).toBe(50);
        expect(mockScorer(gameState, context)).toBe(100);
    });

    test("WeightedScorer can be instantiated", () => {
        const mockFn: ScoringFunction = () => 42;

        const weightedScorer: WeightedScorer = {
            name: "test-scorer",
            fn: mockFn,
            weight: 1.5,
        };

        expect(weightedScorer.name).toBe("test-scorer");
        expect(weightedScorer.weight).toBe(1.5);
        expect(weightedScorer.fn(createTestGameState())).toBe(42);
    });

    test("multiple WeightedScorers can be combined in an array", () => {
        const scorers: WeightedScorer[] = [
            { name: "scorer-a", fn: () => 10, weight: 1.0 },
            { name: "scorer-b", fn: () => 20, weight: 2.0 },
        ];

        expect(scorers.length).toBe(2);
        expect(scorers[0].name).toBe("scorer-a");
        expect(scorers[1].name).toBe("scorer-b");
    });
});
