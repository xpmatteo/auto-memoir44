// ABOUTME: Acceptance tests for armor unit movement
// ABOUTME: Tests armor-specific movement (0-3 hexes) and battle eligibility

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, CloseAssault, ProbeCenter} from "../../src/domain/CommandCard";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove} from "../../src/domain/moves/Move";
import {Infantry, Armor} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";
import {woodsTerrain} from "../../src/domain/terrain/Terrain";
import {MoveUnitMove} from "../../src/domain/moves/MoveUnitMove";
import {BattleMove} from "../../src/domain/moves/BattleMove";
import {parseAndSetupUnits} from "../../src/scenarios/Scenario";

function setupGame() {
    const deck = Deck.createFromComposition([[CloseAssault, 10]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    return {deck, gameState};
}

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

        const deck = Deck.createFromComposition([[CloseAssault, 10]]);
        const gameState = new GameState(deck);
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));

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

        const deck = Deck.createFromComposition([[CloseAssault, 10]]);
        const gameState = new GameState(deck);
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(3, 6))!));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(4, 6))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
            "Battle(Infantry/Allies, Infantry/Axis, 4)",
            "Battle(Infantry/Allies, Infantry/Axis, 4)",
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
        const {deck, gameState} = setupGame();
        parseAndSetupUnits(gameState, unitSetup);

        gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(3, 6))!));
        gameState.executeMove(new OrderUnitMove(gameState.getUnitAt(new HexCoord(4, 6))!));
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.legalMoves().map(m => m.toString())).toEqual([
            "EndBattles",
        ]);
    });

});
