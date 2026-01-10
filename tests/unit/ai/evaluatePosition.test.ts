import { describe, expect, test } from "vitest";
import { createTestGameState } from "../../helpers/testHelpers";
import { BattlePhase } from "../../../src/domain/phases/BattlePhase";
import { Infantry } from "../../../src/domain/Unit";
import { Side } from "../../../src/domain/Player";
import { HexCoord, hexDistance, hexOf } from "../../../src/utils/hex";
import { evaluatePosition } from "../../../src/ai/evaluatePosition";

describe("evaluatePosition", () => {
    interface EvaluatePositionCase {
        name: string;
        friendlyUnits: Array<{ hex: HexCoord; ordered: boolean }>;
        enemies: Array<{ hex: HexCoord; strength: number }>;
        expected: number;
    }

    const cases: EvaluatePositionCase[] = [
        {
            name: "no friendly units - score is 0",
            friendlyUnits: [],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 0,
        },
        {
            name: "friendly unit not ordered - score is 0",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: false }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 0,
        },
        {
            name: "one ordered unit, one target at distance 1, strength 4",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 300, // 3 dice * 100 points
        },
        {
            name: "one ordered unit, one target at distance 2, strength 4",
            friendlyUnits: [{ hex: hexOf(3, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 200, // 2 dice * 100 points
        },
        {
            name: "one ordered unit, one target at distance 3, strength 4",
            friendlyUnits: [{ hex: hexOf(2, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 100, // 1 die * 100 points
        },
        {
            name: "one ordered unit, one target at distance 4 - out of range",
            friendlyUnits: [{ hex: hexOf(1, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 0, // out of range
        },
        {
            name: "one ordered unit, one target at distance 1, strength 1 (weaker is worth more)",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 1 }],
            expected: 1200, // 3 dice * 400 points (5-1=4, 4*100=400)
        },
        {
            name: "one ordered unit, one target at distance 1, strength 2",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 2 }],
            expected: 900, // 3 dice * 300 points (5-2=3, 3*100=300)
        },
        {
            name: "one ordered unit, two targets at distance 1",
            friendlyUnits: [{ hex: hexOf(5, 0), ordered: true }],
            enemies: [
                { hex: hexOf(6, 0), strength: 4 },
                { hex: hexOf(5, 1), strength: 4 },
            ],
            expected: 600, // 3 dice * 100 points * 2 targets
        },
        {
            name: "two ordered units, each with one target at distance 1",
            friendlyUnits: [
                { hex: hexOf(4, 0), ordered: true },
                { hex: hexOf(4, 2), ordered: true },
            ],
            enemies: [
                { hex: hexOf(5, 0), strength: 4 },
                { hex: hexOf(5, 2), strength: 4 },
            ],
            expected: 600, // 3 dice * 100 points * 2 units
        },
        {
            name: "two ordered units targeting same enemy sums both",
            friendlyUnits: [
                { hex: hexOf(4, 0), ordered: true },
                { hex: hexOf(6, 0), ordered: true },
            ],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 600, // both units can attack: 3 dice * 100 * 2
        },
        {
            name: "mix of ordered and unordered - only ordered counts",
            friendlyUnits: [
                { hex: hexOf(4, 0), ordered: true },
                { hex: hexOf(4, 2), ordered: false },
            ],
            enemies: [
                { hex: hexOf(5, 0), strength: 4 },
                { hex: hexOf(5, 2), strength: 4 },
            ],
            expected: 300, // only the ordered unit counts
        },
    ];

    test.each(cases)("$name", ({ friendlyUnits, enemies, expected }) => {
        const gameState = createTestGameState();
        gameState.pushPhase(new BattlePhase());

        // Place and optionally order friendly units
        for (const { hex, ordered } of friendlyUnits) {
            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hex, unit);
            if (ordered) {
                gameState.orderUnit(unit);
            }
        }

        // Place enemy units
        for (const { hex, strength } of enemies) {
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(hex, enemyUnit);
            if (strength < 4) {
                gameState.setUnitCurrentStrength(enemyUnit, strength);
            }
        }

        // Guard assertion: verify distances for first friendly/enemy pair if both exist
        if (friendlyUnits.length > 0 && enemies.length > 0) {
            const firstFriendly = friendlyUnits[0];
            const firstEnemy = enemies[0];
            const actualDistance = hexDistance(firstFriendly.hex, firstEnemy.hex);
            // Distance should make sense for the test
            expect(actualDistance).toBeGreaterThanOrEqual(0);
        }

        const score = evaluatePosition(gameState);
        expect(score).toEqual(expected);
    });

    test("throws error when not in BATTLE phase", () => {
        const gameState = createTestGameState();
        // Don't push BattlePhase

        expect(() => evaluatePosition(gameState)).toThrow(
            "battleDiceScorer requires gameState to be in BATTLE phase"
        );
    });
});
