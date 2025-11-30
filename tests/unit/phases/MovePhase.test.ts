// ABOUTME: Unit tests for MovePhase
// ABOUTME: Tests legal move generation for unit movement

import {describe, expect, test} from "vitest";
import {MovePhase} from "../../../src/domain/phases/MovePhase";
import {EndMovementsMove, Move, MoveUnitMove} from "../../../src/domain/Move";
import {Infantry, Unit, UnitState} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";
import {clearTerrain, Terrain, woodsTerrain, hedgerowsTerrain, hillTerrain, TownTerrain} from "../../../src/domain/terrain/Terrain";

class FakeUnitMover {
    units = [] as Array<{ coord: HexCoord; unit: Unit; unitState: UnitState; terrain: Terrain }>;
    occupiedCoords = [] as HexCoord[];
    terrains = new Map<string, Terrain>();  // Terrain storage

    setOrderedUnits(units: Array<{ coord: HexCoord; unit: Unit }>): FakeUnitMover {
        this.units = units.map(({coord, unit}) => ({
            coord,
            unit,
            unitState: new UnitState(unit.initialStrength),
            terrain: clearTerrain
        }));
        // Mark all as ordered by default
        this.units.forEach(u => u.unitState.isOrdered = true);
        return this;
    }

    setMovedUnits(units: Unit[]): FakeUnitMover {
        // Mark specified units as moved
        this.units.forEach(u => {
            if (units.includes(u.unit)) {
                u.unitState.hasMoved = true;
            }
        });
        return this;
    }

    setOccupiedCoords(coords: HexCoord[]): FakeUnitMover {
        this.occupiedCoords = coords;
        return this;
    }

    setTerrain(coord: HexCoord, terrain: Terrain): FakeUnitMover {
        this.terrains.set(`${coord.q},${coord.r}`, terrain);
        return this;
    }

    getAllUnits(): Array<{ unit: Unit; coord: HexCoord; terrain: Terrain; unitState: UnitState }> {
        return this.units;
    }

    getUnitAt(coord: HexCoord): Unit | undefined {
        return this.occupiedCoords.some(c => c.q === coord.q && c.r === coord.r)
            ? this.units[0]?.unit // Return some unit if occupied
            : undefined;
    }

    getTerrain(coord: HexCoord): Terrain {
        const key = `${coord.q},${coord.r}`;
        return this.terrains.get(key) || clearTerrain;
    }
}

interface TestCase {
    name: string
    unitMover: FakeUnitMover
    expected: Array<Move>
}

