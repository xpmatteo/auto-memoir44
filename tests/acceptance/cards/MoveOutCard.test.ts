// ABOUTME: Acceptance tests for MoveOut card
// ABOUTME: Tests infantry-specific ordering and fallback to any unit

import {expect, test, describe} from "vitest";
import {OrderUnitMove} from "../../../src/domain/moves/Move";
import {hexOf} from "../../../src/utils/hex";
import {MoveOut} from "../../../src/domain/cards/MoveOut";
import {setupGameForCommandCardTests} from "../../helpers/testHelpers";


describe("MoveOut card", () => {

    test('Can only order infantry', () => {
        const unitSetup = [
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .ar.    ....    ....    ~~",
            "....    ....    .AR. IN .IN. AR ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, MoveOut);

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ConfirmOrdersMove",
            "OrderUnitMove(unit-3/Allies)",
            "OrderUnitMove(unit-4/Allies)",
        ]);
    });

    describe('If no infantry units, order any one unit', () => {

        test('All armor is available', () => {
            const unitSetup = [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    ....    .AR. AR .AR. AR ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, MoveOut);

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmOrdersMove",
                "OrderUnitMove(unit-2/Allies)",
                "OrderUnitMove(unit-3/Allies)",
                "OrderUnitMove(unit-4/Allies)",
                "OrderUnitMove(unit-5/Allies)",
            ]);
        });

        test('Only one unit can be ordered', () => {
            const unitSetup = [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    ....    .AR. AR .AR. AR ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, MoveOut);

            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(hexOf(1, 6))!));

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmOrdersMove",
                "UnOrderMove(unit-2/Allies)",
            ]);
        });

    });

});
