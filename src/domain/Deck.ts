// ABOUTME: Deck manages all command cards and their locations
// ABOUTME: Single source of truth for card state (deck, discard, hands)

import {
  CommandCard,
  CardLocation,
  CardType,
  AssaultCenter,
  AssaultLeft,
  AssaultRight,
  AttackCenter,
  AttackLeft,
  AttackRight,
  ProbeCenter,
  ProbeLeft,
  ProbeRight,
  ReconCenter,
  ReconLeft,
  ReconRight,
} from "./CommandCard";

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
   * Create a deck from a composition specification
   * Composition is an array of [CardType, count] tuples
   */
  static createFromComposition(
    composition: Array<[new () => CardType, number]>
  ): Deck {
    const cards: CommandCard[] = [];
    let cardCounter = 0;

    for (const [CardTypeClass, count] of composition) {
      const cardType = new CardTypeClass();
      const baseName = cardType.name.toLowerCase().replace(/\s+/g, "-");

      for (let i = 1; i <= count; i++) {
        const id = `${baseName}-${++cardCounter}`;
        cards.push(cardType.createCard(id, CardLocation.DECK));
      }
    }

    return new Deck(cards);
  }

  /**
   * Create a standard deck with all command cards
   */
  static createStandardDeck(): Deck {
    return Deck.createFromComposition([
      // Assault cards (2 each)
      [AssaultCenter, 2],
      [AssaultLeft, 2],
      [AssaultRight, 2],

      // Attack cards (4 Center, 3 Left, 3 Right)
      [AttackCenter, 4],
      [AttackLeft, 3],
      [AttackRight, 3],

      // Probe cards (5 Center, 4 Left, 4 Right)
      [ProbeCenter, 5],
      [ProbeLeft, 4],
      [ProbeRight, 4],

      // Recon cards (2 each)
      [ReconCenter, 2],
      [ReconLeft, 2],
      [ReconRight, 2],
    ]);
  }
}
