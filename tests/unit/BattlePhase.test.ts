// ABOUTME: Unit tests for BattlePhase
// ABOUTME: Tests legal battle move generation for units within 3 hexes

import {describe, expect, test} from "vitest";
import {BattlePhase} from "../../src/domain/phases/BattlePhase";
import {BattleMove, EndBattlesMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side, Position, createPlayer, type Player} from "../../src/domain/Player";
import type {HexCoord} from "../../src/utils/hex";

// Declare which methods from GameState we actually need to do our job
interface UnitBattler {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    unitSkipsBattle(unit: Unit): boolean;
    getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    activePlayer: Player;
}

describe("BattlePhase", () => {
    describe("Basic Functionality", () => {
        test("Always returns EndBattlesMove even with no units", () => {
            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [],
                allUnits: [],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Returns BattleMove for ordered unit that can battle with enemy in range", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: enemyUnit} // 1 hex away
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + BattleMove
            expect(actual.length).toBe(2);
            expect(actual).toContainEqual(expect.any(EndBattlesMove));

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Does NOT return BattleMove for ordered unit that skips battle (marked skipsBattle)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: enemyUnit}
                ],
                unitsSkipBattle: [friendlyUnit], // Unit cannot battle
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Does NOT return BattleMove for unordered unit", () => {
            const orderedUnit = new Infantry(Side.ALLIES);
            const unorderedUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: orderedUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: orderedUnit},
                    {coord: {q: 8, r: 8}, unit: unorderedUnit}, // Not ordered
                    {coord: {q: 9, r: 8}, unit: enemyUnit} // Adjacent to unordered unit
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove (no enemies near ordered unit)
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });
    });

    describe("Range Testing", () => {
        test("Returns BattleMove for enemy at distance 1 (adjacent)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: enemyUnit} // 1 hex east (distance = 1)
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Returns BattleMove for enemy at distance 2", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 7, r: 5}, unit: enemyUnit} // 2 hexes east (distance = 2)
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Returns BattleMove for enemy at distance 3", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 8, r: 5}, unit: enemyUnit} // 3 hexes east (distance = 3)
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Does NOT return BattleMove for enemy at distance 4", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 9, r: 5}, unit: enemyUnit} // 4 hexes east (distance = 4)
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove (enemy out of range)
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Uses hexDistance() correctly for diagonal distances", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyNear = new Infantry(Side.AXIS);
            const enemyFar = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 7, r: 6}, unit: enemyNear}, // distance = 2
                    {coord: {q: 9, r: 7}, unit: enemyFar}   // distance = 4
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + BattleMove for enemyNear only
            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].toUnit).toBe(enemyNear);
        });
    });

    describe("Enemy Identification", () => {
        test("Returns BattleMove only for enemy units (opposite side)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const anotherFriendly = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: anotherFriendly}, // Same side
                    {coord: {q: 7, r: 5}, unit: enemyUnit}        // Enemy
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Does NOT return BattleMove for friendly units", () => {
            const friendlyUnit1 = new Infantry(Side.ALLIES);
            const friendlyUnit2 = new Infantry(Side.ALLIES);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit1}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit1},
                    {coord: {q: 6, r: 5}, unit: friendlyUnit2} // Adjacent friendly
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove (no enemies)
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Correctly identifies enemies based on activePlayer.side (AXIS active)", () => {
            const axisUnit = new Infantry(Side.AXIS);
            const alliedUnit = new Infantry(Side.ALLIES);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: axisUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: axisUnit},
                    {coord: {q: 6, r: 5}, unit: alliedUnit} // Enemy when AXIS is active
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.AXIS, Position.TOP),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(axisUnit);
            expect(battleMoves[0].toUnit).toBe(alliedUnit);
        });
    });

    describe("Multiple Targets", () => {
        test("When unit has 3 enemies in range, returns 3 BattleMoves (one per target)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);
            const enemy3 = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: enemy1},  // Distance 1
                    {coord: {q: 7, r: 5}, unit: enemy2},  // Distance 2
                    {coord: {q: 8, r: 5}, unit: enemy3}   // Distance 3
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + 3 BattleMoves
            expect(actual.length).toBe(4);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(3);

            // Each BattleMove should target a different enemy
            expect(battleMoves.some(m => m.toUnit === enemy1)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemy2)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemy3)).toBe(true);
        });

        test("Each BattleMove has correct fromUnit and toUnit", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendlyUnit}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendlyUnit},
                    {coord: {q: 6, r: 5}, unit: enemy1},
                    {coord: {q: 7, r: 5}, unit: enemy2}
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];

            // All BattleMoves should have the same fromUnit
            expect(battleMoves.every(m => m.fromUnit === friendlyUnit)).toBe(true);

            // Each should target a different enemy
            const targetUnits = battleMoves.map(m => m.toUnit);
            expect(targetUnits).toContain(enemy1);
            expect(targetUnits).toContain(enemy2);
        });
    });

    describe("Multiple Attackers", () => {
        test("When 2 ordered units can battle, returns moves for both units plus EndBattlesMove", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly1},
                    {coord: {q: 10, r: 10}, unit: friendly2}
                ],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly1},
                    {coord: {q: 6, r: 5}, unit: enemy1},      // Near friendly1
                    {coord: {q: 10, r: 10}, unit: friendly2},
                    {coord: {q: 11, r: 10}, unit: enemy2}     // Near friendly2
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + 2 BattleMoves
            expect(actual.length).toBe(3);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(2);

            // Should have moves from both friendly units
            expect(battleMoves.some(m => m.fromUnit === friendly1)).toBe(true);
            expect(battleMoves.some(m => m.fromUnit === friendly2)).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        test("No ordered units → only EndBattlesMove", () => {
            const enemy = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [], // No ordered units
                allUnits: [{coord: {q: 5, r: 5}, unit: enemy}],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("All ordered units marked skipsBattle → only EndBattlesMove", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly1},
                    {coord: {q: 6, r: 6}, unit: friendly2}
                ],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly1},
                    {coord: {q: 6, r: 6}, unit: friendly2},
                    {coord: {q: 7, r: 5}, unit: enemy}
                ],
                unitsSkipBattle: [friendly1, friendly2], // Both cannot battle
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("No enemies on board → only EndBattlesMove", () => {
            const friendly = new Infantry(Side.ALLIES);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendly}],
                allUnits: [{coord: {q: 5, r: 5}, unit: friendly}], // No enemies
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("All enemies out of range → only EndBattlesMove", () => {
            const friendly = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            const fakeUnitBattler: UnitBattler = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendly}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly},
                    {coord: {q: 10, r: 10}, unit: enemy} // Far away (distance > 3)
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            };

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });
    });

    describe("Integration Pattern", () => {
        test("Verify legalMoves(gameState) delegates to doLegalMoves", () => {
            // This is a structural test to ensure the pattern is followed
            const friendly = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            const fakeGameState = {
                orderedUnits: [{coord: {q: 5, r: 5}, unit: friendly}],
                allUnits: [
                    {coord: {q: 5, r: 5}, unit: friendly},
                    {coord: {q: 6, r: 5}, unit: enemy}
                ],
                unitsSkipBattle: [] as Unit[],
                activePlayer: createPlayer(Side.ALLIES, Position.BOTTOM),

                getOrderedUnitsWithPositions() {
                    return this.orderedUnits;
                },

                unitSkipsBattle(unit: Unit): boolean {
                    return this.unitsSkipBattle.includes(unit);
                },

                getAllUnitsWithPositions() {
                    return this.allUnits;
                },
            } as any; // Type assertion for test purposes

            const phase = new BattlePhase();
            const actual = phase.legalMoves(fakeGameState);

            // Should return same result as doLegalMoves
            expect(actual.length).toBe(2); // EndBattlesMove + BattleMove
            expect(actual.some(m => m instanceof EndBattlesMove)).toBe(true);
            expect(actual.some(m => m instanceof BattleMove)).toBe(true);
        });
    });
});
