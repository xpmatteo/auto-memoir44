// ABOUTME: Tests for the close-the-gap scoring function
// ABOUTME: Verifies scoring based on distance to nearest enemy

import { describe, expect, test } from "vitest";
import { closeTheGapScorer } from "../../../../src/ai/scoring/closeTheGapScorer";
import { createTestGameState } from "../../../helpers/testHelpers";
import { Infantry } from "../../../../src/domain/Unit";
import { Side } from "../../../../src/domain/Player";
import { HexCoord, hexDistance, hexOf } from "../../../../src/utils/hex";

describe("closeTheGapScorer", () => {
    interface CloseTheGapCase {
        name: string;
        friendlyUnits: Array<{ hex: HexCoord; ordered: boolean }>;
        enemies: Array<HexCoord>;
        expected: number;
    }

    const cases: CloseTheGapCase[] = [
        {
            name: "no ordered units - score is 0",
            friendlyUnits: [],
            enemies: [hexOf(5, 0)],
            expected: 0,
        },
        {
            name: "no enemies - score is 0",
            friendlyUnits: [{ hex: hexOf(0, 0), ordered: true }],
            enemies: [],
            expected: 0,
        },
        {
            name: "unordered unit - score is 0",
            friendlyUnits: [{ hex: hexOf(0, 0), ordered: false }],
            enemies: [hexOf(5, 0)],
            expected: 0,
        },
        {
            name: "unit adjacent to enemy (distance 1) - score is -100",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [hexOf(5, 0)],
            expected: -100,
        },
        {
            name: "unit 2 hexes from enemy - score is -200",
            friendlyUnits: [{ hex: hexOf(3, 0), ordered: true }],
            enemies: [hexOf(5, 0)],
            expected: -200,
        },
        {
            name: "unit 3 hexes from enemy - score is -300",
            friendlyUnits: [{ hex: hexOf(2, 0), ordered: true }],
            enemies: [hexOf(5, 0)],
            expected: -300,
        },
        {
            name: "unit uses nearest enemy distance",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [hexOf(5, 0), hexOf(10, 0)], // one close, one far
            expected: -100, // uses closer enemy
        },
        {
            name: "two ordered units sum their distances",
            friendlyUnits: [
                { hex: hexOf(4, 0), ordered: true }, // 1 hex from (5,0)
                { hex: hexOf(3, 0), ordered: true }, // 2 hexes from (5,0)
            ],
            enemies: [hexOf(5, 0)],
            expected: -300, // -100 + -200
        },
        {
            name: "mix of ordered and unordered - only ordered counts",
            friendlyUnits: [
                { hex: hexOf(4, 0), ordered: true },  // 1 hex from (5,0)
                { hex: hexOf(0, 0), ordered: false }, // 5 hexes, but not ordered
            ],
            enemies: [hexOf(5, 0)],
            expected: -100, // only the ordered unit counts
        },
    ];

    test.each(cases)("$name", ({ friendlyUnits, enemies, expected }) => {
        const gameState = createTestGameState();

        // Place and optionally order friendly units
        for (const { hex, ordered } of friendlyUnits) {
            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hex, unit);
            if (ordered) {
                gameState.orderUnit(unit);
            }
        }

        // Place enemy units
        for (const hex of enemies) {
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(hex, enemyUnit);
        }

        // Guard assertions for distance calculations
        if (friendlyUnits.length > 0 && enemies.length > 0 && friendlyUnits[0].ordered) {
            const actualDistance = hexDistance(friendlyUnits[0].hex, enemies[0]);
            expect(actualDistance).toBeGreaterThanOrEqual(0);
        }

        const score = closeTheGapScorer(gameState);
        expect(score).toEqual(expected);
    });

    test("works in non-battle phase", () => {
        // Unlike battleDiceScorer, closeTheGapScorer should work without battle phase
        const gameState = createTestGameState();

        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(hexOf(4, 0), unit);
        gameState.orderUnit(unit);

        const enemy = new Infantry(Side.AXIS);
        gameState.placeUnit(hexOf(5, 0), enemy);

        // Should not throw - no battle phase required
        expect(() => closeTheGapScorer(gameState)).not.toThrow();
    });
});
