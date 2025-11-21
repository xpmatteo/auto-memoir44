// ABOUTME: Unit tests for Deck class
// ABOUTME: Tests card location management and deck operations

import {describe, expect, it} from "vitest";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, CommandCard} from "../../src/domain/CommandCard";

// Test helper card class
class TestCard extends CommandCard {
    constructor(public readonly name: string, public readonly imagePath: string, location: CardLocation = CardLocation.DECK) {
        super(location);
    }
}

describe("Deck", () => {
    describe("createStandardDeck", () => {
        it("should create a deck with a given number of total cards", () => {
            const deck = Deck.createStandardDeck();
            const cardsInDeck = deck.getCardsInLocation(CardLocation.DECK);

            expect(cardsInDeck).toHaveLength(35);
            cardsInDeck.forEach((card) => {
                expect(card.location).toBe(CardLocation.DECK);
            });
        });

        it("should give each card a unique ID", () => {
            const deck = Deck.createStandardDeck();
            const cards = deck.getCardsInLocation(CardLocation.DECK);
            const ids = cards.map((card) => card.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(35);
        });
    });

    describe("getCardsInLocation", () => {
        it("should return only cards in the specified location", () => {
            const cards = [
                new TestCard("Card A", "path/a.png", CardLocation.DECK),
                new TestCard("Card B", "path/b.png", CardLocation.DECK),
                new TestCard("Card C", "path/c.png", CardLocation.DECK),
                new TestCard("Card D", "path/d.png", CardLocation.DECK),
            ];
            const deck = new Deck(cards);
            deck.moveCard(cards[1].id, CardLocation.BOTTOM_PLAYER_HAND)
            deck.moveCard(cards[3].id, CardLocation.TOP_PLAYER_HAND)

            const deckCards = deck.getCardsInLocation(CardLocation.DECK);
            const bottomHandCards = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const topHandCards = deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);
            const discardCards = deck.getCardsInLocation(CardLocation.DISCARD_PILE);

            expect(deckCards).toEqual([cards[0], cards[2]]);
            expect(bottomHandCards).toEqual([cards[1]]);
            expect(topHandCards).toEqual([cards[3]]);
            expect(discardCards).toHaveLength(0);
        });

        it("should return empty array when no cards in location", () => {
            const deck = Deck.createStandardDeck();
            const handCards = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

            expect(handCards).toHaveLength(0);
        });
    });

    describe("drawCard", () => {
        it("should move first card from Deck to specified location", () => {
            const deck = Deck.createStandardDeck();
            const initialDeckSize = deck.getCardsInLocation(CardLocation.DECK).length;

            const drawnCard = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

            expect(drawnCard).not.toBeNull();
            expect(drawnCard!.location).toBe(CardLocation.BOTTOM_PLAYER_HAND);
            expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(initialDeckSize - 1);
            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(1);
        });

        it("should return null when deck is empty", () => {
            const deck = new Deck([]);
            expect(() => deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND)).toThrow();
        });

        it("should draw multiple cards to different locations", () => {
            const deck = Deck.createStandardDeck();

            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            deck.drawCard(CardLocation.TOP_PLAYER_HAND);
            deck.drawCard(CardLocation.TOP_PLAYER_HAND);
            deck.drawCard(CardLocation.TOP_PLAYER_HAND);

            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(2);
            expect(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toHaveLength(3);
            expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(30);
        });
    });

    describe("moveCard", () => {
        it("should move a specific card to new location", () => {
            const cards = [
                new TestCard("Card A", "path/a.png", CardLocation.DECK),
                new TestCard("Card B", "path/b.png", CardLocation.DECK),
                new TestCard("Card C", "path/c.png", CardLocation.DECK),
            ];
            const deck = new Deck(cards);

            deck.moveCard(cards[1].id, CardLocation.DISCARD_PILE);

            expect(deck.getCardsInLocation(CardLocation.DECK)).toEqual([cards[0], cards[2]]);
            expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toEqual([cards[1]]);
        });

        it("should handle moving card that doesn't exist", () => {
            const deck = Deck.createStandardDeck();

            expect(() => deck.moveCard("non-existent-id", CardLocation.DISCARD_PILE)).toThrow();

            expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(0);
        });
    });

    describe("getCard", () => {
        it("should return card with matching ID", () => {
            const cards = [
                new TestCard("Card A", "path/a.png", CardLocation.DECK),
                new TestCard("Card B", "path/b.png", CardLocation.DECK),
            ];
            const deck = new Deck(cards);

            const card = deck.getCard(cards[1].id);

            expect(card).toBeDefined();
            expect(card).toBe(cards[1]);
            expect(card!.name).toBe("Card B");
        });

        it("should return undefined for non-existent card", () => {
            const deck = Deck.createStandardDeck();

            expect(() => deck.getCard("non-existent")).toThrow();
        });
    });

    describe("integration: dealing initial hands", () => {
        it("should correctly deal 5 cards to each player", () => {
            const deck = Deck.createStandardDeck();

            // Deal 5 cards to bottom player
            for (let i = 0; i < 5; i++) {
                deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            }

            // Deal 5 cards to top player
            for (let i = 0; i < 5; i++) {
                deck.drawCard(CardLocation.TOP_PLAYER_HAND);
            }

            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(5);
            expect(deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toHaveLength(5);
            expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(25);
        });
    });
});
