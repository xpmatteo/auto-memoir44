import {describe, expect, test} from "vitest";
import {ReplenishHandDrawTwoChooseOnePhase} from "../../../src/domain/phases/ReplenishHandDrawTwoChooseOnePhase";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {TestCard} from "../domain/Deck.test";
import {CardLocation} from "../../../src/domain/cards/CommandCard";
import {PlayCardPhase} from "../../../src/domain/phases/PlayCardPhase";

describe("ReplenishHandDrawTwoChooseOnePhase", () => {
    const card1 = new TestCard("Card 1", "path1.png");
    const card2 = new TestCard("Card 2", "path2.png");
    const card3 = new TestCard("Card 3", "path3.png");

    test("returns two moves, one for each of the top 2 cards", () => {
        const deck = new Deck([card1, card2, card3]);
        const gameState = new GameState(deck);
        const phase = new ReplenishHandDrawTwoChooseOnePhase();

        const moves = phase.legalMoves(gameState);

        expect(moves.map(m => m.toString())).toEqual([
            "ReplenishHandChooseCardMove(Card 1, Card 2)",
            "ReplenishHandChooseCardMove(Card 2, Card 1)",
        ]);
    });

    test("choosing first card draws it to hand and discards the second", () => {
        const deck = new Deck([card1, card2, card3]);
        const gameState = new GameState(deck);

        // Push the phase onto the stack
        const phase = new ReplenishHandDrawTwoChooseOnePhase();
        gameState.pushPhase(phase);

        // Get moves and choose the first card
        const moves = phase.legalMoves(gameState);
        const chooseFirstCard = moves[0];
        chooseFirstCard.execute(gameState);

        // Verify card1 is in hand
        const hand = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
        expect(hand).toContain(card1);
        expect(hand).not.toContain(card2);

        // Verify card2 is in discard pile
        const discardPile = gameState.getCardsInLocation(CardLocation.DISCARD_PILE);
        expect(discardPile).toContain(card2);

        // Verify phase was popped (should be back to PlayCardPhase)
        expect(gameState.activePhase).toBeInstanceOf(PlayCardPhase);
    });

    test("choosing second card draws it to hand and discards the first", () => {
        const deck = new Deck([card1, card2, card3]);
        const gameState = new GameState(deck);

        // Push the phase onto the stack
        const phase = new ReplenishHandDrawTwoChooseOnePhase();
        gameState.pushPhase(phase);

        // Get moves and choose the second card
        const moves = phase.legalMoves(gameState);
        const chooseSecondCard = moves[1];
        chooseSecondCard.execute(gameState);

        // Verify card2 is in hand
        const hand = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
        expect(hand).toContain(card2);
        expect(hand).not.toContain(card1);

        // Verify card1 is in discard pile
        const discardPile = gameState.getCardsInLocation(CardLocation.DISCARD_PILE);
        expect(discardPile).toContain(card1);

        // Verify phase was popped (should be back to PlayCardPhase)
        expect(gameState.activePhase).toBeInstanceOf(PlayCardPhase);
    });

    test("uiButton returns correct label for each card", () => {
        const card1 = new TestCard("Probe Left", "path1.png");
        const card2 = new TestCard("Attack Right", "path2.png");
        const deck = new Deck([card1, card2]);
        const gameState = new GameState(deck);
        const phase = new ReplenishHandDrawTwoChooseOnePhase();

        const moves = phase.legalMoves(gameState);
        const buttons1 = moves[0].uiButton();
        const buttons2 = moves[1].uiButton();

        expect(buttons1).toHaveLength(1);
        expect(buttons1[0].label).toBe('Draw "Probe Left"');

        expect(buttons2).toHaveLength(1);
        expect(buttons2[0].label).toBe('Draw "Attack Right"');
    });

    test("both buttons are shown simultaneously", () => {
        const card1 = new TestCard("Probe Left", "path1.png");
        const card2 = new TestCard("Attack Right", "path2.png");
        const deck = new Deck([card1, card2]);
        const gameState = new GameState(deck);
        const phase = new ReplenishHandDrawTwoChooseOnePhase();

        const moves = phase.legalMoves(gameState);

        // Collect all buttons from all moves (this is what MoveButtons component does)
        const allButtons: Array<{ label: string }> = [];
        moves.forEach(move => {
            const buttons = move.uiButton();
            allButtons.push(...buttons);
        });

        expect(allButtons).toHaveLength(2);
        expect(allButtons[0].label).toBe('Draw "Probe Left"');
        expect(allButtons[1].label).toBe('Draw "Attack Right"');
    });

    test('calling legalMoves multiple times returns same cards', () => {
        const card1 = new TestCard("Card 1", "path1.png");
        const card2 = new TestCard("Card 2", "path2.png");
        const card3 = new TestCard("Card 3", "path3.png");
        const deck = new Deck([card1, card2, card3]);
        const gameState = new GameState(deck);
        const phase = new ReplenishHandDrawTwoChooseOnePhase();

        const firstMoves = phase.legalMoves(gameState);
        const secondMoves = phase.legalMoves(gameState);

        expect(firstMoves).toEqual(secondMoves);
    });

    test('executing move clears peek for next turn', () => {
        const card1 = new TestCard("Card 1", "path1.png");
        const card2 = new TestCard("Card 2", "path2.png");
        const card3 = new TestCard("Card 3", "path3.png");
        const deck = new Deck([card1, card2, card3]);
        const gameState = new GameState(deck);
        const phase = new ReplenishHandDrawTwoChooseOnePhase();

        gameState.pushPhase(phase);
        const moves = phase.legalMoves(gameState);
        moves[0].execute(gameState);

        expect(gameState.getCardsInLocation(CardLocation.PEEK)).toEqual([]);
    });
});
