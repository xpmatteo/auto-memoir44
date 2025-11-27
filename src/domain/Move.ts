// ABOUTME: Move types and definitions for game actions

import {CommandCard} from "./CommandCard";
import {GameState} from "./GameState";
import {Unit} from "./Unit";
import {HexCoord} from "../utils/hex";
import {hexDistance} from "../utils/hex";
import {resolveHits} from "../rules/combat";
import {Position} from "./Player";

interface UiButton {
    label: string,
    callback: (gameState: GameState) => void,
}

export abstract class Move {
    abstract execute(gameState: GameState): void;

    uiButton(): UiButton[] {
        return [];
    }
}

export class PlayCardMove extends Move {
    readonly card: CommandCard

    constructor(card: CommandCard) {
        super();
        this.card = card
    }

    execute(gameState: GameState): void {
        this.card.onCardPlayed(gameState);
    }
}

export class ToggleUnitOrderedMove extends Move {
    readonly unit;

    constructor(unit: Unit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): void {
        gameState.toggleUnitOrdered(this.unit);
    }
}

export class ConfirmOrdersMove extends Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
    }

    uiButton(): UiButton[] {
        return [{
            label: "Confirm Orders",
            callback: (gameState: GameState) => {
                gameState.popPhase();
            },
        }];
    }
}

export class EndMovementsMove extends Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
    }

    uiButton(): UiButton[] {
        return [{
            label: "End Movements",
            callback: (gameState: GameState) => {
                gameState.popPhase();
            },
        }];
    }
}

export class MoveUnitMove extends Move {
    readonly from: HexCoord;
    readonly to: HexCoord;

    constructor(from: HexCoord, to: HexCoord) {
        super();
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

export class BattleMove extends Move {
    readonly fromUnit: Unit;
    readonly toUnit: Unit;
    readonly dice: number;

    constructor(fromUnit: Unit, toUnit: Unit, dice: number) {
        super();
        this.fromUnit = fromUnit;
        this.toUnit = toUnit;
        this.dice = dice;
    }

    execute(gameState: GameState): void {
        // Roll dice
        const diceResults = gameState.rollDice(this.dice);

        // Track that this unit has attacked
        gameState.incrementUnitBattlesThisTurn(this.fromUnit);

        // Resolve hits
        const hits = resolveHits(diceResults, this.toUnit);

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(this.toUnit);
        const newStrength = currentStrength - hits;

        if (newStrength <= 0) {
            // Unit is eliminated - find its position and remove it
            const allUnits = gameState.getAllUnitsWithPositions();
            const targetPosition = allUnits.find(({unit}) => unit.id === this.toUnit.id);

            if (!targetPosition) {
                throw new Error(`Could not find position for target unit ${this.toUnit.id}`);
            }

            // Remove from board
            gameState.removeUnit(targetPosition.coord);

            // Add to attacker's medal table
            const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
            gameState.addToMedalTable(this.toUnit, attackerPlayerIndex as 0 | 1);
        } else {
            // Unit survives with reduced strength
            gameState.setUnitCurrentStrength(this.toUnit, newStrength);
        }
    }

    toString(): string {
        return `Battle: ${this.fromUnit.type} (${this.dice} dice) → ${this.toUnit.type}`;
    }
}

export class EndBattlesMove extends Move {
    execute(gameState: GameState): void {
        gameState.popPhase();
    }

    uiButton(): UiButton[] {
        return [{
            label: "End Battles",
            callback: (gameState: GameState) => {
                gameState.popPhase();
            },
        }];
    }
}

export class ReplenishHandMove extends Move {
    private card: CommandCard;

    constructor(card: CommandCard) {
        super();
        this.card = card;
    }

    execute(gameState: GameState): void {
        gameState.discardActiveCard();
        gameState.drawCards(1, gameState.activePlayerHand);
        gameState.popPhase();
    }

    uiButton(): UiButton[] {
        return [{
            label: `Draw "${this.card.name}"`,
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

}

