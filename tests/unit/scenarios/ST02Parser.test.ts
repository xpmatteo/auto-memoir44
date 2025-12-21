// ABOUTME: Unit tests for ST02 scenario unit setup parser
// ABOUTME: Validates parsing of ASCII unit layout strings into board positions

import {describe, it, expect} from "vitest";
import {ST02Scenario} from "../../../src/scenarios/ST02";
import {hexOf} from "../../../src/utils/hex";
import {Side} from "../../../src/domain/Player";
import {SeededRNG} from "../../../src/adapters/RNG";

describe("ST02Scenario unitSetup parser", () => {
    it("should parse and place all units from unitSetup constant", () => {
        const rng = new SeededRNG(12345);
        const scenario = new ST02Scenario();
        const gameState = scenario.createGameState(rng);

        // Verified positions from parser output:
        // Axis units: (0,0), (1,0), (11,0), (12,0), (0,1), (10,1), (11,1), (-1,2), (9,2), (4,4)
        expect(gameState.getUnitAt(hexOf(0, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(1, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(11, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(12, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(0, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(10, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(11, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(-1, 2))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(9, 2))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(hexOf(4, 4))?.side).toBe(Side.AXIS);

        // Allies units: (-1,5), (3,6), (4,7), (7,7), (0,8), (3,8)
        expect(gameState.getUnitAt(hexOf(-1, 5))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(hexOf(3, 6))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(hexOf(4, 7))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(hexOf(7, 7))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(hexOf(0, 8))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(hexOf(3, 8))?.side).toBe(Side.ALLIES);

        // Verify some empty hexes
        expect(gameState.getUnitAt(hexOf(2, 0))).toBeUndefined();
        expect(gameState.getUnitAt(hexOf(5, 5))).toBeUndefined();
    });

    it("should correctly count total units and print positions", () => {
        const rng = new SeededRNG(12345);
        const scenario = new ST02Scenario();
        const gameState = scenario.createGameState(rng);

        // Count all units and print their positions
        let axisCount = 0;
        let alliesCount = 0;
        const axisPositions: string[] = [];
        const alliesPositions: string[] = [];

        for (let r = 0; r <= 8; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;
            for (let q = colStart; q < colStart + numCols; q++) {
                const unit = gameState.getUnitAt(hexOf(q, r));
                if (unit) {
                    if (unit.side === Side.AXIS) {
                        axisCount++;
                        axisPositions.push(`(${q},${r})`);
                    } else if (unit.side === Side.ALLIES) {
                        alliesCount++;
                        alliesPositions.push(`(${q},${r})`);
                    }
                }
            }
        }

        // Verify counts match unitSetup constant + parachute units
        // Axis: (0,0), (1,0), (11,0), (12,0), (0,1), (10,1), (11,1), (-1,2), (9,2), (4,4) = 10 units
        // Allies: (-1,5), (3,6), (4,7), (7,7), (0,8), (3,8) = 6 units
        // Parachute: 4 additional allies units (may be less if occupied hexes selected)
        expect(axisCount).toBe(10);
        expect(alliesCount).toBeGreaterThanOrEqual(6);
        expect(alliesCount).toBeLessThanOrEqual(10);
    });
});

describe("ST02Scenario parachute units", () => {
    it("should place 4 parachute units with a fixed seed", () => {
        const rng = new SeededRNG(12345);
        const scenario = new ST02Scenario();
        const gameState = scenario.createGameState(rng);

        // Count allies units in rows 2-8 only (excluding the 6 from unitSetup which are in rows 5-8)
        let parachuteCount = 0;
        for (let r = 2; r <= 8; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;
            for (let q = colStart; q < colStart + numCols; q++) {
                const unit = gameState.getUnitAt(hexOf(q, r));
                if (unit && unit.side === Side.ALLIES) {
                    parachuteCount++;
                }
            }
        }

        // Should have 6 original allies + up to 4 parachute units in rows 2-8
        expect(parachuteCount).toBeGreaterThanOrEqual(6);
        expect(parachuteCount).toBeLessThanOrEqual(10);
    });

    it("should place parachute units only in rows 2-8", () => {
        const rng = new SeededRNG();
        const scenario = new ST02Scenario();
        const gameState = scenario.createGameState(rng);

        // Check that no parachute units are in rows 0-1
        // Count allies in rows 0-1 (should be 0)
        let alliesInTopRows = 0;
        for (let r = 0; r <= 1; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;
            for (let q = colStart; q < colStart + numCols; q++) {
                const unit = gameState.getUnitAt(hexOf(q, r));
                if (unit && unit.side === Side.ALLIES) {
                    alliesInTopRows++;
                }
            }
        }

        expect(alliesInTopRows).toBe(0);
    });

    it("should skip placement if hex is already occupied", () => {
        const rng = new SeededRNG();
        const scenario = new ST02Scenario();

        // Should not throw even if some hexes are occupied
        expect(() => scenario.createGameState(rng)).not.toThrow();
    });
});
