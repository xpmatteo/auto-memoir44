// ABOUTME: Acceptance tests for Dig In card
// ABOUTME: Tests infantry fortification, fallback mode, and edge cases

import {describe, expect, test} from "vitest";
import {OrderUnitMove} from "../../../src/domain/moves/Move";
import {hexOf} from "../../../src/utils/hex";
import {DigIn} from "../../../src/domain/cards/DigIn";
import {setupGameForCommandCardTests} from "../../helpers/testHelpers";
import {noFortification, sandbagAllies, sandbagAxis} from "../../../src/domain/fortifications/Fortification";
import {ConfirmDigInMove} from "../../../src/domain/moves/ConfirmDigInMove";
import {Side} from "../../../src/domain/Player";
import {PhaseType} from "../../../src/domain/phases/Phase";

describe("Dig In card", () => {

    describe("Normal mode - has eligible infantry", () => {

        test('Can order more than 3 infantry units', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN. IN .IN. IN .IN. AR ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(-1, 6))!));
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(0, 6))!));
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(1, 6))!));

            const legalMoves = gameState.legalMoves().map(m => m.toString()).sort();
            expect(legalMoves).toEqual([
                "ConfirmDigInMove",
                "UnOrderMove(unit-2/Allies)",
                "UnOrderMove(unit-3/Allies)",
                "UnOrderMove(unit-4/Allies)",
                "OrderUnitMove(unit-5/Allies)",
                "OrderUnitMove(unit-6/Allies)",
            ].sort());
        });

        test('Can nax four infantry units', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN. IN .IN. IN .IN. AR ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(-1, 6))!));
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(0, 6))!));
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(1, 6))!));
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(2, 6))!));

            const legalMoves = gameState.legalMoves().map(m => m.toString()).sort();
            expect(legalMoves).toEqual([
                "ConfirmDigInMove",
                "UnOrderMove(unit-2/Allies)",
                "UnOrderMove(unit-3/Allies)",
                "UnOrderMove(unit-4/Allies)",
                "UnOrderMove(unit-5/Allies)",
            ].sort());
        });

        test('Infantry only, no armor allowed', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN. AR .IN. AR ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            const legalMoves = gameState.legalMoves().map(m => m.toString()).sort();
            expect(legalMoves).toEqual([
                "ConfirmDigInMove",
                "OrderUnitMove(unit-2/Allies)",  // Infantry at position 1
                "OrderUnitMove(unit-4/Allies)",  // Infantry at position 3
            ].sort());
        });

        test('Applies sandbags when Dig In confirmed', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN. IN .IN.    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            // Get OrderUnitMove options from legal moves
            const legalMoves = gameState.legalMoves();
            const orderMoves = legalMoves.filter(m => m.toString().startsWith("OrderUnitMove")) as OrderUnitMove[];
            expect(orderMoves.length).toBeGreaterThan(0);

            // Order 3 infantry units
            gameState.executeMove(orderMoves[0]);
            gameState.executeMove(orderMoves[1]);
            gameState.executeMove(orderMoves[2]);

            // Get positions of ordered units
            const orderedUnits = gameState.getOrderedUnitsWithPositions();
            expect(orderedUnits.length).toBe(3);

            // Verify no fortifications before confirmation
            for (const {coord} of orderedUnits) {
                expect(gameState.getFortification(coord)).toBe(noFortification);
            }

            // Confirm dig in
            gameState.executeMove(new ConfirmDigInMove());

            // Verify sandbags placed
            for (const {coord} of orderedUnits) {
                expect(gameState.getFortification(coord)).toBe(sandbagAllies);
            }
        });

        test('Respects player side for fortification type', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .in.    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn, Side.AXIS);

            const unitHex = hexOf(6, 1);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(unitHex)!));
            gameState.executeMove(new ConfirmDigInMove());

            // Axis player should get axis sandbags
            expect(gameState.getFortification(unitHex)).toBe(sandbagAxis);
        });

        test('Cannot select infantry on fortified hexes', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN. IN .IN.    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            // Pre-place sandbag on unit-1's hex
            gameState.setFortification(hexOf(1, 6), sandbagAllies);

            const legalMoves = gameState.legalMoves().map(m => m.toString()).sort();
            // unit-1 should NOT be in legal moves
            expect(legalMoves).toEqual([
                "ConfirmDigInMove",
                "OrderUnitMove(unit-2/Allies)",
                "OrderUnitMove(unit-3/Allies)",
            ].sort());
        });

        test('No move or battle phases after confirmation', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .IN.    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(-1, 6))!));
            gameState.executeMove(new ConfirmDigInMove());

            // Should transition directly to ReplenishHandPhase (draw card)
            expect(gameState.legalMoves().map(m => m.toString()).sort()).toEqual([
                "ReplenishHandMove(Dig In)",
            ].sort());
        });

    });

    describe("Fallback mode - no infantry exist", () => {

        test('Can order 1 unit of any type when no infantry', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .AR. AR .AR.    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            const legalMoves = gameState.legalMoves().map(m => m.toString()).sort();
            expect(legalMoves).toEqual([
                "ConfirmOrdersMove",
                "OrderUnitMove(unit-2/Allies)",
                "OrderUnitMove(unit-3/Allies)",
                "OrderUnitMove(unit-4/Allies)",
            ].sort());
        });

        test('Fallback allows move and battle', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .AR.    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            const armorHex = hexOf(-1, 6);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(armorHex)!));
            gameState.executeMove(gameState.legalMoves().find(m => m.toString() === "ConfirmOrdersMove")!);

            // Should now be in Move phase
            expect(gameState.activePhase.type).toBe(PhaseType.MOVE);
        });
    });

    describe("Edge case - all infantry fortified", () => {

        test('Only ConfirmDigIn available when all infantry fortified', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .INS INS....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            const legalMoves = gameState.legalMoves().map(m => m.toString());
            expect(legalMoves).toEqual(["ConfirmDigInMove"]);
        });

        test('ConfirmDigIn does nothing when no units ordered', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .INS INS....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            // Execute ConfirmDigIn without ordering anything
            gameState.executeMove(new ConfirmDigInMove());

            // Should transition to ReplenishHandPhase
            expect(gameState.activePhase.type).toBe(PhaseType.REPLENISH_HAND);
        });

        test('Cannot order armor even if infantry exist but are fortified', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    .INS AR ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, DigIn);

            // Should NOT include armor unit
            const legalMoves = gameState.legalMoves().map(m => m.toString());
            expect(legalMoves).toEqual(["ConfirmDigInMove"]);
        });

    });

});
