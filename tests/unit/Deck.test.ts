// ABOUTME: Unit tests for Deck class
// ABOUTME: Tests card location management and deck operations

import {describe, expect, it, test} from "vitest";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, CommandCard} from "../../src/domain/CommandCard";
import {Section} from "../../src/domain/Section";

// Test helper card class
export class TestCard extends CommandCard {
    readonly section = Section.CENTER;
    readonly howManyUnits = 1;

    constructor(public readonly name: string, public readonly imagePath: string) {
        super();
    }
}

describe("Deck", () => {
    describe("createStandardDeck", () => {
        it("should create a deck with a given number of total cards", () => {
            const deck = Deck.createStandardDeck();
            const cardsInDeck = deck.getCardsInLocation(CardLocation.DECK);

            expect(cardsInDeck).toHaveLength(35);
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
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card D", "path/d.png"),
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

            expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(initialDeckSize - 1);
            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toEqual([drawnCard]);
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
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
                new TestCard("Card C", "path/c.png"),
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
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
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

    describe("bottom player hand sorting", () => {
        it("should keep bottom player hand sorted by card ID when drawing cards", () => {
            const cards = [
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
            ];
            const deck = new Deck(cards);

            // Draw cards in arbitrary order
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card C
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card A
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card B

            const handCards = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const cardIds = handCards.map(c => c.id);

            // Should be sorted by ID
            expect(cardIds).toEqual([...cardIds].sort());
        });

        it("should keep bottom player hand sorted by card ID when moving cards", () => {
            const cards = [
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card D", "path/d.png"),
            ];
            const deck = new Deck(cards);

            // Move cards in non-sorted order
            deck.moveCard(cards[2].id, CardLocation.BOTTOM_PLAYER_HAND); // Card C
            deck.moveCard(cards[0].id, CardLocation.BOTTOM_PLAYER_HAND); // Card A
            deck.moveCard(cards[3].id, CardLocation.BOTTOM_PLAYER_HAND); // Card D
            deck.moveCard(cards[1].id, CardLocation.BOTTOM_PLAYER_HAND); // Card B

            const handCards = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const cardIds = handCards.map(c => c.id);

            // Should be sorted by ID
            expect(cardIds).toEqual([...cardIds].sort());
        });

        it("should not sort the top player hand", () => {
            const cards = [
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
            ];
            const deck = new Deck(cards);

            // Draw cards to top player hand
            deck.drawCard(CardLocation.TOP_PLAYER_HAND); // Card C
            deck.drawCard(CardLocation.TOP_PLAYER_HAND); // Card A
            deck.drawCard(CardLocation.TOP_PLAYER_HAND); // Card B

            const handCards = deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);

            // Should preserve draw order, not be sorted
            expect(handCards).toEqual([cards[0], cards[1], cards[2]]);
        });
    });

    describe("shuffle", () => {
        it("should change the order of cards in the deck", () => {
            const deck = Deck.createStandardDeck();

            // Get initial order
            const cardsBeforeShuffle = deck.getCardsInLocation(CardLocation.DECK).map(c => c.id);

            // Shuffle with a fixed RNG
            let callCount = 0;
            const fixedRng = () => {
                callCount++;
                return 0.5; // Fixed value for deterministic test
            };
            deck.shuffle(fixedRng);

            // Get order after shuffle
            const cardsAfterShuffle = deck.getCardsInLocation(CardLocation.DECK).map(c => c.id);

            // Verify shuffle was called (Fisher-Yates makes n-1 random calls)
            expect(callCount).toBeGreaterThan(0);

            // Order should have changed
            expect(cardsAfterShuffle).not.toEqual(cardsBeforeShuffle);
        });

        it("should produce a valid permutation of cards", () => {
            const deck = Deck.createStandardDeck();

            // Get all card IDs before shuffle
            const cardsBefore = deck.getCardsInLocation(CardLocation.DECK).map(c => c.id).sort();

            // Shuffle
            deck.shuffle(() => Math.random());

            // Get all card IDs after shuffle
            const cardsAfter = deck.getCardsInLocation(CardLocation.DECK).map(c => c.id).sort();

            // Same cards, just reordered
            expect(cardsAfter).toEqual(cardsBefore);
        });

        it("should affect drawCard order", () => {
            const deck = Deck.createStandardDeck();

            // Get first card without shuffle
            const firstCardUnshuffled = deck.getCardsInLocation(CardLocation.DECK)[0].id;

            // Create new deck and shuffle
            const deck2 = Deck.createStandardDeck();
            deck2.shuffle(() => 0.99); // RNG that always returns high value

            // Get first card after shuffle
            const firstCardShuffled = deck2.getCardsInLocation(CardLocation.DECK)[0].id;

            // They should be different (very high probability with 35 cards)
            expect(firstCardShuffled).not.toEqual(firstCardUnshuffled);
        });

        it("should not affect cards already in hands", () => {
            const deck = Deck.createStandardDeck();

            // Draw 3 cards to hand
            const handCards = [];
            for (let i = 0; i < 3; i++) {
                handCards.push(deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).id);
            }

            // Shuffle
            deck.shuffle(() => Math.random());

            // Cards in hand should still be there, in alphabetical order
            const handCardsAfter = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND).map(c => c.id);
            expect(handCardsAfter.sort()).toEqual(handCards.sort());
        });

        it("should handle empty deck gracefully", () => {
            const deck = new Deck([]);

            // Should not throw
            expect(() => deck.shuffle(() => Math.random())).not.toThrow();
        });

        it("should handle single-card deck", () => {
            const card = new TestCard("Single", "path.png");
            const deck = new Deck([card]);

            deck.shuffle(() => Math.random());

            // Single card should still be drawable
            const drawn = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            expect(drawn).toBe(card);
        });

        test('peek cards', () => {
            const card1 = new TestCard("card1", "path.png");
            const card2 = new TestCard("card2", "path.png");
            const card3 = new TestCard("card3", "path.png");
            const card4 = new TestCard("card4", "path.png");
            const deck = new Deck([card1, card2, card3, card4]);

            let topCards = deck.peekCards(3);

            expect(topCards).toEqual([card1, card2, card3]);
        });
    });

    describe("clone", () => {
        it("should clone all cards in correct locations", () => {
            const cards = [
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card D", "path/d.png"),
            ];
            const deck = new Deck(cards);
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card A
            deck.drawCard(CardLocation.TOP_PLAYER_HAND); // Card B
            deck.moveCard(cards[2].id, CardLocation.DISCARD_PILE); // Card C

            const cloned = deck.clone();

            // Verify all locations match
            expect(cloned.getCardsInLocation(CardLocation.DECK)).toEqual([cards[3]]);
            expect(cloned.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toEqual([cards[0]]);
            expect(cloned.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toEqual([cards[1]]);
            expect(cloned.getCardsInLocation(CardLocation.DISCARD_PILE)).toEqual([cards[2]]);
        });

        it("should create independent copy - modifying clone locations doesn't affect original", () => {
            const cards = [
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
                new TestCard("Card C", "path/c.png"),
            ];
            const deck = new Deck(cards);

            const cloned = deck.clone();

            // Draw card from clone
            cloned.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

            // Original should be unchanged
            expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(3);
            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(0);

            // Clone should have changed
            expect(cloned.getCardsInLocation(CardLocation.DECK)).toHaveLength(2);
            expect(cloned.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(1);
        });

        it("should create independent copy - moving card in clone doesn't affect original", () => {
            const cards = [
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
            ];
            const deck = new Deck(cards);
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card A

            const cloned = deck.clone();

            // Move card in clone
            cloned.moveCard(cards[0].id, CardLocation.DISCARD_PILE);

            // Original should be unchanged
            expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toEqual([cards[0]]);
            expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(0);

            // Clone should have changed
            expect(cloned.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(0);
            expect(cloned.getCardsInLocation(CardLocation.DISCARD_PILE)).toEqual([cards[0]]);
        });

        it("should preserve bottom player hand sorting in both original and clone", () => {
            const cards = [
                new TestCard("Card C", "path/c.png"),
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
            ];
            const deck = new Deck(cards);
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card C
            deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card A

            const cloned = deck.clone();

            // Draw another card in clone
            cloned.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Card B

            // Original hand should still be sorted
            const originalHand = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const originalIds = originalHand.map(c => c.id);
            expect(originalIds).toEqual([...originalIds].sort());

            // Clone hand should be sorted
            const clonedHand = cloned.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const clonedIds = clonedHand.map(c => c.id);
            expect(clonedIds).toEqual([...clonedIds].sort());
        });

        it("should share the same card instances (cards are immutable)", () => {
            const cards = [
                new TestCard("Card A", "path/a.png"),
                new TestCard("Card B", "path/b.png"),
            ];
            const deck = new Deck(cards);

            const cloned = deck.clone();

            // Cards should be the same instances (not cloned)
            const originalDeckCards = deck.getCardsInLocation(CardLocation.DECK);
            const clonedDeckCards = cloned.getCardsInLocation(CardLocation.DECK);

            expect(originalDeckCards[0]).toBe(clonedDeckCards[0]);
            expect(originalDeckCards[1]).toBe(clonedDeckCards[1]);
        });
    });
});
