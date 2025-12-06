// ABOUTME: Unit tests for RetreatMove class
// ABOUTME: Tests that RetreatMove correctly delegates to moveUnit and popPhase

import {beforeEach, describe, expect, it} from "vitest";
import {Infantry} from "../../src/domain/Unit";
import {HexCoord} from "../../src/utils/hex";
import {Side} from "../../src/domain/Player";
import {RetreatMove} from "../../src/domain/moves/Move";
import {RetreatPhase} from "../../src/domain/phases/RetreatPhase";

describe("RetreatMove", () => {
    let moveUnitCalls: Array<{ from: HexCoord; to: HexCoord }>;
    let popPhaseCalled: boolean;
    let mockRetreater: { moveUnit: (from: HexCoord, to: HexCoord) => void; popPhase: () => void };
    let unit: Infantry;

    beforeEach(() => {
        moveUnitCalls = [];
        popPhaseCalled = false;
        mockRetreater = {
            moveUnit: (from: HexCoord, to: HexCoord) => {
                moveUnitCalls.push({ from, to });
            },
            popPhase: () => {
                popPhaseCalled = true;
            }
        };
        unit = new Infantry(Side.AXIS, 3);
    });

    it("should call moveUnit and popPhase when retreating to different hex", () => {
        const from = new HexCoord(5, 3);
        const to = new HexCoord(5, 2);

        new RetreatMove(unit, from, to).executeRetreat(mockRetreater);

        expect(moveUnitCalls).toHaveLength(1);
        expect(moveUnitCalls[0]).toEqual({ from, to });
        expect(popPhaseCalled).toBe(true);
    });

    it("should not call moveUnit when staying in place (ignoring flag)", () => {
        const coord = new HexCoord(5, 3);

        new RetreatMove(unit, coord, coord).executeRetreat(mockRetreater);

        expect(moveUnitCalls).toHaveLength(0);
        expect(popPhaseCalled).toBe(true);
    });

    it("should always call popPhase regardless of movement", () => {
        new RetreatMove(unit, new HexCoord(5, 3), new HexCoord(5, 2)).executeRetreat(mockRetreater);
        expect(popPhaseCalled).toBe(true);

        popPhaseCalled = false;
        new RetreatMove(unit, new HexCoord(5, 3), new HexCoord(5, 3)).executeRetreat(mockRetreater);
        expect(popPhaseCalled).toBe(true);
    });
});

describe("RetreatPhase", () => {
    let unit: Infantry;
    let currentPos: HexCoord;
    let availableHexes: HexCoord[];

    beforeEach(() => {
        unit = new Infantry(Side.AXIS);
        currentPos = new HexCoord(5, 3);
        availableHexes = [new HexCoord(5, 2), new HexCoord(6, 2)];
    });

    it("should have temporaryPlayerSwitch enabled", () => {
        const phase = new RetreatPhase(unit, currentPos, availableHexes);

        expect(phase.temporaryPlayerSwitch).toBe(true);
    });

    it("should return RetreatMove for each available hex", () => {
        const phase = new RetreatPhase(unit, currentPos, availableHexes);
        const moves = phase.legalMoves({} as any); // Phase doesn't use gameState

        expect(moves).toHaveLength(2);
        expect(moves[0]).toBeInstanceOf(RetreatMove);
        expect(moves[1]).toBeInstanceOf(RetreatMove);

        const move0 = moves[0] as RetreatMove;
        const move1 = moves[1] as RetreatMove;

        expect(move0.unit).toBe(unit);
        expect(move0.from).toEqual(currentPos);
        expect(move0.to).toEqual(availableHexes[0]);

        expect(move1.unit).toBe(unit);
        expect(move1.from).toEqual(currentPos);
        expect(move1.to).toEqual(availableHexes[1]);
    });
});
