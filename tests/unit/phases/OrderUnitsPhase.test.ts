// ABOUTME: Unit tests for OrderUnitsPhase
// ABOUTME: Tests slot-based ordering with constraint propagation for overlapping predicates

import {describe, expect, test} from "vitest";
import {ConfirmOrdersMove, OrderUnitMove, UnOrderMove} from "../../../src/domain/moves/Move";
import {Armor, Artillery, Infantry, UnitType} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {OrderUnitsPhase, OrderSlot, UnitsProvider} from "../../../src/domain/phases/OrderUnitsPhase";
import {SituatedUnit, situatedUnit} from "../../../src/domain/SituatedUnit";

function makeProvider(units: SituatedUnit[]): UnitsProvider {
    return {
        getFriendlySituatedUnits(): SituatedUnit[] {
            return units;
        }
    };
}

describe("GeneralOrderUnitsPhase", () => {
    describe("single slot with simple predicate", () => {
        interface TestCase {
            name: string;
            maxCount: number;
            orderedIndices: number[];
            expectedOrderMoves: number[];
            expectedUnorderMoves: number[];
        }

        const infantry1 = new Infantry(Side.ALLIES);
        const infantry2 = new Infantry(Side.ALLIES);
        const infantry3 = new Infantry(Side.ALLIES);

        const units = [
            situatedUnit().withUnit(infantry1).at(0, 0).build(),
            situatedUnit().withUnit(infantry2).at(1, 0).build(),
            situatedUnit().withUnit(infantry3).at(2, 0).build(),
        ];

        const cases: TestCase[] = [
            {
                name: "no ordered units, can order up to limit",
                maxCount: 2,
                orderedIndices: [],
                expectedOrderMoves: [0, 1, 2],
                expectedUnorderMoves: [],
            },
            {
                name: "one ordered unit, can order more",
                maxCount: 2,
                orderedIndices: [0],
                expectedOrderMoves: [1, 2],
                expectedUnorderMoves: [0],
            },
            {
                name: "at limit, cannot order more",
                maxCount: 2,
                orderedIndices: [0, 1],
                expectedOrderMoves: [],
                expectedUnorderMoves: [0, 1],
            },
            {
                name: "no units match predicate",
                maxCount: 2,
                orderedIndices: [],
                expectedOrderMoves: [],
                expectedUnorderMoves: [],
            },
        ];

        test.each(cases)("$name", ({maxCount, orderedIndices, expectedOrderMoves, expectedUnorderMoves}) => {
            // Reset all unit states
            for (const u of units) {
                u.unitState.isOrdered = false;
            }

            // Set ordered states
            for (const i of orderedIndices) {
                units[i].unitState.isOrdered = true;
            }

            // Use empty provider for "no units match predicate" case
            const isNoUnitsCase = expectedOrderMoves.length === 0 && expectedUnorderMoves.length === 0 && orderedIndices.length === 0;
            const provider = makeProvider(isNoUnitsCase ? [] : units);

            const slots: OrderSlot[] = [{
                predicate: () => true,
                maxCount
            }];
            const phase = new OrderUnitsPhase(slots);

            const moves = phase.doLegalMoves(provider);

            // Always starts with ConfirmOrdersMove
            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove) as UnOrderMove[];

            expect(orderMoves.map(m => units.findIndex(u => u.unit === m.unit))).toEqual(expectedOrderMoves);
            expect(unorderMoves.map(m => units.findIndex(u => u.unit === m.unit))).toEqual(expectedUnorderMoves);
        });
    });

    describe("multiple slots with non-overlapping predicates", () => {
        const infantry = new Infantry(Side.ALLIES);
        const armor = new Armor(Side.ALLIES);
        const artillery = new Artillery(Side.ALLIES);

        const suInfantry = situatedUnit().withUnit(infantry).at(0, 0).build();
        const suArmor = situatedUnit().withUnit(armor).at(1, 0).build();
        const suArtillery = situatedUnit().withUnit(artillery).at(2, 0).build();

        const units = [suInfantry, suArmor, suArtillery];

        test("can order one of each type", () => {
            for (const u of units) {
                u.unitState.isOrdered = false;
            }

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 1},
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Can order infantry and armor, but not artillery (no slot for it)
            expect(orderMoves.length).toBe(2);
            expect(orderMoves.some(m => m.unit === infantry)).toBe(true);
            expect(orderMoves.some(m => m.unit === armor)).toBe(true);
            expect(orderMoves.some(m => m.unit === artillery)).toBe(false);
        });

        test("each slot has independent limit", () => {
            // Order the infantry
            suInfantry.unitState.isOrdered = true;
            suArmor.unitState.isOrdered = false;
            suArtillery.unitState.isOrdered = false;

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 1},
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Infantry slot is full, but armor slot is still open
            expect(orderMoves.length).toBe(1);
            expect(orderMoves[0].unit).toBe(armor);
        });
    });

    describe("overlapping predicates with constraint propagation", () => {
        const infantry1 = new Infantry(Side.ALLIES);
        const infantry2 = new Infantry(Side.ALLIES);
        const armor = new Armor(Side.ALLIES);
        const artillery = new Artillery(Side.ALLIES);

        const suInf1 = situatedUnit().withUnit(infantry1).at(0, 0).build();
        const suInf2 = situatedUnit().withUnit(infantry2).at(1, 0).build();
        const suArmor = situatedUnit().withUnit(armor).at(2, 0).build();
        const suArtillery = situatedUnit().withUnit(artillery).at(3, 0).build();

        function resetUnits(units: SituatedUnit[]) {
            for (const u of units) {
                u.unitState.isOrdered = false;
            }
        }

        test("Captain Matt's example: 1 infantry, 1 armor, 1 any - can order 3 different types", () => {
            const units = [suInf1, suArmor, suArtillery];
            resetUnits(units);

            // Order all three
            suInf1.unitState.isOrdered = true;
            suArmor.unitState.isOrdered = true;
            suArtillery.unitState.isOrdered = true;

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 1},
                {predicate: () => true, maxCount: 1},  // "any" slot
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            // All 3 can be unordered (constraint propagation assigns them correctly)
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove) as UnOrderMove[];
            expect(unorderMoves.length).toBe(3);

            // No more can be ordered (all slots full)
            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];
            expect(orderMoves.length).toBe(0);
        });

        test("Captain Matt's example: 2 infantry and 1 armor allowed", () => {
            const units = [suInf1, suInf2, suArmor];
            resetUnits(units);

            // Order 2 infantry and 1 armor
            suInf1.unitState.isOrdered = true;
            suInf2.unitState.isOrdered = true;
            suArmor.unitState.isOrdered = true;

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 1},
                {predicate: () => true, maxCount: 1},  // "any" slot
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            // Constraint propagation should work:
            // - armor can only go in armor slot → assigned there
            // - inf1 can go in infantry or any → after armor assigned, one infantry must go to infantry
            // - inf2 must go to "any" slot
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove) as UnOrderMove[];
            expect(unorderMoves.length).toBe(3);
        });

        test("constraint propagation: artillery forces infantry to specific slot", () => {
            const units = [suInf1, suArtillery];
            resetUnits(units);

            // Order both
            suInf1.unitState.isOrdered = true;
            suArtillery.unitState.isOrdered = true;

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: () => true, maxCount: 1},  // "any" slot
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            // Artillery can only go in "any" slot → infantry forced to infantry slot
            // Both slots now full, no more orders possible
            const orderMoves = moves.filter(m => m instanceof OrderUnitMove);
            expect(orderMoves.length).toBe(0);

            // Both can be unordered
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove);
            expect(unorderMoves.length).toBe(2);
        });

        test("can still order when slots have room after constraint propagation", () => {
            const units = [suInf1, suInf2, suArmor, suArtillery];
            resetUnits(units);

            // Order just the artillery
            suArtillery.unitState.isOrdered = true;

            const slots: OrderSlot[] = [
                {predicate: su => su.unit.type === UnitType.INFANTRY, maxCount: 1},
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 1},
                {predicate: () => true, maxCount: 1},  // artillery takes this
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider(units);

            const moves = phase.doLegalMoves(provider);

            // Artillery takes the "any" slot
            // Infantry slot has room → both infantry can be ordered (but only 1 will fit)
            // Armor slot has room → armor can be ordered
            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Should be able to order infantry1, infantry2, and armor
            // (even though only 2 more slots, all 3 eligible units show as orderable)
            expect(orderMoves.some(m => m.unit === infantry1)).toBe(true);
            expect(orderMoves.some(m => m.unit === infantry2)).toBe(true);
            expect(orderMoves.some(m => m.unit === armor)).toBe(true);
        });
    });

    describe("edge cases", () => {
        test("empty slots list returns only confirm move", () => {
            const infantry = new Infantry(Side.ALLIES);
            const su = situatedUnit().withUnit(infantry).at(0, 0).build();
            const provider = makeProvider([su]);

            const phase = new OrderUnitsPhase([]);

            const moves = phase.doLegalMoves(provider);

            expect(moves.length).toBe(1);
            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);
        });

        test("no friendly units returns only confirm move", () => {
            const slots: OrderSlot[] = [
                {predicate: () => true, maxCount: 2}
            ];
            const phase = new OrderUnitsPhase(slots);
            const provider = makeProvider([]);

            const moves = phase.doLegalMoves(provider);

            expect(moves.length).toBe(1);
            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);
        });

        test("predicate that matches nothing", () => {
            const infantry = new Infantry(Side.ALLIES);
            const su = situatedUnit().withUnit(infantry).at(0, 0).build();
            su.unitState.isOrdered = false;
            const provider = makeProvider([su]);

            const slots: OrderSlot[] = [
                // Predicate that never matches
                {predicate: su => su.unit.type === UnitType.ARMOR, maxCount: 2}
            ];
            const phase = new OrderUnitsPhase(slots);

            const moves = phase.doLegalMoves(provider);

            // Infantry doesn't match armor predicate, so can't be ordered
            expect(moves.length).toBe(1);
            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);
        });
    });
});
