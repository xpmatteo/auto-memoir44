// ABOUTME: Move types and definitions for game actions

import {CommandCard} from "./CommandCard";
import {GameState} from "./GameState";
import {Unit} from "./Unit";
import {HexCoord} from "../utils/hex";
import {hexDistance} from "../utils/hex";
import {MovePhase} from "./phases/MovePhase";

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
        gameState.popPhase();
    }
}

export class EndMovementsMove implements Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
    }
}

export class MoveUnitMove implements Move {
    readonly from: HexCoord;
    readonly to: HexCoord;

    constructor(from: HexCoord, to: HexCoord) {
        this.from = from;
        this.to = to;
    }

    execute(gameState: GameState): void {
        const unit = gameState.getUnitAt(this.from);
        if (!unit) {
            throw new Error(`No unit found at (${this.from.q}, ${this.from.r})`);
        }
        gameState.moveUnit(this.from, this.to);
        gameState.markUnitMoved(unit);

        // Mark unit to skip battle if it moved 2 hexes
        const distance = hexDistance(this.from, this.to);
        if (distance === 2) {
            gameState.markUnitSkipsBattle(unit);
        }

        // Check if all ordered units have moved (auto-advance phase)
        const orderedUnits = gameState.getOrderedUnits();
        if (orderedUnits.length > 0) {
            const allMoved = orderedUnits.every(u => gameState.isUnitMoved(u));
            if (allMoved) {
                gameState.popPhase();
            }
        }
    }
}

export class BattleMove implements Move {
    readonly fromUnit: Unit;
    readonly toUnit: Unit;

    constructor(fromUnit: Unit, toUnit: Unit) {
        this.fromUnit = fromUnit;
        this.toUnit = toUnit;
    }

    execute(_gameState: GameState): void {
        // TODO: Implement combat resolution (dice rolls, casualties)
        throw new Error("BattleMove.execute() not yet implemented");
    }
}

export class EndBattlesMove implements Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
    }
}

