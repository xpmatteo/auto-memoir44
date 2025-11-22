// ABOUTME: Move types and definitions for game actions

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

export class ToggleUnitOrderedMove implements Move {
    readonly unit;

    constructor(unit: Unit) {
        this.unit = unit;
    }

    execute(gameState: GameState): void {
        gameState.toggleUnitOrdered(this.unit);
    }
}

export class ConfirmOrdersMove implements Move {
    execute(gameState: GameState): void {
        gameState.switchActivePlayer();
    }

}
