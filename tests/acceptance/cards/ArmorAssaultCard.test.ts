// ABOUTME: Acceptance tests for armor unit movement
// ABOUTME: Tests armor-specific movement (0-3 hexes) and battle eligibility

import {expect, test, describe} from "vitest";
import {ConfirmOrdersMove, OrderUnitMove, EndMovementsMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {ArmorAssault} from "../../../src/domain/cards/ArmorAssault";
import {getUnitAt, setupGameForCommandCardTests} from "../../helpers/testHelpers";


describe("Armor Assault card", () => {

    test('Can only order armor', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .IN. AR .AR. IN ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArmorAssault);

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ConfirmOrdersMove",
            "OrderUnitMove(unit-3/Allies)",
            "OrderUnitMove(unit-4/Allies)",
        ]);
    });

    describe('If no armor units, order any one unit', () => {

        test('All infantry is available', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .in.    ....    ....    ~~",
                "....    ....    .IN. IN .IN. IN ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, ArmorAssault);

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
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    .in.    ....    ....    ~~",
                "....    ....    .IN. IN .IN. IN ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];
            const gameState = setupGameForCommandCardTests(unitSetup, ArmorAssault);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(1, 6))!));

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmOrdersMove",
                "UnOrderMove(unit-2/Allies)",
            ]);
        });

    });


    test('Units in CC battle with one extra die', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .IN. AR .AR. IN ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, ArmorAssault);
        gameState.executeMove(new OrderUnitMove(getUnitAt(gameState, 2, 6).unit));
        gameState.executeMove(new OrderUnitMove(getUnitAt(gameState, 3, 6).unit));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());

        const battleMoves = gameState.legalMoves();
        expect(battleMoves.map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Armor/Allies, Infantry/Axis, 3)",
            "Battle(Armor/Allies, Infantry/Axis, 4)",
        ]);
    });

});
