// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

import {GameState} from "../GameState";
import {BattleMove} from "../moves/BattleMove";
import {Unit} from "../Unit";

export const CardLocation = {
    DECK: "Deck",
    DISCARD_PILE: "DiscardPile",
    BOTTOM_PLAYER_HAND: "BottomPlayerHand",
    TOP_PLAYER_HAND: "TopPlayerHand",
    PEEK: "Peek",
} as const;

export type CardLocation = typeof CardLocation[keyof typeof CardLocation];

let nextCardId = 1;

/**
 * Base class for all command cards
 */
export abstract class CommandCard {
    readonly id: string;
    abstract readonly name: string;
    abstract readonly imagePath: string;

    constructor() {
        let idString = nextCardId < 10 ? `0${nextCardId}` : nextCardId;
        this.id = `card-${idString}`;
        nextCardId++;
    }

    abstract onCardPlayed(gameState: GameState): void;

    fixBattleMoves(moves: BattleMove[], _gameState: GameState): BattleMove[] {
        // Base implementation: do nothing, return moves as-is
        return moves;
    }

    fixUnitMaxMovement(unit: Unit): number {
        // Base implementation: do nothing, return default
        return unit.maxMovementDistance();
    }

    fixUnitMovementSkipsBattle(unit: Unit, distance: number): boolean {
        // Base implementation: do nothing, return default
        return unit.movementSkipsBattle(distance);
    }
}

