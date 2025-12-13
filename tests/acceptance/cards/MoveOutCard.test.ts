// ABOUTME: Acceptance tests for MoveOut card
// ABOUTME: Tests infantry-specific ordering and fallback to any unit

import {expect, test, describe} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation} from "../../../src/domain/cards/CommandCard";
import {PlayCardMove, OrderUnitMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {parseAndSetupUnits} from "../../../src/scenarios/Scenario";
import {MoveOut} from "../../../src/domain/cards/MoveOut";
import {resetUnitIdCounter} from "../../../src/domain/Unit";

function setupGame(unitSetup: string[]) {
    resetUnitIdCounter();
    const deck = Deck.createFromComposition([[MoveOut, 10]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    parseAndSetupUnits(gameState, unitSetup);
    gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
    return gameState;
}

describe("MoveOut card", () => {

    test('Can only order infantry', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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

        const gameState = setupGame(unitSetup);

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "ConfirmOrdersMove",
            "OrderUnitMove(unit-3/Allies)",
            "OrderUnitMove(unit-4/Allies)",
        ]);
    });

    describe('If no infantry units, order any one unit', () => {

        test('All armor is available', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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

            const gameState = setupGame(unitSetup);

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
                "~~....    ....    ....    .ar.    ....    ....    ~~",
                "....    ....    .AR. AR .AR. AR ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ];

            const gameState = setupGame(unitSetup);
            gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(1, 6))!));

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmOrdersMove",
                "UnOrderMove(unit-2/Allies)",
            ]);
        });

    });

});
