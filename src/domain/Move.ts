// ABOUTME: Move types and definitions for game actions
// ABOUTME: Placeholder for future move implementations

import {CommandCard} from "./CommandCard";
import {GameState} from "./GameState";
import {Unit} from "./Unit";

export interface Move {
    execute(gameState: GameState): void;
}

export class PlayCardMove implements Move {
    readonly card: CommandCard

    constructor(card: CommandCard) {
        this.card = card
    }

    execute(gameState: GameState): void {
        this.card.onCardPlayed(gameState);
    }
}

export class OrderUnitMove implements Move {
    readonly unit;

    constructor(unit: Unit) {
        this.unit = unit;
    }

    execute(_gameState: GameState): void {
    }
}

