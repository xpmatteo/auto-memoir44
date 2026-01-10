// ABOUTME: Tests for the battle dice scoring function
// ABOUTME: Verifies scoring based on dice count and target strength

import { describe, expect, test } from "vitest";
import { battleDiceScorer } from "../../../../src/ai/scoring/battleDiceScorer";
import { createTestGameState } from "../../../helpers/testHelpers";
import { BattlePhase } from "../../../../src/domain/phases/BattlePhase";
import { Infantry } from "../../../../src/domain/Unit";
import { Side } from "../../../../src/domain/Player";
import { HexCoord, hexOf } from "../../../../src/utils/hex";

describe("battleDiceScorer", () => {
    interface BattleDiceScorerCase {
        name: string;
        friendlyUnits: Array<{ hex: HexCoord; ordered: boolean }>;
        enemies: Array<{ hex: HexCoord; strength: number }>;
        expected: number;
    }

    const cases: BattleDiceScorerCase[] = [
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
            name: "one ordered unit, one target at distance 1, strength 1 (weaker worth more)",
            friendlyUnits: [{ hex: hexOf(4, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 1 }],
            expected: 1200, // 3 dice * 400 points (5-1=4, 4*100=400)
        },
        {
            name: "one ordered unit, one target out of range",
            friendlyUnits: [{ hex: hexOf(1, 0), ordered: true }],
            enemies: [{ hex: hexOf(5, 0), strength: 4 }],
            expected: 0,
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
    ];

    test.each(cases)("$name", ({ friendlyUnits, enemies, expected }) => {
        const gameState = createTestGameState();
        gameState.pushPhase(new BattlePhase());

        for (const { hex, ordered } of friendlyUnits) {
            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hex, unit);
            if (ordered) {
                gameState.orderUnit(unit);
            }
        }

        for (const { hex, strength } of enemies) {
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(hex, enemyUnit);
            if (strength < 4) {
                gameState.setUnitCurrentStrength(enemyUnit, strength);
            }
        }

        const score = battleDiceScorer(gameState);
        expect(score).toEqual(expected);
    });

    test("throws error when not in BATTLE phase", () => {
        const gameState = createTestGameState();

        expect(() => battleDiceScorer(gameState)).toThrow(
            "battleDiceScorer requires gameState to be in BATTLE phase"
        );
    });
});
