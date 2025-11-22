// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {expect, test} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/CommandCard";
import {ConfirmOrdersMove, PlayCardMove} from "../../src/domain/Move";
import {Position} from "../../src/domain/Player";

test("Complete turn", () => {
    const deck = Deck.createFromComposition([[ProbeCenter, 60]])
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Act (1): bottom player plays a card
    gameState.executeMove(new PlayCardMove(gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0]));

    // Act (2): bottom player orders nothing and continues
    expect(gameState.legalMoves()).toContainEqual(new ConfirmOrdersMove());
    gameState.executeMove(new ConfirmOrdersMove());

    // Assert
    expect(gameState.activePlayer.position).toBe(Position.TOP);
    expect(gameState.activePhase.name).toBe("Play Card");
    expect(gameState.legalMoves()).toEqual([
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[0]),
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[1]),
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[2]),
    ]);
});
