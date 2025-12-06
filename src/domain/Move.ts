// ABOUTME: Move types and definitions for game actions

import {CommandCard} from "./CommandCard";
import {GameState} from "./GameState";
import {Unit} from "./Unit";
import {HexCoord, hexDistance} from "../utils/hex";
import {resolveHits} from "../rules/combat";
import {Position, Side} from "./Player";
import {RESULT_FLAG} from "./Dice";
import {RetreatPhase} from "./phases/RetreatPhase";
import {BOARD_GEOMETRY} from "./BoardGeometry";
// import {handleFlags} from "../rules/flags";
// import {retreatPaths} from "../rules/retreatPaths";

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

export class OrderUnitMove extends Move {
    readonly unit;

    constructor(unit: Unit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): void {
        gameState.orderUnit(this.unit);
    }

    toString(): string {
        return `OrderUnitMove(${this.unit.id}/${this.unit.side})`
    }
}

export class UnOrderMove extends Move {
    readonly unit;

    constructor(unit: Unit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): void {
        gameState.unOrderUnit(this.unit);
    }

    toString(): string {
        return `UnOrderMove(${this.unit.id}/${this.unit.side})`
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

    toString(): string {
        return `ConfirmOrdersMove`
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
    readonly autoAdvance: boolean;

    constructor(from: HexCoord, to: HexCoord, autoAdvance: boolean = true) {
        super();
        this.from = from;
        this.to = to;
        this.autoAdvance = autoAdvance;
    }

    execute(gameState: GameState): void {
        const unit = gameState.getUnitAt(this.from);
        if (!unit) {
            throw new Error(`No unit found at (${this.from.q}, ${this.from.r})`);
        }

        // Handle no-op move (unit stays in place)
        const distance = hexDistance(this.from, this.to);
        if (distance > 0) {
            gameState.moveUnit(this.from, this.to);
        }

        gameState.markUnitMoved(unit);

        // Mark unit to skip battle if unit's movement rules dictate it
        if (unit.movementSkipsBattle(distance)) {
            gameState.markUnitSkipsBattle(unit);
        }

        if (gameState.getTerrain(this.to).unitMovingInCannotBattle) {
            gameState.markUnitSkipsBattle(unit);
        }

        // Check if all ordered units have moved (auto-advance phase)
        if (this.autoAdvance) {
            const orderedUnits = gameState.getOrderedUnits();
            if (orderedUnits.length > 0) {
                const allMoved = orderedUnits.every(u => gameState.isUnitMoved(u));
                if (allMoved) {
                    gameState.popPhase();
                }
            }
        }
    }

    toString(): string {
        return `Move from ${this.from} to ${this.to}`;
    }

    undo(gameState: GameState) {
        gameState.moveUnit(this.to, this.from);
        let unit = gameState.getUnitAt(this.from)!;
        gameState.unMarkUnitMoved(unit);
        gameState.unMarkUnitSkipsBattle(unit);
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

        // Count flags (treat multiple flags as a single flag for now)
        const flagCount = diceResults.filter(result => result === RESULT_FLAG).length;
        const hasFlag = flagCount > 0;

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(this.toUnit);
        const newStrength = currentStrength - hits;

        if (newStrength <= 0) {
            // Unit is eliminated - find its position and remove it
            const targetPosition = this.findTarget(gameState);
            this.eliminateUnit(gameState, targetPosition.coord);
        } else {
            // Unit might survive with reduced strength
            gameState.setUnitCurrentStrength(this.toUnit, newStrength);

            // Handle flag results (retreat)
            if (hasFlag) {
                // Find target unit's current position
                const target = this.findTarget(gameState);
                const availableHexes = this.retreatHexes(gameState, target);

                //handleFlags(1, 1, 0, availableHexes);

                if (availableHexes.length === 0) {
                    // No retreat path available - unit takes a hit
                    const newStrengthAfterRetreat = gameState.getUnitCurrentStrength(this.toUnit) - 1;
                    if (newStrengthAfterRetreat <= 0) {
                        this.eliminateUnit(gameState, target.coord);
                    } else {
                        gameState.setUnitCurrentStrength(this.toUnit, newStrengthAfterRetreat);
                    }
                } else if (availableHexes.length === 1) {
                    // Only one retreat path - automatically move unit
                    gameState.moveUnit(target.coord, availableHexes[0]);
                } else {
                    // Multiple retreat paths - push RetreatPhase so owner can choose
                    gameState.pushPhase(new RetreatPhase(
                        this.toUnit,
                        target.coord,
                        availableHexes
                    ));
                }
            }
        }
    }

    private findTarget(gameState: GameState) {
        const allUnits = gameState.getAllUnitsWithPositions();
        const target = allUnits.find(({unit}) => unit.id === this.toUnit.id);
        if (!target) {
            throw new Error(`Could not find position for target unit ${this.toUnit.id}`);
        }
        return target;
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord) {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(this.toUnit, attackerPlayerIndex as 0 | 1);
    }

    private retreatHexes(gameState: GameState, targetPosition: { coord: HexCoord; unit: Unit }) {
        // Determine retreat directions based on target unit owner's position
        const targetOwnerPosition = gameState.positionOf(this.toUnit);

        const retreatHexes: HexCoord[] = [];
        if (targetOwnerPosition === Position.TOP) {
            // Top player retreats NW or NE
            retreatHexes.push(targetPosition.coord.northwest());
            retreatHexes.push(targetPosition.coord.northeast());
        } else {
            // Bottom player retreats SW or SE
            retreatHexes.push(targetPosition.coord.southwest());
            retreatHexes.push(targetPosition.coord.southeast());
        }

        // Filter out blocked hexes (units or board edges)
        return retreatHexes.filter(hex =>
            BOARD_GEOMETRY.contains(hex) && !gameState.getUnitAt(hex)
        );
    }

    toString(): string {
        return `Battle(${this.fromUnit}, ${this.toUnit}, ${this.dice})`;
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

    toString(): string {
        return 'EndBattles';
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
        gameState.drawSpecificCard(this.card.id, gameState.activePlayerHand);
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

export class ReplenishHandChooseCardMove extends Move {
    private chosenCard: CommandCard;
    private rejectedCard: CommandCard;

    constructor(chosenCard: CommandCard, rejectedCard: CommandCard) {
        super();
        this.chosenCard = chosenCard;
        this.rejectedCard = rejectedCard;
    }

    execute(gameState: GameState): void {
        // Draw the chosen card to the active player's hand
        gameState.drawSpecificCard(this.chosenCard.id, gameState.activePlayerHand);

        // Discard the rejected card
        gameState.discardCard(this.rejectedCard.id);

        // Discard the active card (the card that was played this turn)
        gameState.discardActiveCard();

        // End the replenish hand phase
        gameState.popPhase();
    }

    uiButton(): UiButton[] {
        return [{
            label: `Draw "${this.chosenCard.name}"`,
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }
}

export class RetreatMove extends Move {
    readonly unit: Unit;
    readonly from: HexCoord;
    readonly to: HexCoord;

    constructor(unit: Unit, from: HexCoord, to: HexCoord) {
        super();
        this.unit = unit;
        this.from = from;
        this.to = to;
    }

    execute(gameState: GameState): void {
        gameState.moveUnit(this.from, this.to);
        gameState.popPhase();
    }

    toString(): string {
        return `RetreatMove(${this.unit.id} from ${this.from} to ${this.to})`;
    }
}

export class GameVictoryMove extends Move {
    readonly winningPlayerSide: Side;

    constructor(winningPlayerSide: Side) {
        super();
        this.winningPlayerSide = winningPlayerSide;
    }

    execute(_gameState: GameState): void {
        // No-op: game is over, no state changes needed
    }

    uiButton(): UiButton[] {
        return [{
            label: `The ${this.winningPlayerSide} player won! New game?`,
            callback: () => {
                window.location.reload();
            },
        }];
    }
}

