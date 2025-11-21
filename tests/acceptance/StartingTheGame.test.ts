// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {AssaultLeft, CardLocation} from "../../src/domain/CommandCard";
import {PlayCardMove} from "../../src/domain/Move";
import {Position} from "../../src/domain/Player";

describe("At game start", () => {
    describe("Legal moves for each card played", () => {
        it("Cards available for bottom player", () => {
            let cards = [
                new AssaultLeft(),
                new AssaultLeft(),
                new AssaultLeft(),
            ];
            const deck = new Deck(cards);
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

            let actual = gameState.legalMoves();

            expect(gameState.activePlayer.position).toBe(Position.BOTTOM)
            expect(actual).toEqual([
                new PlayCardMove(cards[0]),
                new PlayCardMove(cards[1]),
                new PlayCardMove(cards[2]),
            ]);
        });
    });
});
