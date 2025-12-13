// ABOUTME: Acceptance tests for armor unit movement
// ABOUTME: Tests armor-specific movement (0-3 hexes) and battle eligibility

import {expect, test, describe} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation, CloseAssault} from "../../../src/domain/CommandCard";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove, EndMovementsMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {parseAndSetupUnits} from "../../../src/scenarios/Scenario";

function setupGame() {
    const deck = Deck.createFromComposition([[CloseAssault, 10]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
    return gameState;
}

describe.skip("Armor Assault card", () => {

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

        const gameState = setupGame();
        parseAndSetupUnits(gameState, unitSetup);

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

            const gameState = setupGame();
            parseAndSetupUnits(gameState, unitSetup);

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

            const gameState = setupGame();
            parseAndSetupUnits(gameState, unitSetup);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(1, 6))!));

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmOrdersMove",
                "UnOrderUnitMove(unit-2/Allies)",
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

        const deck = Deck.createFromComposition([[CloseAssault, 10]]);
        const gameState = new GameState(deck);
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(3, 6))!));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(4, 6))!));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Armor/Allies, Infantry/Axis, 3)",
            "Battle(Armor/Allies, Infantry/Axis, 4)",
        ]);
    });

});
