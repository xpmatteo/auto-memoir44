// ABOUTME: Deck manages all command cards and their locations
// ABOUTME: Single source of truth for card state (deck, discard, hands)

import {
    CommandCard,
    CardLocation,
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
    private locations: Map<CardLocation, CommandCard[]>;
    private cardIds: Map<string, CommandCard>;

    constructor(cards: CommandCard[]) {
        this.locations = new Map<CardLocation, CommandCard[]>();
        this.cardIds = new Map<string, CommandCard>();

        // Initialize all location arrays
        this.locations.set(CardLocation.DECK, [...cards]);
        this.locations.set(CardLocation.BOTTOM_PLAYER_HAND, []);
        this.locations.set(CardLocation.TOP_PLAYER_HAND, []);
        this.locations.set(CardLocation.DISCARD_PILE, []);

        cards.forEach(card => {
            this.cardIds.set(card.id, card);
        });
    }

    /**
     * Get all cards currently in a specific location
     * Returns a copy of the array to prevent external mutation
     * Bottom player hand is always returned sorted by card ID
     */
    getCardsInLocation(location: CardLocation): CommandCard[] {
        const cards = [...(this.locations.get(location) ?? [])];
        if (location === CardLocation.BOTTOM_PLAYER_HAND) {
            cards.sort((a, b) => a.id.localeCompare(b.id));
        }
        return cards;
    }

    /**
     * Draw a card from the deck to a new location
     * Draws from the front of the deck array
     */
    drawCard(toLocation: CardLocation): CommandCard {
        const deckCards = this.locations.get(CardLocation.DECK);
        if (!deckCards || deckCards.length === 0) {
            throw new Error("Deck is depleted, cannot draw");
        }

        const card = deckCards.shift()!; // Remove from front
        this.locations.get(toLocation)!.push(card); // Add to end
        return card;
    }

    /**
     * Move a specific card to a new location
     */
    moveCard(cardId: string, toLocation: CardLocation): void {
        const card = this.cardIds.get(cardId);
        if (!card) {
            throw new Error(`No card with id ${cardId}`);
        }

        // Find and remove from current location
        for (const [, cards] of this.locations.entries()) {
            const index = cards.indexOf(card);
            if (index !== -1) {
                cards.splice(index, 1);
                break;
            }
        }

        // Add to new location
        this.locations.get(toLocation)!.push(card);
    }

    /**
     * Get a card by its ID
     */
    getCard(cardId: string): CommandCard {
        const card = this.cardIds.get(cardId);
        if (!card) {
            throw new Error(`No card with id ${cardId}`);
        }
        return card;
    }

    /**
     * Shuffle the deck using Fisher-Yates algorithm
     * Only shuffles cards in the DECK location
     * @param rng Random number generator function returning [0, 1)
     */
    shuffle(rng: () => number): void {
        const deckCards = this.locations.get(CardLocation.DECK);
        if (!deckCards) return;

        // Fisher-Yates shuffle in-place
        for (let i = deckCards.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
        }
    }

    /**
     * Create a deck from a composition specification
     * Composition is an array of [CommandCard class, count] tuples
     */
    static createFromComposition(
        composition: Array<[new (location?: CardLocation) => CommandCard, number]>
    ): Deck {
        const cards: CommandCard[] = [];

        for (const [CardClass, count] of composition) {
            for (let i = 0; i < count; i++) {
                cards.push(new CardClass());
            }
        }
        return new Deck(cards);
    }

    /**
     * Create a standard deck with all command cards
     */
    static createStandardDeck(): Deck {
        /*
        To be added later:

        General Advance (1)
        Recon In Force (3)
        Pincer Move (1)
        Their Finest Hour (1)

        Armor Assault (2)

        Artillery Bombard (1)
        Barrage (1)
        Behind Enemy Lines (1)

        Close Assault (1)
        Counter-Attack (2)
        Dig-In (1)

        Direct From HQ (2)
        Firefight (1)
        Infantry Assault (2)
        Medics & Mechanics (1)
        Move Out! (2)

        Total: 60 cards
         */

        return Deck.createFromComposition([
            [AssaultLeft, 2],
            [AttackLeft, 3],
            [ProbeLeft, 4],
            [ReconLeft, 2],

            [AssaultCenter, 2],
            [AttackCenter, 4],
            [ProbeCenter, 5],
            [ReconCenter, 2],

            [AssaultRight, 2],
            [AttackRight, 3],
            [ReconRight, 2],
            [ProbeRight, 4],
        ]);
    }
}
