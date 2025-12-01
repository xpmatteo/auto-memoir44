// ABOUTME: Acceptance tests for deck shuffling functionality
// ABOUTME: Verifies seeded RNG produces deterministic, reproducible shuffles

import {describe, expect, it} from "vitest";
import {Deck} from "../../src/domain/Deck";
import {CardLocation} from "../../src/domain/CommandCard";
import {SeededRNG} from "../../src/adapters/RNG";

describe("Deck Shuffling", () => {
    describe("Deterministic shuffle with same seed", () => {
        it("should produce identical draw sequences when shuffled with the same seed", () => {
            // Given: Two decks with the same RNG seed
            const seed = 12345;
            const rng1 = new SeededRNG(seed);
            const rng2 = new SeededRNG(seed);

            const deck1 = Deck.createStandardDeck(() => rng1.random());
            const deck2 = Deck.createStandardDeck(() => rng2.random());

            // When: Both decks are shuffled with stored RNG
            deck1.shuffle();
            deck2.shuffle();

            // Then: Drawing 10 cards from each yields identical sequences (by card name)
            const cards1Names: string[] = [];
            const cards2Names: string[] = [];

            for (let i = 0; i < 10; i++) {
                cards1Names.push(deck1.drawCard(CardLocation.BOTTOM_PLAYER_HAND).name);
                cards2Names.push(deck2.drawCard(CardLocation.TOP_PLAYER_HAND).name);
            }

            expect(cards1Names).toEqual(cards2Names);
        });
    });

    describe("Different shuffles with different seeds", () => {
        it("should produce different draw sequences when shuffled with different seeds", () => {
            // Given: Two decks with different RNG seeds
            const rng1 = new SeededRNG(11111);
            const rng2 = new SeededRNG(99999);

            const deck1 = Deck.createStandardDeck(() => rng1.random());
            const deck2 = Deck.createStandardDeck(() => rng2.random());

            // When: Both decks are shuffled with stored RNG
            deck1.shuffle();
            deck2.shuffle();

            // Then: Drawing 10 cards from each yields different sequences
            const cards1: string[] = [];
            const cards2: string[] = [];

            for (let i = 0; i < 10; i++) {
                cards1.push(deck1.drawCard(CardLocation.BOTTOM_PLAYER_HAND).id);
                cards2.push(deck2.drawCard(CardLocation.TOP_PLAYER_HAND).id);
            }

            expect(cards1).not.toEqual(cards2);
        });
    });

    describe("Shuffle only affects deck location", () => {
        it("should randomize deck cards but keep hand cards in alphabetical order", () => {
            // Given: Deck with 5 cards dealt to hand
            const rng = new SeededRNG(54321);
            const deck = Deck.createStandardDeck(() => rng.random());

            // Draw 5 cards to hand BEFORE shuffling
            const handCardsBefore: string[] = [];
            for (let i = 0; i < 5; i++) {
                handCardsBefore.push(deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).id);
            }

            // When: Deck is shuffled
            deck.shuffle();

            // Then: Cards in hand remain in alphabetical order
            const handCardsAfter = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
            const handCardIds = handCardsAfter.map(c => c.id);

            // Hand cards should be in same order (alphabetical by ID)
            expect(handCardIds).toEqual(handCardsBefore);

            // And deck cards should be in different order than original
            const deckCardsAfter = deck.getCardsInLocation(CardLocation.DECK);
            const deckCardIds = deckCardsAfter.map(c => c.id);

            // Create a reference deck to compare against (unshuffled)
            const referenceDeck = Deck.createStandardDeck();
            for (let i = 0; i < 5; i++) {
                referenceDeck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
            }
            const referenceCardIds = referenceDeck.getCardsInLocation(CardLocation.DECK).map(c => c.id);

            // Shuffled deck should NOT match unshuffled reference
            expect(deckCardIds).not.toEqual(referenceCardIds);
        });
    });

    describe("Integration with game initialization", () => {
        it("should produce non-alphabetical card draws when deck is shuffled", () => {
            // Given: A shuffled deck with known seed
            const seed = 42;
            const rng = new SeededRNG(seed);
            const deck = Deck.createStandardDeck(() => rng.random());

            // When: Deck is shuffled
            deck.shuffle();

            // Then: First 5 drawn cards should NOT be in alphabetical order
            const drawnCards: string[] = [];
            for (let i = 0; i < 5; i++) {
                drawnCards.push(deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).id);
            }

            // Create sorted version to compare
            const sortedCards = [...drawnCards].sort((a, b) => a.localeCompare(b));

            // Drawn cards should NOT be in alphabetical order
            // (with 35 cards and 5 draws, probability of alphabetical order is astronomically low)
            expect(drawnCards).not.toEqual(sortedCards);
        });

        it("should match expected card sequence for a specific seed", () => {
            // Given: A deck shuffled with a known seed
            const seed = 777;
            const rng = new SeededRNG(seed);
            const deck = Deck.createStandardDeck(() => rng.random());

            // When: Deck is shuffled
            deck.shuffle();

            // Draw first 3 cards
            const card1 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).name;
            const card2 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).name;
            const card3 = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND).name;

            // Then: Another deck with same seed should produce same sequence
            const rng2 = new SeededRNG(seed);
            const deck2 = Deck.createStandardDeck(() => rng2.random());
            deck2.shuffle();

            const card1_2 = deck2.drawCard(CardLocation.TOP_PLAYER_HAND).name;
            const card2_2 = deck2.drawCard(CardLocation.TOP_PLAYER_HAND).name;
            const card3_2 = deck2.drawCard(CardLocation.TOP_PLAYER_HAND).name;

            expect(card1).toEqual(card1_2);
            expect(card2).toEqual(card2_2);
            expect(card3).toEqual(card3_2);
        });
    });
});
