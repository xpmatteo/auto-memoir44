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
    const deckCards = this.getCardsInLocation(CardLocation.DECK);
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
   * Create a standard deck with all command cards
   */
  static createStandardDeck(): Deck {
    const cards: CommandCard[] = [];

    // Assault cards (2 each)
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `assault-center-${i}`,
          "Assault Center",
          "images/cards/a2_assault_center.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `assault-left-${i}`,
          "Assault Left",
          "images/cards/a2_assault_left.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `assault-right-${i}`,
          "Assault Right",
          "images/cards/a2_assault_right.png",
          CardLocation.DECK
        )
      );
    }

    // Attack cards (4 Center, 3 Left, 3 Right)
    for (let i = 1; i <= 4; i++) {
      cards.push(
        createCommandCard(
          `attack-center-${i}`,
          "Attack Center",
          "images/cards/a4_attack_center.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 3; i++) {
      cards.push(
        createCommandCard(
          `attack-left-${i}`,
          "Attack Left",
          "images/cards/a3_attack_left.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 3; i++) {
      cards.push(
        createCommandCard(
          `attack-right-${i}`,
          "Attack Right",
          "images/cards/a3_attack_right.png",
          CardLocation.DECK
        )
      );
    }

    // Probe cards (5 Center, 4 Left, 4 Right)
    for (let i = 1; i <= 5; i++) {
      cards.push(
        createCommandCard(
          `probe-center-${i}`,
          "Probe Center",
          "images/cards/a5_probe_center.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 4; i++) {
      cards.push(
        createCommandCard(
          `probe-left-${i}`,
          "Probe Left",
          "images/cards/a4_probe_left.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 4; i++) {
      cards.push(
        createCommandCard(
          `probe-right-${i}`,
          "Probe Right",
          "images/cards/a4_probe_right.png",
          CardLocation.DECK
        )
      );
    }

    // Recon cards (2 each)
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `recon-center-${i}`,
          "Recon Center",
          "images/cards/a4_recon_center.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `recon-left-${i}`,
          "Recon Left",
          "images/cards/a2_recon_left.png",
          CardLocation.DECK
        )
      );
    }
    for (let i = 1; i <= 2; i++) {
      cards.push(
        createCommandCard(
          `recon-right-${i}`,
          "Recon Right",
          "images/cards/a2_recon_right.png",
          CardLocation.DECK
        )
      );
    }

    return new Deck(cards);
  }
}
