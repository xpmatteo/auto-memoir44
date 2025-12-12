// ABOUTME: Acceptance tests for Firefight card
// ABOUTME: Tests ordering units NOT adjacent to enemies and battle with +1 die

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, Firefight} from "../../src/domain/CommandCard";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove} from "../../src/domain/moves/Move";
import {HexCoord} from "../../src/utils/hex";
import {parseAndSetupUnits} from "../../src/scenarios/Scenario";

function setupGame() {
    const deck = Deck.createFromComposition([[Firefight, 10]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    return {deck, gameState};
}

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

        const {deck, gameState} = setupGame();
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));

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

        const {deck, gameState} = setupGame();
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(2, 5))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Armor/Allies, Infantry/Axis, 4)",
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

        const {deck, gameState} = setupGame();
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(2, 5))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
        ]);
    });

});
