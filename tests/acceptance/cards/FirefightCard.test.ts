// ABOUTME: Acceptance tests for Firefight card
// ABOUTME: Tests ordering units NOT adjacent to enemies and battle with +1 die

import {expect, test, describe} from "vitest";
import {ConfirmOrdersMove, OrderUnitMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {Firefight} from "../../../src/domain/cards/Firefight";
import {setupGameForCommandCardTests} from "../../helpers/testHelpers";


describe("Firefight card", () => {

    test('Can only order units NOT adjacent to the enemy', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    .in.    ....    ....    ~~",
            "....    ....    .AR. AR .AR. AR ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, Firefight);

        // Units at (3,6) and (4,6) are adjacent to enemy at (4,5), so they cannot be ordered
        // Units at (2,6) and (5,6) are NOT adjacent to any enemy, so they can be ordered
        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ConfirmOrdersMove",
            "OrderUnitMove(unit-2/Allies)",
            "OrderUnitMove(unit-3/Allies)",
        ]);
    });

    test('Units battle with one extra die', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    .AR.    .in.    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, Firefight);
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(2, 5))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Armor/Allies/unit-1, Infantry/Axis/unit-2, 4)",
        ]);
    });

    // See FAQ
    test('Units cannot battle if enemy adjacent', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    .AR. in ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, Firefight);

        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(2, 5))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
        ]);
    });

});
