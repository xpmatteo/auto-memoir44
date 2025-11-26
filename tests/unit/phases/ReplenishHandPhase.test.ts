import {expect, test} from "vitest";
import {ReplenishHandPhase} from "../../../src/domain/phases/ReplenishHandPhase";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {TestCard} from "../Deck.test";
import {ReplenishHandMove} from "../../../src/domain/Move";


test('Replenish hand phase', () => {
    const card1 = new TestCard("card1", "path.png");
    const card2 = new TestCard("card2", "path.png");
    const deck = new Deck([card1, card2]);
    let gameState = new GameState(deck);
    let phase = new ReplenishHandPhase();

    let moves = phase.legalMoves(gameState);

    expect(moves).toEqual([new ReplenishHandMove(card1)])
});
