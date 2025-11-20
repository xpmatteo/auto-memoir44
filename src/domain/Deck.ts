// ABOUTME: Deck manages all command cards and their locations
// ABOUTME: Single source of truth for card state (deck, discard, hands)

import { CommandCard, CardLocation, createCommandCard } from "./CommandCard";

export class Deck {
  private cards: CommandCard[];

  constructor(cards: CommandCard[]) {
    this.cards = cards;
  }

  /**
   * Get all cards currently in a specific location
   */
  getCardsInLocation(location: CardLocation): CommandCard[] {
    return this.cards.filter((card) => card.location === location);
  }

  /**
   * Draw a card from the deck to a new location
   * Returns the drawn card, or null if deck is empty
   */
  drawCard(toLocation: CardLocation): CommandCard | null {
    const deckCards = this.getCardsInLocation("Deck");
    if (deckCards.length === 0) {
      return null;
    }

    const card = deckCards[0];
    card.location = toLocation;
    return card;
  }

  /**
   * Move a specific card to a new location
   */
  moveCard(cardId: string, toLocation: CardLocation): void {
    const card = this.cards.find((c) => c.id === cardId);
    if (card) {
      card.location = toLocation;
    }
  }

  /**
   * Get a card by its ID
   */
  getCard(cardId: string): CommandCard | undefined {
    return this.cards.find((c) => c.id === cardId);
  }

  /**
   * Create a standard deck with 10 Probe Center cards
   */
  static createStandardDeck(): Deck {
    const cards: CommandCard[] = [];

    for (let i = 1; i <= 10; i++) {
      cards.push(
        createCommandCard(
          `probe-center-${i}`,
          "Probe Center",
          "images/cards/a5_probe_center.png",
          "Deck"
        )
      );
    }

    return new Deck(cards);
  }
}
