// ABOUTME: Unit tests for BattlePhase
// ABOUTME: Tests legal battle move generation for units within 3 hexes

import {describe, expect, test} from "vitest";
import {BattlePhase} from "../../../src/domain/phases/BattlePhase";
import {EndBattlesMove, Move} from "../../../src/domain/moves/Move";
import {Infantry, Unit, UnitState} from "../../../src/domain/Unit";
import {Side, Position, Player} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";
import {clearTerrain, hillTerrain, Terrain, woodsTerrain} from "../../../src/domain/terrain/Terrain";
import {Fortification, noFortification} from "../../../src/domain/fortifications/Fortification";
import {BattleMove} from "../../../src/domain/moves/BattleMove";

export class FakeUnitBattler {
    allUnitsData = [] as Array<{ coord: HexCoord, unit: Unit, unitState: UnitState, terrain: Terrain }>;
    activePlayer = new Player(Side.ALLIES, Position.BOTTOM);
    terrainMap = new Map<string, Terrain>();
    fortificationMap = new Map<string, Fortification>();

    setAllUnits(units: Array<{
        coord: HexCoord, unit: Unit, isOrdered?: boolean, skipsBattle?: boolean, battlesThisTurn?: number,
        terrain?: Terrain
    }>): FakeUnitBattler {
        this.allUnitsData = units.map(({coord, unit, isOrdered = false, skipsBattle = false, battlesThisTurn = 0, terrain = clearTerrain}) => {
            const unitState = new UnitState(unit.initialStrength);
            unitState.isOrdered = isOrdered;
            unitState.skipsBattle = skipsBattle;
            unitState.battlesThisTurn = battlesThisTurn;
            // Store terrain in map for getTerrain lookups
            this.terrainMap.set(`${coord.q},${coord.r}`, terrain);
            return {
                coord,
                unit,
                unitState,
                terrain: terrain
            };
        });
        return this;
    }

    setActivePlayer(player: Player): FakeUnitBattler {
        this.activePlayer = player;
        return this;
    }

    getAllUnits() {
        return this.allUnitsData;
    }

    getTerrain(coord: HexCoord): Terrain {
        return this.terrainMap.get(`${coord.q},${coord.r}`) || clearTerrain;
    }

    getFortification(coord: HexCoord): Fortification {
        return this.fortificationMap.get(`${coord.q},${coord.r}`) || noFortification;
    }
}

interface TestCase {
    name: string
    unitBattler: FakeUnitBattler
    expected: Array<Move>
}

