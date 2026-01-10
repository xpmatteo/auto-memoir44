// ABOUTME: Tests for the score combiner function
// ABOUTME: Verifies weighted sum calculation with mock scorers

import { describe, expect, test } from "vitest";
import { combineScorers } from "../../../../src/ai/scoring/combineScorers";
import type { WeightedScorer } from "../../../../src/ai/scoring/types";
import { createTestGameState } from "../../../helpers/testHelpers";

describe("combineScorers", () => {
    interface CombineScorersCase {
        name: string;
        scorers: Array<{ value: number; weight: number }>;
        expected: number;
    }

    const cases: CombineScorersCase[] = [
        {
            name: "empty scorers array returns 0",
            scorers: [],
            expected: 0,
        },
        {
            name: "single scorer with weight 1.0",
            scorers: [{ value: 100, weight: 1.0 }],
            expected: 100,
        },
        {
            name: "single scorer with weight 2.0",
            scorers: [{ value: 100, weight: 2.0 }],
            expected: 200,
        },
        {
            name: "single scorer with weight 0.5",
            scorers: [{ value: 100, weight: 0.5 }],
            expected: 50,
        },
        {
            name: "two scorers with weight 1.0 each",
            scorers: [
                { value: 100, weight: 1.0 },
                { value: 50, weight: 1.0 },
            ],
            expected: 150,
        },
        {
            name: "two scorers with different weights",
            scorers: [
                { value: 100, weight: 1.0 },
                { value: 50, weight: 2.0 },
            ],
            expected: 200, // 100*1 + 50*2
        },
        {
            name: "scorer with weight 0 contributes nothing",
            scorers: [
                { value: 100, weight: 1.0 },
                { value: 1000, weight: 0 },
            ],
            expected: 100,
        },
        {
            name: "negative weights work correctly",
            scorers: [
                { value: 100, weight: 1.0 },
                { value: 50, weight: -1.0 },
            ],
            expected: 50, // 100*1 + 50*(-1) = 50
        },
        {
            name: "negative scores work correctly",
            scorers: [
                { value: -100, weight: 1.0 },
                { value: 50, weight: 1.0 },
            ],
            expected: -50,
        },
    ];

    test.each(cases)("$name", ({ scorers, expected }) => {
        const gameState = createTestGameState();

        const weightedScorers: WeightedScorer[] = scorers.map((s, i) => ({
            name: `mock-scorer-${i}`,
            fn: () => s.value,
            weight: s.weight,
        }));

        const result = combineScorers(gameState, weightedScorers);
        expect(result).toEqual(expected);
    });

    test("passes gameState to each scorer", () => {
        const gameState = createTestGameState();
        const receivedStates: unknown[] = [];

        const scorers: WeightedScorer[] = [
            {
                name: "state-capturing-scorer",
                fn: (gs) => {
                    receivedStates.push(gs);
                    return 0;
                },
                weight: 1.0,
            },
        ];

        combineScorers(gameState, scorers);

        expect(receivedStates.length).toBe(1);
        expect(receivedStates[0]).toBe(gameState);
    });

    test("passes context to each scorer", () => {
        const gameState = createTestGameState();
        const context = { someFlag: true };
        const receivedContexts: unknown[] = [];

        const scorers: WeightedScorer[] = [
            {
                name: "context-capturing-scorer",
                fn: (_gs, ctx) => {
                    receivedContexts.push(ctx);
                    return 0;
                },
                weight: 1.0,
            },
        ];

        combineScorers(gameState, scorers, context);

        expect(receivedContexts.length).toBe(1);
        expect(receivedContexts[0]).toBe(context);
    });
});
