// ABOUTME: Unit tests for ST02 scenario unit setup parser
// ABOUTME: Validates parsing of ASCII unit layout strings into board positions

import {describe, it, expect} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {ST02Scenario} from "../../../src/scenarios/ST02";
import {HexCoord} from "../../../src/utils/hex";
import {Side} from "../../../src/domain/Player";
import {Deck} from "../../../src/domain/Deck";

describe("ST02Scenario unitSetup parser", () => {
    it("should parse and place all units from unitSetup constant", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const scenario = new ST02Scenario();

        scenario.setup(gameState);

        // Verified positions from parser output:
        // Axis units: (0,0), (1,0), (11,0), (12,0), (0,1), (10,1), (11,1), (-1,2), (9,2), (4,4)
        expect(gameState.getUnitAt(new HexCoord(0, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(1, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(11, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(12, 0))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(0, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(10, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(11, 1))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(-1, 2))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(9, 2))?.side).toBe(Side.AXIS);
        expect(gameState.getUnitAt(new HexCoord(4, 4))?.side).toBe(Side.AXIS);

        // Allies units: (-1,5), (3,6), (4,7), (7,7), (0,8), (3,8)
        expect(gameState.getUnitAt(new HexCoord(-1, 5))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(new HexCoord(3, 6))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(new HexCoord(4, 7))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(new HexCoord(7, 7))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(new HexCoord(0, 8))?.side).toBe(Side.ALLIES);
        expect(gameState.getUnitAt(new HexCoord(3, 8))?.side).toBe(Side.ALLIES);

        // Verify some empty hexes
        expect(gameState.getUnitAt(new HexCoord(2, 0))).toBeUndefined();
        expect(gameState.getUnitAt(new HexCoord(5, 5))).toBeUndefined();
    });

    it("should correctly count total units and print positions", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const scenario = new ST02Scenario();

        scenario.setup(gameState);

        // Count all units and print their positions
        let axisCount = 0;
        let alliesCount = 0;
        const axisPositions: string[] = [];
        const alliesPositions: string[] = [];

        for (let r = 0; r <= 8; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;
            for (let q = colStart; q < colStart + numCols; q++) {
                const unit = gameState.getUnitAt(new HexCoord(q, r));
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

        // Verify counts match unitSetup constant
        // Axis: (0,0), (1,0), (11,0), (12,0), (0,1), (10,1), (11,1), (-1,2), (9,2), (4,4) = 10 units
        // Allies: (-1,5), (3,6), (4,7), (7,7), (0,8), (3,8) = 6 units
        expect(axisCount).toBe(10);
        expect(alliesCount).toBe(6);
    });
});