describe("BattlePhase", () => {
    const phase = new BattlePhase();

    // Define shared units
    const friendlyUnit1 = new Infantry(Side.ALLIES);
    const friendlyUnit2 = new Infantry(Side.ALLIES);
    const enemyUnit1 = new Infantry(Side.AXIS);
    const enemyUnit2 = new Infantry(Side.AXIS);
    const enemyUnit3 = new Infantry(Side.AXIS);
    const axisUnit1 = new Infantry(Side.AXIS);
    const alliedUnit1 = new Infantry(Side.ALLIES);

    const cases: TestCase[] = [
        // Basic Functionality
        {
            name: "No ordered units → only EndBattlesMove",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([{coord: new HexCoord(5, 5), unit: enemyUnit1}]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "Returns BattleMove for ordered unit that can battle with enemy in range",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1} // 1 hex away
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Does NOT return BattleMove for ordered unit that skips battle (marked skipsBattle)",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, skipsBattle: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1}
                ]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "Does NOT return BattleMove for unordered unit",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(8, 8), unit: friendlyUnit2}, // Not ordered
                    {coord: new HexCoord(9, 8), unit: enemyUnit1} // Adjacent to unordered unit
                ]),
            expected: [new EndBattlesMove()],
        },

        // Range Testing
        {
            name: "Returns BattleMove for enemy at distance 1 with 3 dice",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1} // 1 hex east
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Does NOT return BattleMove for enemy at distance 4",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(9, 5), unit: enemyUnit1} // 4 hexes east
                ]),
            expected: [new EndBattlesMove()],
        },

        // toUnit terrain modifications
        {
            name: "Uses defender terrain to influence the number of dice",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1, terrain: woodsTerrain} // 1 hex in woods
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 2),
            ],
        },
        {
            name: "Uses attacker terrain to influence the number of dice",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, terrain: hillTerrain},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1, terrain: hillTerrain} // 1 hex in hills
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3), // hill-to-hill does not reduce dice
            ],
        },
        {
            name: "Does not return BattleMoves for zero dice",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(8, 5), unit: enemyUnit1, terrain: woodsTerrain} // 3 hexes away in woods
                ]),
            expected: [
                new EndBattlesMove(),
            ],
        },

        // Enemy Identification
        {
            name: "Returns BattleMove only for enemy units (opposite side)",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(5, 6), unit: friendlyUnit2}, // Same side, not blocking LOS
                    {coord: new HexCoord(7, 5), unit: enemyUnit1}     // Enemy
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 2),
            ],
        },
        {
            name: "Does NOT return BattleMove for friendly units",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: friendlyUnit2} // Adjacent friendly
                ]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "Correctly identifies enemies based on activePlayer.side (AXIS active)",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: axisUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: alliedUnit1} // Enemy when AXIS is active
                ])
                .setActivePlayer(new Player(Side.AXIS, Position.TOP)),
            expected: [
                new EndBattlesMove(),
                new BattleMove(axisUnit1, alliedUnit1, 3),
            ],
        },

        // Multiple Targets
        {
            name: "When unit has 3 enemies in range (all distance 2-3, no close combat), returns 3 BattleMoves",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(7, 5), unit: enemyUnit1},  // Distance 2
                    {coord: new HexCoord(2, 5), unit: enemyUnit2},  // Distance 3 (west, not blocked)
                    {coord: new HexCoord(5, 7), unit: enemyUnit3}   // Distance 2 (south)
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 2),
                new BattleMove(friendlyUnit1, enemyUnit2, 1),
                new BattleMove(friendlyUnit1, enemyUnit3, 2),
            ],
        },
        {
            name: "Each BattleMove has correct fromUnit and toUnit (no close combat)",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(7, 5), unit: enemyUnit1},  // Distance 2
                    {coord: new HexCoord(5, 8), unit: enemyUnit2}   // Distance 3 (south, not blocked)
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 2),
                new BattleMove(friendlyUnit1, enemyUnit2, 1),
            ],
        },

        // Multiple Attackers
        {
            name: "When 2 ordered units can battle, returns moves for both units plus EndBattlesMove",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},      // Near friendlyUnit1
                    {coord: new HexCoord(10, 10), unit: friendlyUnit2, isOrdered: true},
                    {coord: new HexCoord(11, 10), unit: enemyUnit2}     // Near friendlyUnit2
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
                new BattleMove(friendlyUnit2, enemyUnit2, 3),
            ],
        },

        // Edge Cases
        {
            name: "All ordered units marked skipsBattle → only EndBattlesMove",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, skipsBattle: true},
                    {coord: new HexCoord(6, 6), unit: friendlyUnit2, isOrdered: true, skipsBattle: true},
                    {coord: new HexCoord(7, 5), unit: enemyUnit1}
                ]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "No enemies on board → only EndBattlesMove",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([{coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true}]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "All enemies out of range → only EndBattlesMove",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(10, 10), unit: enemyUnit1} // Far away
                ]),
            expected: [new EndBattlesMove()],
        },

        // Close Combat Restriction
        {
            name: "Unit with adjacent enemy can only battle at distance 1",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},  // Distance 1
                    {coord: new HexCoord(7, 5), unit: enemyUnit2}   // Distance 2
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Unit with adjacent enemy cannot battle at distance 2",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},  // Distance 1
                    {coord: new HexCoord(7, 5), unit: enemyUnit2}   // Distance 2
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Unit with adjacent enemy cannot battle at distance 3",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},  // Distance 1
                    {coord: new HexCoord(8, 5), unit: enemyUnit2}   // Distance 3
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Unit with multiple adjacent enemies can battle all adjacent enemies",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},  // Distance 1 (East)
                    {coord: new HexCoord(4, 5), unit: enemyUnit2},  // Distance 1 (West)
                    {coord: new HexCoord(8, 5), unit: enemyUnit3}   // Distance 3
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
                new BattleMove(friendlyUnit1, enemyUnit2, 3),
            ],
        },
        {
            name: "Unit without adjacent enemy can battle at all ranges 1-3",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},
                    {coord: new HexCoord(6, 6), unit: enemyUnit1},  // Distance 2 (diagonal)
                    {coord: new HexCoord(7, 5), unit: enemyUnit2},  // Distance 2
                    {coord: new HexCoord(5, 8), unit: enemyUnit3}   // Distance 3 (not blocked)
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 2),
                new BattleMove(friendlyUnit1, enemyUnit2, 2),
                new BattleMove(friendlyUnit1, enemyUnit3, 1),
            ],
        },
        {
            name: "Close combat restriction only applies to unit with adjacent enemy",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true},   // Has adjacent enemy
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},      // Adjacent to friendlyUnit1
                    {coord: new HexCoord(7, 5), unit: enemyUnit2},      // Distance 2 from friendlyUnit1
                    {coord: new HexCoord(10, 10), unit: friendlyUnit2, isOrdered: true},  // No adjacent enemy
                    {coord: new HexCoord(12, 10), unit: enemyUnit3}     // Distance 2 from friendlyUnit2
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
                new BattleMove(friendlyUnit2, enemyUnit3, 2),
            ],
        },

        // Attack Tracking
        {
            name: "Unit with attacksThisTurn = 0 can generate battle moves",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, battlesThisTurn: 0},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1}
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
            ],
        },
        {
            name: "Does NOT return BattleMove for unit that has already attacked this turn (attacksThisTurn = 1)",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, battlesThisTurn: 1},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1}
                ]),
            expected: [new EndBattlesMove()],
        },
        {
            name: "Multiple ordered units can each attack once",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, battlesThisTurn: 0},
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},
                    {coord: new HexCoord(10, 10), unit: friendlyUnit2, isOrdered: true, battlesThisTurn: 0},
                    {coord: new HexCoord(11, 10), unit: enemyUnit2}
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit1, enemyUnit1, 3),
                new BattleMove(friendlyUnit2, enemyUnit2, 3),
            ],
        },
        {
            name: "When one unit has attacked, only the other unit generates battle moves",
            unitBattler: new FakeUnitBattler()
                .setAllUnits([
                    {coord: new HexCoord(5, 5), unit: friendlyUnit1, isOrdered: true, battlesThisTurn: 1},  // Already attacked
                    {coord: new HexCoord(6, 5), unit: enemyUnit1},
                    {coord: new HexCoord(10, 10), unit: friendlyUnit2, isOrdered: true, battlesThisTurn: 0},   // Can still attack
                    {coord: new HexCoord(11, 10), unit: enemyUnit2}
                ]),
            expected: [
                new EndBattlesMove(),
                new BattleMove(friendlyUnit2, enemyUnit2, 3),
            ],
        },
    ];

    test.each(cases)('$name', ({unitBattler, expected}) => {
        const moves = phase.doLegalMoves(unitBattler);
        expect(moves).toEqual(expected);
    });
});

