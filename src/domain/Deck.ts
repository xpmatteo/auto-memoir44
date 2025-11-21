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
    private cardLocations: Map<CommandCard, CardLocation>;
    private cardIds: Map<string, CommandCard>;

    constructor(cards: CommandCard[]) {
        this.cardLocations = new Map<CommandCard, CardLocation>();
        this.cardIds = new Map<string, CommandCard>();
        cards.forEach(card => {
            this.cardLocations.set(card, CardLocation.DECK)
            this.cardIds.set(card.id, card)
        });
    }

    /**
     * Get all cards currently in a specific location
     */
    getCardsInLocation(desiredLocation: CardLocation): CommandCard[] {
        let result = new Array<CommandCard>();
        this.cardLocations.forEach((location, card) => {
            if (location === desiredLocation) {
                result.push(card);
            }
        });
        result.sort((a,b) => {
            return a.id.localeCompare(b.id);
        });
        return result;
    }

    /**
     * Draw a card from the deck to a new location
     * Returns the drawn card, or null if deck is empty
     */
    drawCard(toLocation: CardLocation): CommandCard {
        const deckCards = this.getCardsInLocation(CardLocation.DECK);
        if (deckCards.length === 0) {
            throw new Error("Deck is depleted, cannot draw");
        }

        const card = deckCards[0];
        this.moveCard(card.id, toLocation);
        return card;
    }

    /**
     * Move a specific card to a new location
     */
    moveCard(cardId: string, toLocation: CardLocation): void {
        let card = this.cardIds.get(cardId);
        if (!card) {
            throw new Error(`No card with id ${cardId}`);
        }
        this.cardLocations.set(card, toLocation);
    }

    /**
     * Get a card by its ID
     */
    getCard(cardId: string): CommandCard | undefined {
        let card = this.cardIds.get(cardId);
        if (!card) {
            throw new Error(`No card with id ${cardId}`);
        }
        return card;
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
                cards.push(new CardClass(CardLocation.DECK));
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
            // Recon cards (2 each)
            [ReconCenter, 2],
            [ReconLeft, 2],
            [ReconRight, 2],

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
        ]);
    }
}
