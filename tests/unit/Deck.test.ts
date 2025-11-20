// ABOUTME: Unit tests for Deck class
// ABOUTME: Tests card location management and deck operations

import { describe, it, expect } from "vitest";
import { Deck } from "../../src/domain/Deck";
import { createCommandCard, CardLocation } from "../../src/domain/CommandCard";

describe("Deck", () => {
  describe("createStandardDeck", () => {
    it("should create a deck with 10 Probe Center cards", () => {
      const deck = Deck.createStandardDeck();
      const cardsInDeck = deck.getCardsInLocation(CardLocation.DECK);

      expect(cardsInDeck).toHaveLength(10);
      cardsInDeck.forEach((card) => {
        expect(card.name).toBe("Probe Center");
        expect(card.imagePath).toBe("images/cards/a5_probe_center.png");
        expect(card.location).toBe(CardLocation.DECK);
      });
    });

    it("should give each card a unique ID", () => {
      const deck = Deck.createStandardDeck();
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const ids = cards.map((card) => card.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
    });
  });

  describe("getCardsInLocation", () => {
    it("should return only cards in the specified location", () => {
      const cards = [
        createCommandCard("1", "Card A", "path/a.png", CardLocation.DECK),
        createCommandCard("2", "Card B", "path/b.png", CardLocation.BOTTOM_PLAYER_HAND),
        createCommandCard("3", "Card C", "path/c.png", CardLocation.DECK),
        createCommandCard("4", "Card D", "path/d.png", CardLocation.TOP_PLAYER_HAND),
      ];
      const deck = new Deck(cards);

      const deckCards = deck.getCardsInLocation(CardLocation.DECK);
      const bottomHandCards = deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);
      const topHandCards = deck.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);
      const discardCards = deck.getCardsInLocation(CardLocation.DISCARD_PILE);

      expect(deckCards).toHaveLength(2);
      expect(deckCards[0].id).toBe("1");
      expect(deckCards[1].id).toBe("3");

      expect(bottomHandCards).toHaveLength(1);
      expect(bottomHandCards[0].id).toBe("2");

      expect(topHandCards).toHaveLength(1);
      expect(topHandCards[0].id).toBe("4");

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
      const drawnCard = deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);

      expect(drawnCard).toBeNull();
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
      expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(5);
    });
  });

  describe("moveCard", () => {
    it("should move a specific card to new location", () => {
      const cards = [
        createCommandCard("card-1", "Card A", "path/a.png", CardLocation.DECK),
        createCommandCard("card-2", "Card B", "path/b.png", CardLocation.DECK),
        createCommandCard("card-3", "Card C", "path/c.png", CardLocation.BOTTOM_PLAYER_HAND),
      ];
      const deck = new Deck(cards);

      deck.moveCard("card-2", CardLocation.DISCARD_PILE);

      expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(1);
      expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(1);
      expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)[0].id).toBe("card-2");
    });

    it("should handle moving card that doesn't exist", () => {
      const deck = Deck.createStandardDeck();

      // Should not throw error
      deck.moveCard("non-existent-id", CardLocation.DISCARD_PILE);

      expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(0);
    });

    it("should move card from hand to discard pile", () => {
      const cards = [
        createCommandCard("card-1", "Card A", "path/a.png", CardLocation.BOTTOM_PLAYER_HAND),
      ];
      const deck = new Deck(cards);

      deck.moveCard("card-1", CardLocation.DISCARD_PILE);

      expect(deck.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(0);
      expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)).toHaveLength(1);
      expect(deck.getCardsInLocation(CardLocation.DISCARD_PILE)[0].id).toBe("card-1");
    });
  });

  describe("getCard", () => {
    it("should return card with matching ID", () => {
      const cards = [
        createCommandCard("card-1", "Card A", "path/a.png", CardLocation.DECK),
        createCommandCard("card-2", "Card B", "path/b.png", CardLocation.DECK),
      ];
      const deck = new Deck(cards);

      const card = deck.getCard("card-2");

      expect(card).toBeDefined();
      expect(card!.id).toBe("card-2");
      expect(card!.name).toBe("Card B");
    });

    it("should return undefined for non-existent card", () => {
      const deck = Deck.createStandardDeck();

      const card = deck.getCard("non-existent");

      expect(card).toBeUndefined();
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
      expect(deck.getCardsInLocation(CardLocation.DECK)).toHaveLength(0);
    });
  });
});
