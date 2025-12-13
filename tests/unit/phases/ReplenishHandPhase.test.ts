import {expect, test} from "vitest";
import {ReplenishHandPhase} from "../../../src/domain/phases/ReplenishHandPhase";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {TestCard} from "../domain/Deck.test";
import {ReplenishHandMove} from "../../../src/domain/moves/Move";
import {CardLocation} from "../../../src/domain/cards/CommandCard";


test('Replenish hand phase', () => {
    const card1 = new TestCard("card1", "path.png");
    const card2 = new TestCard("card2", "path.png");
    const deck = new Deck([card1, card2]);
    let gameState = new GameState(deck);
    let phase = new ReplenishHandPhase();

    let moves = phase.legalMoves(gameState);

    expect(moves).toEqual([new ReplenishHandMove(card1)])
});

test('calling legalMoves multiple times returns same card', () => {
    const card1 = new TestCard("card1", "path.png");
    const card2 = new TestCard("card2", "path.png");
    const deck = new Deck([card1, card2]);
    let gameState = new GameState(deck);
    let phase = new ReplenishHandPhase();

    const firstMoves = phase.legalMoves(gameState);
    const secondMoves = phase.legalMoves(gameState);

    expect(firstMoves).toEqual(secondMoves);
    expect(firstMoves[0]).toEqual(new ReplenishHandMove(card1));
});

test('executing move clears peek for next turn', () => {
    const card1 = new TestCard("card1", "path.png");
    const card2 = new TestCard("card2", "path.png");
    const deck = new Deck([card1, card2]);
    let gameState = new GameState(deck);
    let phase = new ReplenishHandPhase();

    const moves = phase.legalMoves(gameState);
    moves[0].execute(gameState);

    expect(gameState.getCardsInLocation(CardLocation.PEEK)).toEqual([]);
});
