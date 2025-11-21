// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {describe, it, expect} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {AssaultLeft} from "../../src/domain/CommandCard";
import {CardLocation} from "../../src/domain/CommandCard";
import {PlayCardMove} from "../../src/domain/Move";
import {Position} from "../../src/domain/Player";

describe("At game start", () => {
    describe("Legal moves for each card played", () => {
        it("Cards available for bottom player", () => {
            const card1 = new AssaultLeft();
            const card2 = new AssaultLeft();
            const card3 = new AssaultLeft();
            const deck = new Deck([card1, card2, card3]);
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

            let actual = gameState.legalMoves();

            expect(gameState.activePlayer.position).toBe(Position.BOTTOM)
            expect(actual).toEqual([
                new PlayCardMove(card1),
                new PlayCardMove(card2),
                new PlayCardMove(card3),
            ]);
        });
    });
});
