// ABOUTME: Unit tests for MovePhase
// ABOUTME: Tests legal move generation for unit movement

import {describe, expect, test} from "vitest";
import {MovePhase} from "../../src/domain/phases/MovePhase";
import {MoveUnitMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import type {HexCoord} from "../../src/domain/HexCoord";

// Declare which methods from GameState we actually need to do our job
interface UnitMover {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    isUnitMoved(unit: Unit): boolean;
    getUnitAt(coord: HexCoord): Unit | undefined;
}

const unit1 = new Infantry(Side.ALLIES);
const unit2 = new Infantry(Side.ALLIES);
const unit3 = new Infantry(Side.ALLIES);

const fakeUnitMover: UnitMover = {
    orderedUnits: [] as Array<{ coord: HexCoord; unit: Unit }>,
    movedUnits: [] as Unit[],
    occupiedCoords: [] as HexCoord[],

    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }> {
        return this.orderedUnits;
    },

    isUnitMoved(unit: Unit): boolean {
        return this.movedUnits.includes(unit);
    },

    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.occupiedCoords.some(c => c.q === coord.q && c.r === coord.r)
            ? unit1 // Return some unit if occupied
            : undefined;
    }
};

describe("MovePhase", () => {
    test("With no ordered units, returns empty array", () => {
        fakeUnitMover.orderedUnits = [];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        expect(actual).toEqual([]);
    });

    test("Infantry can move 1 hex in any direction", () => {
        const startPos: HexCoord = {q: 5, r: 5};
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Infantry should be able to move to all 6 adjacent hexes
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 6, r: 5}));  // East
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 5, r: 6}));  // Southeast
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 4, r: 6}));  // Southwest
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 4, r: 5}));  // West
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 4, r: 4}));  // Northwest
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 5, r: 4}));  // Northeast
        expect(actual.length).toBeGreaterThanOrEqual(6);
    });

    test("Infantry can move 2 hexes", () => {
        const startPos: HexCoord = {q: 5, r: 5};
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Infantry should be able to move 2 hexes east
        expect(actual).toContainEqual(new MoveUnitMove(startPos, {q: 7, r: 5}));
        // Should have more than just the 6 adjacent hexes (1-hex moves)
        expect(actual.length).toBeGreaterThan(6);
    });

    test("Does not generate moves for units that already moved", () => {
        const startPos: HexCoord = {q: 5, r: 5};
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [unit1]; // Unit already moved
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        expect(actual).toEqual([]);
    });

    test("Generates moves for multiple ordered units", () => {
        const pos1: HexCoord = {q: 5, r: 5};
        const pos2: HexCoord = {q: 8, r: 8};
        fakeUnitMover.orderedUnits = [
            {coord: pos1, unit: unit1},
            {coord: pos2, unit: unit2}
        ];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Should have moves for both units
        const movesForUnit1 = actual.filter(m => m instanceof MoveUnitMove && m.from.q === 5 && m.from.r === 5);
        const movesForUnit2 = actual.filter(m => m instanceof MoveUnitMove && m.from.q === 8 && m.from.r === 8);

        expect(movesForUnit1.length).toBeGreaterThan(0);
        expect(movesForUnit2.length).toBeGreaterThan(0);
    });

    test("Does not generate moves to occupied hexes", () => {
        const startPos: HexCoord = {q: 5, r: 5};
        const blockedPos: HexCoord = {q: 6, r: 5}; // Hex to the east
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [blockedPos]; // Mark east hex as occupied
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Should not have a move to the occupied hex
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, blockedPos));
    });

    test("Cannot move through friendly units", () => {
        const startPos: HexCoord = {q: 5, r: 5};
        const blockingPos: HexCoord = {q: 6, r: 5}; // Hex to the east (adjacent)
        const beyondBlocker: HexCoord = {q: 7, r: 5}; // 2 hexes east (beyond blocker)

        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [blockingPos]; // Friendly unit blocking
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Should not be able to move to hex beyond the blocker
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, beyondBlocker));
        // Should also not be able to move to the blocking hex itself
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, blockingPos));
    });
});
