import {describe, expect, test} from "vitest";
import { ReplenishHandMove} from "../../../src/domain/moves/Move";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation} from "../../../src/domain/CommandCard";

describe("ReplenishHandMove", () => {
    test('aaa', () => {
        let deck = Deck.createStandardDeck();
        let card = deck.peekOneCard();
        let gameState = new GameState(deck);
        let move = new ReplenishHandMove(card);
        expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toEqual([]);

        move.execute(gameState);

        expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toEqual([card]);
    });
});
