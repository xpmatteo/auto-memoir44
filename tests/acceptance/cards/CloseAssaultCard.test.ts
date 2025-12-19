// ABOUTME: Acceptance tests for armor unit movement
// ABOUTME: Tests armor-specific movement (0-3 hexes) and battle eligibility

import {expect, test, describe} from "vitest";
import {ConfirmOrdersMove, OrderUnitMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {CloseAssault} from "../../../src/domain/cards/CloseAssault";
import {setupGameForCommandCardTests} from "../../helpers/testHelpers";

describe("Close Assault card", () => {

    test('Can only order units adjacent to the enemy', () => {
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
        const gameState = setupGameForCommandCardTests(unitSetup, CloseAssault);

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ConfirmOrdersMove",
            "OrderUnitMove(unit-4/Allies)",
            "OrderUnitMove(unit-5/Allies)",
        ]);
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
            "....    ....    .IN. IN .IN. IN ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, CloseAssault);
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(3, 6))!));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(4, 6))!));

        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Infantry/Allies/unit-4, Infantry/Axis/unit-1, 4)",
            "Battle(Infantry/Allies/unit-5, Infantry/Axis/unit-1, 4)",
        ]);
    });

    test('Ordered units can no longer battle if the enemy is no longer adjacent', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    .in.    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    .IN. IN .IN. IN ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];
        const gameState = setupGameForCommandCardTests(unitSetup, CloseAssault);

        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(3, 6))!));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(4, 6))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
        ]);
    });

});
