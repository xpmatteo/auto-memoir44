// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {expect, test} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/CommandCard";
import {
    ConfirmOrdersMove,
    EndBattlesMove,
    EndMovementsMove,
    PlayCardMove,
    ReplenishHandMove
} from "../../src/domain/Move";
import {Position} from "../../src/domain/Player";
import {PhaseType} from "../../src/domain/phases/Phase";

test("Complete turn", () => {
    const deck = Deck.createFromComposition([[ProbeCenter, 60]])
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Act (1): bottom player plays a card
    expect(gameState.activePhase.type).toBe(PhaseType.PLAY_CARD);
    let playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
    gameState.executeMove(new PlayCardMove(playedCard));

    // Act (2): bottom player orders nothing and continues
    expect(gameState.activePhase.type).toBe(PhaseType.ORDER);
    expect(gameState.legalMoves()).toContainEqual(new ConfirmOrdersMove());
    gameState.executeMove(new ConfirmOrdersMove());

    // Act (3): bottom player moves nothing and continues
    expect(gameState.activePhase.type).toBe(PhaseType.MOVE);
    expect(gameState.legalMoves()).toContainEqual(new EndMovementsMove());
    gameState.executeMove(new EndMovementsMove());

    // Act (4): bottom player battles nothing and continues
    expect(gameState.activePhase.type).toBe(PhaseType.BATTLE);
    expect(gameState.legalMoves()).toContainEqual(new EndBattlesMove());
    gameState.executeMove(new EndBattlesMove());

    // Act (5): bottom player replenishes their hand
    expect(gameState.activePhase.type).toBe(PhaseType.REPLENISH_HAND);
    let replenishHandMove = new ReplenishHandMove(gameState.peekOneCard());
    expect(gameState.legalMoves()).toEqual([replenishHandMove]);
    gameState.executeMove(replenishHandMove);

    // Assert
    // - the played card is in the discards
    expect(gameState.getCardsInLocation(CardLocation.DISCARD_PILE)).toEqual([playedCard]);
    // - there is no activeCard
    expect(gameState.activeCard).toBeNull();
    // - the bottom player has 3 cards again
    expect(gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toHaveLength(3);
    // - the current phase is play a card for the top player
    expect(gameState.activePlayer.position).toBe(Position.TOP);
    expect(gameState.activePhase.name).toBe("Play Card");
    expect(gameState.legalMoves()).toEqual([
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[0]),
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[1]),
        new PlayCardMove(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)[2]),
    ]);
});
