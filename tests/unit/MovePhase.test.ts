// ABOUTME: Unit tests for MovePhase
// ABOUTME: Tests legal move generation for unit movement

import {describe, expect, test} from "vitest";
import {MovePhase} from "../../src/domain/phases/MovePhase";
import {EndMovementsMove, MoveUnitMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";

const unit1 = new Infantry(Side.ALLIES);
const unit2 = new Infantry(Side.ALLIES);

const fakeUnitMover = {
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

        expect(actual).toEqual([new EndMovementsMove()]);
    });

    test("Infantry can move 2 hexes in any direction", () => {
        const startPos: HexCoord = new HexCoord(5, 5);
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Sort function for comparing moves
        const sortMoves = (moves: any[]) => moves.sort((a, b) => {
            if (a instanceof EndMovementsMove) return 1;
            if (b instanceof EndMovementsMove) return -1;
            const aKey = `${a.from.q},${a.from.r}->${a.to.q},${a.to.r}`;
            const bKey = `${b.from.q},${b.from.r}->${b.to.q},${b.to.r}`;
            return aKey.localeCompare(bKey);
        });

        const expected = [
            // six surrounding hexes
            new MoveUnitMove(startPos, startPos.east()),
            new MoveUnitMove(startPos, startPos.southeast()),
            new MoveUnitMove(startPos, startPos.southwest()),
            new MoveUnitMove(startPos, startPos.west()),
            new MoveUnitMove(startPos, startPos.northwest()),
            new MoveUnitMove(startPos, startPos.northeast()),

            // move 2 hexes on the right side
            new MoveUnitMove(startPos, startPos.northeast().northeast()),
            new MoveUnitMove(startPos, startPos.northeast().east()),
            new MoveUnitMove(startPos, startPos.east().east()),
            new MoveUnitMove(startPos, startPos.southeast().east()),
            new MoveUnitMove(startPos, startPos.southeast().southeast()),

            // move 2 hexes down
            new MoveUnitMove(startPos, startPos.southeast().southwest()),

            // move 2 hexes left side
            new MoveUnitMove(startPos, startPos.northwest().northwest()),
            new MoveUnitMove(startPos, startPos.northwest().west()),
            new MoveUnitMove(startPos, startPos.west().west()),
            new MoveUnitMove(startPos, startPos.southwest().west()),
            new MoveUnitMove(startPos, startPos.southwest().southwest()),

            // move 2 hexes top
            new MoveUnitMove(startPos, startPos.northeast().northwest()),

            new EndMovementsMove(),
        ];

        // Infantry should be able to move to all 6 adjacent hexes
        expect(sortMoves(actual)).toEqual(sortMoves(expected));
    });

    test("Does not generate moves for units that already moved", () => {
        const startPos= new HexCoord(5, 5);
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [unit1]; // Unit already moved
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        expect(actual).toEqual([new EndMovementsMove()]);
    });

    test("Generates moves for multiple ordered units", () => {
        const pos1 = new HexCoord(5, 5);
        const pos2 = new HexCoord(8, 8);
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
        const startPos= new HexCoord(5, 5);
        const blockedPos = new HexCoord(6, 5); // Hex to the east
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [blockedPos]; // Mark east hex as occupied
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Should not have a move to the occupied hex
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, blockedPos));
    });

    test("Cannot move through friendly units", () => {
        const startPos= new HexCoord(5, 5);
        const blockingPos = new HexCoord(6, 5); // Hex to the east (adjacent)
        const beyondBlocker = new HexCoord(7, 5); // 2 hexes east (beyond blocker)

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


    test("Does not generate moves to off-board hexes", () => {
        const startPos= new HexCoord(-2, 7);
        fakeUnitMover.orderedUnits = [{coord: startPos, unit: unit1}];
        fakeUnitMover.movedUnits = [];
        fakeUnitMover.occupiedCoords = [];
        const phase = new MovePhase();

        let actual = phase.doLegalMoves(fakeUnitMover);

        // Should not have a move to the off-board hexes
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, startPos.west().west()));
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, startPos.southwest().southwest()));
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, startPos.southwest().southeast()));
        expect(actual).not.toContainEqual(new MoveUnitMove(startPos, startPos.southeast().southeast()));
    });

});
