// ABOUTME: Unit tests for BattlePhase
// ABOUTME: Tests legal battle move generation for units within 3 hexes

import {describe, expect, test} from "vitest";
import {BattlePhase} from "../../../src/domain/phases/BattlePhase";
import {BattleMove, EndBattlesMove} from "../../../src/domain/Move";
import {Infantry, Unit} from "../../../src/domain/Unit";
import {Side, Position, createPlayer} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";

const fakeUnitBattler = {
    orderedUnits: [] as Array<{ coord: HexCoord, unit: Unit }>,
    allUnits: [] as Array<{ coord: HexCoord, unit: Unit }>,
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


describe("BattlePhase", () => {
    describe("Basic Functionality", () => {
        test("Always returns EndBattlesMove even with no units", () => {
            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Returns BattleMove for ordered unit that can battle with enemy in range", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: enemyUnit} // 1 hex away
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: enemyUnit}
            ];
            fakeUnitBattler.unitsSkipBattle = [friendlyUnit] as Unit[]; // Unit cannot battle
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: orderedUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: orderedUnit},
                {coord: new HexCoord(8, 8), unit: unorderedUnit}, // Not ordered
                {coord: new HexCoord(9, 8), unit: enemyUnit} // Adjacent to unordered unit
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: enemyUnit} // 1 hex east (distance = 1)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
            expect(battleMoves[0].dice).toBe(3); // Infantry rolls 3 dice at distance 1
        });

        test("Returns BattleMove for enemy at distance 2", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(7, 5), unit: enemyUnit} // 2 hexes east (distance = 2)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
            expect(battleMoves[0].dice).toBe(2); // Infantry rolls 2 dice at distance 2
        });

        test("Returns BattleMove for enemy at distance 3", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(8, 5), unit: enemyUnit} // 3 hexes east (distance = 3)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
            expect(battleMoves[0].dice).toBe(1); // Infantry rolls 1 die at distance 3
        });

        test("Does NOT return BattleMove for enemy at distance 4", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(9, 5), unit: enemyUnit} // 4 hexes east (distance = 4)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(7, 6), unit: enemyNear}, // distance = 2
                {coord: new HexCoord(9, 7), unit: enemyFar}   // distance = 4
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: anotherFriendly}, // Same side
                {coord: new HexCoord(7, 5), unit: enemyUnit}        // Enemy
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].toUnit).toBe(enemyUnit);
        });

        test("Does NOT return BattleMove for friendly units", () => {
            const friendlyUnit1 = new Infantry(Side.ALLIES);
            const friendlyUnit2 = new Infantry(Side.ALLIES);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit1}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit1},
                {coord: new HexCoord(6, 5), unit: friendlyUnit2} // Adjacent friendly
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove (no enemies)
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Correctly identifies enemies based on activePlayer.side (AXIS active)", () => {
            const axisUnit = new Infantry(Side.AXIS);
            const alliedUnit = new Infantry(Side.ALLIES);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: axisUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: axisUnit},
                {coord: new HexCoord(6, 5), unit: alliedUnit} // Enemy when AXIS is active
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.AXIS, Position.TOP);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(axisUnit);
            expect(battleMoves[0].toUnit).toBe(alliedUnit);
        });
    });

    describe("Multiple Targets", () => {
        test("When unit has 3 enemies in range (all distance 2-3, no close combat), returns 3 BattleMoves", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);
            const enemy3 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(7, 5), unit: enemy1},  // Distance 2
                {coord: new HexCoord(8, 5), unit: enemy2},  // Distance 3
                {coord: new HexCoord(5, 7), unit: enemy3}   // Distance 2 (vertical)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];

            // No adjacent enemies, so all 3 enemies at range 2-3 should be targetable
            expect(battleMoves.length).toBe(3);
            expect(battleMoves.some(m => m.toUnit === enemy1)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemy2)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemy3)).toBe(true);
        });

        test("Each BattleMove has correct fromUnit and toUnit (no close combat)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(7, 5), unit: enemy1},  // Distance 2
                {coord: new HexCoord(8, 5), unit: enemy2}   // Distance 3
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(10, 10), unit: friendly2}
            ];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 5), unit: enemy1},      // Near friendly1
                {coord: new HexCoord(10, 10), unit: friendly2},
                {coord: new HexCoord(11, 10), unit: enemy2}     // Near friendly2
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

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

            fakeUnitBattler.orderedUnits = []; // No ordered units
            fakeUnitBattler.allUnits = [{coord: new HexCoord(5, 5), unit: enemy}];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("All ordered units marked skipsBattle → only EndBattlesMove", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 6), unit: friendly2}
            ];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 6), unit: friendly2},
                {coord: new HexCoord(7, 5), unit: enemy}
            ];
            fakeUnitBattler.unitsSkipBattle = [friendly1, friendly2] as Unit[]; // Both cannot battle
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("No enemies on board → only EndBattlesMove", () => {
            const friendly = new Infantry(Side.ALLIES);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendly}];
            fakeUnitBattler.allUnits = [{coord: new HexCoord(5, 5), unit: friendly}]; // No enemies
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("All enemies out of range → only EndBattlesMove", () => {
            const friendly = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendly}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly},
                {coord: new HexCoord(10, 10), unit: enemy} // Far away (distance > 3)
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });
    });

    describe("Close Combat Restriction", () => {
        test("Unit with adjacent enemy can only battle at distance 1", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const adjacentEnemy = new Infantry(Side.AXIS);
            const distantEnemy = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: adjacentEnemy},  // Distance 1
                {coord: new HexCoord(7, 5), unit: distantEnemy}    // Distance 2
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + BattleMove for adjacent enemy only
            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].toUnit).toBe(adjacentEnemy);
        });

        test("Unit with adjacent enemy cannot battle at distance 2", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const adjacentEnemy = new Infantry(Side.AXIS);
            const enemyAtDistance2 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: adjacentEnemy},     // Distance 1
                {coord: new HexCoord(7, 5), unit: enemyAtDistance2}   // Distance 2
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            // Should not include enemy at distance 2
            expect(battleMoves.every(m => m.toUnit !== enemyAtDistance2)).toBe(true);
        });

        test("Unit with adjacent enemy cannot battle at distance 3", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const adjacentEnemy = new Infantry(Side.AXIS);
            const enemyAtDistance3 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: adjacentEnemy},     // Distance 1
                {coord: new HexCoord(8, 5), unit: enemyAtDistance3}   // Distance 3
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            // Should not include enemy at distance 3
            expect(battleMoves.every(m => m.toUnit !== enemyAtDistance3)).toBe(true);
        });

        test("Unit with multiple adjacent enemies can battle all adjacent enemies", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const adjacentEnemy1 = new Infantry(Side.AXIS);
            const adjacentEnemy2 = new Infantry(Side.AXIS);
            const distantEnemy = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: adjacentEnemy1},  // Distance 1 (East)
                {coord: new HexCoord(4, 5), unit: adjacentEnemy2},  // Distance 1 (West)
                {coord: new HexCoord(8, 5), unit: distantEnemy}     // Distance 3
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            // Should have 2 BattleMoves (for both adjacent enemies)
            expect(battleMoves.length).toBe(2);
            expect(battleMoves.some(m => m.toUnit === adjacentEnemy1)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === adjacentEnemy2)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === distantEnemy)).toBe(false);
        });

        test("Unit without adjacent enemy can battle at all ranges 1-3", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyAt1 = new Infantry(Side.AXIS);
            const enemyAt2 = new Infantry(Side.AXIS);
            const enemyAt3 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 6), unit: enemyAt1},  // Distance 1 (but diagonal, not adjacent in grid)
                {coord: new HexCoord(7, 5), unit: enemyAt2},  // Distance 2
                {coord: new HexCoord(8, 5), unit: enemyAt3}   // Distance 3
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            // Should be able to battle all enemies at ranges 1-3
            expect(battleMoves.length).toBe(3);
            expect(battleMoves.some(m => m.toUnit === enemyAt1)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemyAt2)).toBe(true);
            expect(battleMoves.some(m => m.toUnit === enemyAt3)).toBe(true);
        });

        test("Close combat restriction only applies to unit with adjacent enemy", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const adjacentEnemy = new Infantry(Side.AXIS);
            const distantEnemy1 = new Infantry(Side.AXIS);
            const distantEnemy2 = new Infantry(Side.AXIS);

            fakeUnitBattler.orderedUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},   // Has adjacent enemy
                {coord: new HexCoord(10, 10), unit: friendly2}  // No adjacent enemy
            ];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 5), unit: adjacentEnemy},   // Adjacent to friendly1
                {coord: new HexCoord(7, 5), unit: distantEnemy1},   // Distance 2 from friendly1
                {coord: new HexCoord(10, 10), unit: friendly2},
                {coord: new HexCoord(12, 10), unit: distantEnemy2}  // Distance 2 from friendly2
            ];
            fakeUnitBattler.unitsSkipBattle = [] as Unit[];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];

            // friendly1 should only be able to battle adjacentEnemy (close combat)
            const friendly1Moves = battleMoves.filter(m => m.fromUnit === friendly1);
            expect(friendly1Moves.length).toBe(1);
            expect(friendly1Moves[0].toUnit).toBe(adjacentEnemy);

            // friendly2 should be able to battle distantEnemy2 (no close combat restriction)
            const friendly2Moves = battleMoves.filter(m => m.fromUnit === friendly2);
            expect(friendly2Moves.length).toBe(1);
            expect(friendly2Moves[0].toUnit).toBe(distantEnemy2);
        });
    });

    describe("Integration Pattern", () => {
        test("Verify legalMoves(gameState) delegates to doLegalMoves", () => {
            // This is a structural test to ensure the pattern is followed
            const friendly = new Infantry(Side.ALLIES);
            const enemy = new Infantry(Side.AXIS);

            const fakeGameState = {
                orderedUnits: [{coord: new HexCoord(5, 5), unit: friendly}],
                allUnits: [
                    {coord: new HexCoord(5, 5), unit: friendly},
                    {coord: new HexCoord(6, 5), unit: enemy}
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

    describe("Attack Tracking", () => {
        test("Unit with attacksThisTurn = 0 can generate battle moves", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            friendlyUnit.battlesThisTurn = 0;

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: enemyUnit}
            ];
            fakeUnitBattler.unitsSkipBattle = [];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + BattleMove
            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendlyUnit);
        });

        test("Does NOT return BattleMove for unit that has already attacked this turn (attacksThisTurn = 1)", () => {
            const friendlyUnit = new Infantry(Side.ALLIES);
            const enemyUnit = new Infantry(Side.AXIS);

            friendlyUnit.battlesThisTurn = 1; // Already attacked

            fakeUnitBattler.orderedUnits = [{coord: new HexCoord(5, 5), unit: friendlyUnit}];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendlyUnit},
                {coord: new HexCoord(6, 5), unit: enemyUnit}
            ];
            fakeUnitBattler.unitsSkipBattle = [];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should only have EndBattlesMove, no BattleMove
            expect(actual.length).toBe(1);
            expect(actual[0]).toBeInstanceOf(EndBattlesMove);
        });

        test("Multiple ordered units can each attack once", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);

            friendly1.battlesThisTurn = 0;
            friendly2.battlesThisTurn = 0;

            fakeUnitBattler.orderedUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(10, 10), unit: friendly2}
            ];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 5), unit: enemy1},
                {coord: new HexCoord(10, 10), unit: friendly2},
                {coord: new HexCoord(11, 10), unit: enemy2}
            ];
            fakeUnitBattler.unitsSkipBattle = [];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + 2 BattleMoves
            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(2);
            expect(battleMoves.some(m => m.fromUnit === friendly1)).toBe(true);
            expect(battleMoves.some(m => m.fromUnit === friendly2)).toBe(true);
        });

        test("When one unit has attacked, only the other unit generates battle moves", () => {
            const friendly1 = new Infantry(Side.ALLIES);
            const friendly2 = new Infantry(Side.ALLIES);
            const enemy1 = new Infantry(Side.AXIS);
            const enemy2 = new Infantry(Side.AXIS);

            friendly1.battlesThisTurn = 1; // Already attacked
            friendly2.battlesThisTurn = 0; // Can still attack

            fakeUnitBattler.orderedUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(10, 10), unit: friendly2}
            ];
            fakeUnitBattler.allUnits = [
                {coord: new HexCoord(5, 5), unit: friendly1},
                {coord: new HexCoord(6, 5), unit: enemy1},
                {coord: new HexCoord(10, 10), unit: friendly2},
                {coord: new HexCoord(11, 10), unit: enemy2}
            ];
            fakeUnitBattler.unitsSkipBattle = [];
            fakeUnitBattler.activePlayer = createPlayer(Side.ALLIES, Position.BOTTOM);

            const phase = new BattlePhase();
            const actual = phase.doLegalMoves(fakeUnitBattler);

            // Should have EndBattlesMove + 1 BattleMove (only from friendly2)
            const battleMoves = actual.filter(m => m instanceof BattleMove) as BattleMove[];
            expect(battleMoves.length).toBe(1);
            expect(battleMoves[0].fromUnit).toBe(friendly2);
        });
    });
});