describe("MovePhase", () => {
    const phase = new MovePhase();

    // Define shared units
    const unit1 = new Infantry(Side.ALLIES);
    const unit2 = new Infantry(Side.ALLIES);

    // Sort function for comparing moves (used in expectations where order doesn't matter)
    const sortMoves = (moves: any[]) => moves.sort((a, b) => {
        if (a instanceof EndMovementsMove) return 1;
        if (b instanceof EndMovementsMove) return -1;
        const aKey = `${a.from.q},${a.from.r}->${a.to.q},${a.to.r}`;
        const bKey = `${b.from.q},${b.from.r}->${b.to.q},${b.to.r}`;
        return aKey.localeCompare(bKey);
    });

    const startPos = new HexCoord(5, 5);

    const cases: TestCase[] = [
        // Basic Functionality
        {
            name: "With no ordered units → only EndMovementsMove",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([])
                .setMovedUnits([])
                .setOccupiedCoords([]),
            expected: sortMoves([new EndMovementsMove()]),
        },
        {
            name: "Does not generate moves for units that already moved",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([unit1])
                .setOccupiedCoords([]),
            expected: sortMoves([new EndMovementsMove()]),
        },

        // Infantry Movement Range
        {
            name: "Infantry can move 2 hexes in any direction",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([]),
            expected: sortMoves([
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
            ]),
        },

        // Multiple Units
        {
            name: "Generates moves for multiple ordered units",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([
                    {coord: new HexCoord(5, 5), unit: unit1},
                    {coord: new HexCoord(8, 8), unit: unit2}
                ])
                .setMovedUnits([])
                .setOccupiedCoords([]),
            expected: (() => {
                const pos1 = new HexCoord(5, 5);
                const pos2 = new HexCoord(8, 8);
                const moves = [
                    // Unit 1 moves (from 5,5) - all 18 moves
                    new MoveUnitMove(pos1, pos1.east()),
                    new MoveUnitMove(pos1, pos1.northeast()),
                    new MoveUnitMove(pos1, pos1.northwest()),
                    new MoveUnitMove(pos1, pos1.west()),
                    new MoveUnitMove(pos1, pos1.southwest()),
                    new MoveUnitMove(pos1, pos1.southeast()),
                    new MoveUnitMove(pos1, pos1.northeast().east()),
                    new MoveUnitMove(pos1, pos1.northeast().northeast()),
                    new MoveUnitMove(pos1, pos1.east().east()),
                    new MoveUnitMove(pos1, pos1.northeast().northwest()),
                    new MoveUnitMove(pos1, pos1.northwest().northwest()),
                    new MoveUnitMove(pos1, pos1.northwest().west()),
                    new MoveUnitMove(pos1, pos1.west().west()),
                    new MoveUnitMove(pos1, pos1.southwest().west()),
                    new MoveUnitMove(pos1, pos1.southwest().southwest()),
                    new MoveUnitMove(pos1, pos1.southeast().southwest()),
                    new MoveUnitMove(pos1, pos1.southeast().east()),
                    new MoveUnitMove(pos1, pos1.southeast().southeast()),

                    // Unit 2 moves (from 8,8) - only 6 moves (near board edge, r=8 is last row)
                    new MoveUnitMove(pos2, pos2.northwest()),
                    new MoveUnitMove(pos2, pos2.west()),
                    new MoveUnitMove(pos2, pos2.northeast().northwest()),
                    new MoveUnitMove(pos2, pos2.northwest().northwest()),
                    new MoveUnitMove(pos2, pos2.northwest().west()),
                    new MoveUnitMove(pos2, pos2.west().west()),

                    new EndMovementsMove(),
                ];
                return sortMoves(moves);
            })(),
        },

        // Occupied Hexes
        {
            name: "Does not generate moves to occupied hexes",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([new HexCoord(6, 5)]), // East hex occupied
            expected: sortMoves([
                // Adjacent hexes (except east which is occupied)
                new MoveUnitMove(startPos, startPos.northeast()),
                new MoveUnitMove(startPos, startPos.northwest()),
                new MoveUnitMove(startPos, startPos.west()),
                new MoveUnitMove(startPos, startPos.southwest()),
                new MoveUnitMove(startPos, startPos.southeast()),

                // 2-hex moves (cannot go through or to occupied hex)
                new MoveUnitMove(startPos, startPos.northeast().east()),
                new MoveUnitMove(startPos, startPos.northeast().northeast()),
                new MoveUnitMove(startPos, startPos.northeast().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().west()),
                new MoveUnitMove(startPos, startPos.west().west()),
                new MoveUnitMove(startPos, startPos.southwest().west()),
                new MoveUnitMove(startPos, startPos.southwest().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().east()),
                new MoveUnitMove(startPos, startPos.southeast().southeast()),

                new EndMovementsMove(),
            ]),
        },
        {
            name: "Cannot move through friendly units",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([new HexCoord(6, 5)]), // Blocking hex to the east
            expected: sortMoves([
                // Adjacent hexes (except east which is blocked)
                new MoveUnitMove(startPos, startPos.northeast()),
                new MoveUnitMove(startPos, startPos.northwest()),
                new MoveUnitMove(startPos, startPos.west()),
                new MoveUnitMove(startPos, startPos.southwest()),
                new MoveUnitMove(startPos, startPos.southeast()),

                // 2-hex moves (cannot go through blocking hex)
                new MoveUnitMove(startPos, startPos.northeast().east()),
                new MoveUnitMove(startPos, startPos.northeast().northeast()),
                new MoveUnitMove(startPos, startPos.northeast().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().west()),
                new MoveUnitMove(startPos, startPos.west().west()),
                new MoveUnitMove(startPos, startPos.southwest().west()),
                new MoveUnitMove(startPos, startPos.southwest().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().east()),
                new MoveUnitMove(startPos, startPos.southeast().southeast()),

                new EndMovementsMove(),
            ]),
        },

        // Off-Board Hexes
        {
            name: "Does not generate moves to off-board hexes",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: new HexCoord(0, 7), unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([]),
            expected: (() => {
                const edgePos = new HexCoord(0, 7);
                const moves = [
                    // Adjacent hexes (some directions lead off-board)
                    new MoveUnitMove(edgePos, edgePos.east()),
                    new MoveUnitMove(edgePos, edgePos.northeast()),
                    new MoveUnitMove(edgePos, edgePos.northwest()),
                    new MoveUnitMove(edgePos, edgePos.west()),
                    new MoveUnitMove(edgePos, edgePos.southwest()),
                    new MoveUnitMove(edgePos, edgePos.southeast()),

                    // 2-hex moves (only those that stay on-board)
                    new MoveUnitMove(edgePos, edgePos.east().east()),
                    new MoveUnitMove(edgePos, edgePos.east().northeast()),
                    new MoveUnitMove(edgePos, edgePos.east().southeast()),
                    new MoveUnitMove(edgePos, edgePos.northeast().northeast()),
                    new MoveUnitMove(edgePos, edgePos.northeast().northwest()),
                    new MoveUnitMove(edgePos, edgePos.northwest().northwest()),
                    new MoveUnitMove(edgePos, edgePos.northwest().west()),
                    new MoveUnitMove(edgePos, edgePos.west().west()),
                    new MoveUnitMove(edgePos, edgePos.west().southwest()),

                    new EndMovementsMove(),
                ];
                return sortMoves(moves);
            })(),
        },

        // Terrain-Based Movement Restrictions
        {
            name: "Cannot move through Woods (unitMovingInMustStop=true)",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([])
                .setTerrain(startPos.east(), woodsTerrain),
            expected: sortMoves([
                // Can move TO woods (east hex)
                new MoveUnitMove(startPos, startPos.east()),

                // Cannot move THROUGH woods to reach further hexes
                // (no moves like east().east() that go through the woods hex)

                // Other adjacent hexes (not blocked)
                new MoveUnitMove(startPos, startPos.northeast()),
                new MoveUnitMove(startPos, startPos.northwest()),
                new MoveUnitMove(startPos, startPos.west()),
                new MoveUnitMove(startPos, startPos.southwest()),
                new MoveUnitMove(startPos, startPos.southeast()),

                // 2-hex moves that don't go through woods
                new MoveUnitMove(startPos, startPos.northeast().northeast()),
                new MoveUnitMove(startPos, startPos.northeast().east()),  // Goes around woods
                new MoveUnitMove(startPos, startPos.northeast().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().northwest()),
                new MoveUnitMove(startPos, startPos.northwest().west()),
                new MoveUnitMove(startPos, startPos.west().west()),
                new MoveUnitMove(startPos, startPos.southwest().west()),
                new MoveUnitMove(startPos, startPos.southwest().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().southwest()),
                new MoveUnitMove(startPos, startPos.southeast().east()),  // Goes around woods
                new MoveUnitMove(startPos, startPos.southeast().southeast()),

                new EndMovementsMove(),
            ]),
        },
        {
            name: "Hedgerows and Town also block movement (same as Woods)",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([])
                .setTerrain(startPos.west(), hedgerowsTerrain)
                .setTerrain(startPos.east(), new TownTerrain("Town A")),
            expected: (() => {
                // Both west (hedgerows) and east (town) should block pass-through
                // Only moves that don't go through these hexes should be valid
                const moves = [
                    // Can move TO the blocking hexes
                    new MoveUnitMove(startPos, startPos.west()),
                    new MoveUnitMove(startPos, startPos.east()),

                    // Can move to other adjacent hexes
                    new MoveUnitMove(startPos, startPos.northeast()),
                    new MoveUnitMove(startPos, startPos.northwest()),
                    new MoveUnitMove(startPos, startPos.southwest()),
                    new MoveUnitMove(startPos, startPos.southeast()),

                    // 2-hex moves that avoid both blocking hexes
                    new MoveUnitMove(startPos, startPos.northeast().northeast()),
                    new MoveUnitMove(startPos, startPos.northeast().east()),  // Around west blocker
                    new MoveUnitMove(startPos, startPos.northeast().northwest()),
                    new MoveUnitMove(startPos, startPos.northwest().northwest()),
                    new MoveUnitMove(startPos, startPos.northwest().west()),  // Around east blocker
                    new MoveUnitMove(startPos, startPos.southwest().southwest()),
                    new MoveUnitMove(startPos, startPos.southwest().west()),  // Around east blocker
                    new MoveUnitMove(startPos, startPos.southeast().southwest()),
                    new MoveUnitMove(startPos, startPos.southeast().east()),  // Around west blocker
                    new MoveUnitMove(startPos, startPos.southeast().southeast()),

                    new EndMovementsMove(),
                ];
                return sortMoves(moves);
            })(),
        },
        {
            name: "Hills and clear terrain do NOT block movement",
            unitMover: new FakeUnitMover()
                .setOrderedUnits([{coord: startPos, unit: unit1}])
                .setMovedUnits([])
                .setOccupiedCoords([])
                .setTerrain(startPos.east(), hillTerrain),
            expected: sortMoves([
                // Should have ALL normal moves (18 total)
                // Including moves that go THROUGH the hill hex
                new MoveUnitMove(startPos, startPos.east()),
                new MoveUnitMove(startPos, startPos.southeast()),
                new MoveUnitMove(startPos, startPos.southwest()),
                new MoveUnitMove(startPos, startPos.west()),
                new MoveUnitMove(startPos, startPos.northwest()),
                new MoveUnitMove(startPos, startPos.northeast()),

                new MoveUnitMove(startPos, startPos.northeast().northeast()),
                new MoveUnitMove(startPos, startPos.northeast().east()),
                new MoveUnitMove(startPos, startPos.east().east()),  // Through hill!
                new MoveUnitMove(startPos, startPos.southeast().east()),  // Through hill!
                new MoveUnitMove(startPos, startPos.southeast().southeast()),
                new MoveUnitMove(startPos, startPos.southeast().southwest()),
                new MoveUnitMove(startPos, startPos.southwest().southwest()),
                new MoveUnitMove(startPos, startPos.southwest().west()),
                new MoveUnitMove(startPos, startPos.west().west()),
                new MoveUnitMove(startPos, startPos.northwest().west()),
                new MoveUnitMove(startPos, startPos.northwest().northwest()),
                new MoveUnitMove(startPos, startPos.northeast().northwest()),

                new EndMovementsMove(),
            ]),
        },
    ];

    test.each(cases)('$name', ({unitMover, expected}) => {
        const moves = phase.doLegalMoves(unitMover);
        expect(sortMoves(moves)).toEqual(expected);
    });
});
