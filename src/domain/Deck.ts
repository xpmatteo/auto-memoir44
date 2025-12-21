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
    ReconRight, PincerMove, ReconInForce, GeneralAdvance,
} from "./cards/CommandCard";
import {CloseAssault} from "./cards/CloseAssault";
import {Firefight} from "./cards/Firefight";
import {DirectFromHQ} from "./cards/DirectFromHQ";
import {MoveOut} from "./cards/MoveOut";
import {ArmorAssault} from "./cards/ArmorAssault";
import {AirPower} from "./cards/AirPower";
import {Barrage} from "./cards/Barrage";
import {DigIn} from "./cards/DigIn";
import {ArtilleryBombard} from "./cards/ArtilleryBombard";

export class Deck {
    private locations: Map<CardLocation, CommandCard[]>;
    private cardIds: Map<string, CommandCard>;
    private rng: () => number;

    constructor(cards: CommandCard[], rng: () => number = Math.random) {
        this.rng = rng;
        this.locations = new Map<CardLocation, CommandCard[]>();
        this.cardIds = new Map<string, CommandCard>();

        // Initialize all location arrays
        this.locations.set(CardLocation.DECK, [...cards]);
        this.locations.set(CardLocation.BOTTOM_PLAYER_HAND, []);
        this.locations.set(CardLocation.TOP_PLAYER_HAND, []);
        this.locations.set(CardLocation.DISCARD_PILE, []);
        this.locations.set(CardLocation.PEEK, []);

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
     * If DECK is empty, automatically moves DISCARD_PILE to DECK and shuffles
     * Draws from the front of the array
     */
    drawCard(toLocation: CardLocation): CommandCard {
        const deckCards = this.locations.get(CardLocation.DECK)!;

        // Auto-reshuffle if deck is empty
        if (deckCards.length === 0) {
            const discardPile = this.locations.get(CardLocation.DISCARD_PILE)!;

            if (discardPile.length === 0) {
                throw new Error("Cannot draw: deck and discard pile are both empty");
            }

            // Move all discard pile cards to deck
            deckCards.push(...discardPile);
            discardPile.length = 0;

            // Shuffle using stored RNG
            this.shuffle();
        }

        // Draw from deck
        const card = deckCards.shift()!;
        this.locations.get(toLocation)!.push(card);
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
     * Uses the RNG provided during construction
     */
    shuffle(): void {
        const deckCards = this.locations.get(CardLocation.DECK);
        if (!deckCards) return;

        // Fisher-Yates shuffle in-place
        for (let i = deckCards.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
        }
    }

    /**
     * Create a deck from a composition specification
     * Composition is an array of [CommandCard class, count] tuples
     */
    static createFromComposition(
        composition: Array<[new (location?: CardLocation) => CommandCard, number]>,
        rng?: () => number
    ): Deck {
        const cards: CommandCard[] = [];

        for (const [CardClass, count] of composition) {
            for (let i = 0; i < count; i++) {
                cards.push(new CardClass());
            }
        }
        return new Deck(cards, rng);
    }

    /**
     * Create a standard deck with all command cards
     */
    static createStandardDeck(rng?: () => number): Deck {
        /*
        To be added later:

        Ambush (1)

        Their Finest Hour (1)

        Behind Enemy Lines (1)

        Counter-Attack (2)

        Infantry Assault (2)
        Medics & Mechanics (1)

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

            [PincerMove, 1],
            [ReconInForce, 3],
            [GeneralAdvance, 1],

            [DirectFromHQ, 2],
            [MoveOut, 2],
            [ArmorAssault, 2],
            [Firefight, 1],
            [CloseAssault, 1],
            [AirPower, 1],
            [Barrage, 1],
            [DigIn, 1],
            [ArtilleryBombard, 100],
        ], rng);
    }

    peekCards(n: number): CommandCard[] {
        const peekLocation = this.locations.get(CardLocation.PEEK)!;

        // If we already have enough cards in PEEK, return them (idempotent!)
        if (peekLocation.length >= n) {
            return peekLocation.slice(0, n);
        }

        // Otherwise, draw only the remaining cards we need
        const remainingNeeded = n - peekLocation.length;
        for (let i = 0; i < remainingNeeded; i++) {
            this.drawCard(CardLocation.PEEK);
        }

        return peekLocation.slice(0, n);
    }

    peekOneCard(): CommandCard {
        const cards = this.peekCards(1);
        return cards[0];
    }

    /**
     * Create a deep clone of this Deck with independent card locations
     * Card instances themselves are shared (they're immutable)
     */
    clone(): Deck {
        // Get all cards (they're immutable, so references are safe)
        const allCards = Array.from(this.cardIds.values());
        const clonedDeck = new Deck(allCards, this.rng);

        // Clear default initialization (constructor puts all cards in DECK)
        clonedDeck.locations.clear();

        // Deep clone the locations map
        for (const [location, cards] of this.locations.entries()) {
            clonedDeck.locations.set(location, [...cards]);
        }

        return clonedDeck;
    }
}
