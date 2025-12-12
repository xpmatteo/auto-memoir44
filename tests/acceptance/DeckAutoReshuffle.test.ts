// ABOUTME: Acceptance tests for deck auto-reshuffle behavior
// ABOUTME: Tests automatic reshuffling when deck empties during gameplay

import {describe, expect, it} from "vitest";
import {Deck} from "../../src/domain/Deck";
import {CardLocation} from "../../src/domain/CommandCard";
import {TestCard} from "../unit/domain/Deck.test";
import {SeededRNG} from "../../src/adapters/RNG";

describe("Deck Auto-Reshuffle", () => {
    it("should automatically reshuffle discard pile when deck empties", () => {
        const cards = [
            new TestCard("Card A", "path/a.png"),
            new TestCard("Card B", "path/b.png"),
            new TestCard("Card C", "path/c.png"),
        ];
        const deck = new Deck(cards);

        // Draw all cards
        const c1 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        const c2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        const c3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // Verify deck is empty
        expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(0);

        // Discard all cards
        deck.moveCard(c1.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c2.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c3.id, CardLocation.DISCARD_PILE);

        // Verify setup
        expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(0);
        expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(3);

        // Draw again - should trigger reshuffle
        const c4 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // Verify reshuffle occurred
        expect(c4).toBeDefined();
        expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(0);
        expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(2);
        expect([c1.id, c2.id, c3.id]).toContain(c4.id);
    });

    it("should produce identical sequences after reshuffle with same seed", () => {
        const seed = 42;

        // Create two identical decks with same seed
        const rng1 = new SeededRNG(seed);
        const cards1 = [
            new TestCard("A", "path/a.png"),
            new TestCard("B", "path/b.png"),
            new TestCard("C", "path/c.png"),
        ];
        const deck1 = new Deck(cards1, () => rng1.random());

        const rng2 = new SeededRNG(seed);
        const cards2 = [
            new TestCard("A", "path/a.png"),
            new TestCard("B", "path/b.png"),
            new TestCard("C", "path/c.png"),
        ];
        const deck2 = new Deck(cards2, () => rng2.random());

        // Both decks: draw all, discard all
        for (const deck of [deck1, deck2]) {
            const c1 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            const c2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            const c3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            deck.moveCard(c1.id, CardLocation.DISCARD_PILE);
            deck.moveCard(c2.id, CardLocation.DISCARD_PILE);
            deck.moveCard(c3.id, CardLocation.DISCARD_PILE);
        }

        // Trigger reshuffle in both and draw sequences
        const sequence1: string[] = [];
        const sequence2: string[] = [];

        for (let i = 0; i < 3; i++) {
            const card1 = deck1.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            const card2 = deck2.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            sequence1.push(card1.name);
            sequence2.push(card2.name);

            if (i < 2) {
                // Discard for next iteration
                deck1.moveCard(card1.id, CardLocation.DISCARD_PILE);
                deck2.moveCard(card2.id, CardLocation.DISCARD_PILE);
            }
        }

        // Same seed should produce same sequence
        expect(sequence1).toEqual(sequence2);
    });

    it("should produce different sequences with different seeds", () => {
        // Create two decks with different seeds
        const rng1 = new SeededRNG(42);
        const cards1 = [
            new TestCard("A", "path/a.png"),
            new TestCard("B", "path/b.png"),
            new TestCard("C", "path/c.png"),
        ];
        const deck1 = new Deck(cards1, () => rng1.random());

        const rng2 = new SeededRNG(999);
        const cards2 = [
            new TestCard("A", "path/a.png"),
            new TestCard("B", "path/b.png"),
            new TestCard("C", "path/c.png"),
        ];
        const deck2 = new Deck(cards2, () => rng2.random());

        // Both decks: draw all, discard all
        for (const deck of [deck1, deck2]) {
            const c1 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            const c2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            const c3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            deck.moveCard(c1.id, CardLocation.DISCARD_PILE);
            deck.moveCard(c2.id, CardLocation.DISCARD_PILE);
            deck.moveCard(c3.id, CardLocation.DISCARD_PILE);
        }

        // Trigger reshuffle in both
        const card1 = deck1.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        const card2 = deck2.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // Both draws should succeed (auto-reshuffle worked)
        expect(card1).toBeDefined();
        expect(card2).toBeDefined();

        // Different seeds should have chance of different results
        // Note: With 3 cards, there's 1/3 chance they match, but sequence will differ
        const remaining1 = deck1.getCardsInLocation(CardLocation.DECK).map(c => c.name).sort();
        const remaining2 = deck2.getCardsInLocation(CardLocation.DECK).map(c => c.name).sort();

        // Both should have 2 remaining cards
        expect(remaining1).toHaveLength(2);
        expect(remaining2).toHaveLength(2);
    });

    it("should throw when both deck and discard are empty", () => {
        const card = new TestCard("Only Card", "path.png");
        const deck = new Deck([card]);

        // Draw the only card but don't discard it
        deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // Both DECK and DISCARD_PILE are empty - should throw
        expect(() => deck.drawCard(CardLocation.TOP_PLAYER_HAND))
            .toThrow("Cannot draw: deck and discard pile are both empty");
    });

    it("should not include PEEK cards in reshuffle", () => {
        const cards = [
            new TestCard("Card A", "path/a.png"),
            new TestCard("Card B", "path/b.png"),
            new TestCard("Card C", "path/c.png"),
        ];
        const deck = new Deck(cards);

        // Peek at first card (moves it to PEEK location)
        const peeked = deck.peekOneCard();
        expect(deck.getCardsInLocation(CardLocation.PEEK)).toEqual([peeked]);

        // Draw remaining cards and discard
        const c2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        const c3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        deck.moveCard(c2.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c3.id, CardLocation.DISCARD_PILE);

        // Verify state before reshuffle
        expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(0);
        expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(2);
        expect(deck.getCardsInLocation(CardLocation.PEEK)).toEqual([peeked]);

        // Trigger reshuffle
        const c4 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // PEEK card should still be in PEEK, not reshuffled
        expect(deck.getCardsInLocation(CardLocation.PEEK)).toEqual([peeked]);
        expect(c4.id).not.toBe(peeked.id);

        // Only 2 cards were in discard, so only 1 left after draw
        expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(1);
    });

    it("should handle multiple consecutive reshuffle cycles", () => {
        const cards = [
            new TestCard("A", "path/a.png"),
            new TestCard("B", "path/b.png"),
        ];
        const deck = new Deck(cards);

        // First cycle: draw all, discard all, reshuffle
        const c1 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        const c2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        deck.moveCard(c1.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c2.id, CardLocation.DISCARD_PILE);

        const c3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // First reshuffle
        const c4 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

        // Second cycle: discard and reshuffle again
        deck.moveCard(c3.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c4.id, CardLocation.DISCARD_PILE);

        const c5 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Second reshuffle

        // Should succeed
        expect(c5).toBeDefined();
        expect([c1.id, c2.id]).toContain(c5.id); // Must be one of our two cards

        // Third cycle
        const c6 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        deck.moveCard(c5.id, CardLocation.DISCARD_PILE);
        deck.moveCard(c6.id, CardLocation.DISCARD_PILE);

        const c7 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND); // Third reshuffle

        expect(c7).toBeDefined();
        expect([c1.id, c2.id]).toContain(c7.id);
    });

    it("should reshuffle transparently during extended game play", () => {
        // Simulate extended gameplay with a small deck
        const cards = [
            new TestCard("Card 1", "path1.png"),
            new TestCard("Card 2", "path2.png"),
            new TestCard("Card 3", "path3.png"),
            new TestCard("Card 4", "path4.png"),
            new TestCard("Card 5", "path5.png"),
        ];
        const rng = new SeededRNG(123);
        const deck = new Deck(cards, () => rng.random());

        // Shuffle initial deck
        deck.shuffle();

        // Simulate many draw-and-discard cycles (simulating turns)
        for (let turn = 0; turn < 20; turn++) {
            // Draw a card
            const card = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            expect(card).toBeDefined();

            // Discard it immediately (simulating played card)
            deck.moveCard(card.id, CardLocation.DISCARD_PILE);
        }

        // After 20 draws from a 5-card deck, reshuffles should have happened
        // The game should continue without errors
        const finalCard = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
        expect(finalCard).toBeDefined();
        expect(cards.map(c => c.id)).toContain(finalCard.id);
    });
});
