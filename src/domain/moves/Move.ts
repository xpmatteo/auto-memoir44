// ABOUTME: Move types and definitions for game actions

import {CommandCard} from "../CommandCard";
import {GameState} from "../GameState";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {Side} from "../Player";

interface UiButton {
    label: string,
    callback: (gameState: GameState) => void,
}

// Interface segregation for RetreatMove - only needs these two methods
export interface UnitRetreater {
    moveUnit(from: HexCoord, to: HexCoord): void;
    popPhase(): void;
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
    readonly attackingUnit?: Unit;
    readonly attackingUnitCoord?: HexCoord;

    constructor(
        unit: Unit,
        from: HexCoord,
        to: HexCoord,
        attackingUnit?: Unit,
        attackingUnitCoord?: HexCoord
    ) {
        super();
        this.unit = unit;
        this.from = from;
        this.to = to;
        this.attackingUnit = attackingUnit;
        this.attackingUnitCoord = attackingUnitCoord;
    }

    execute(gameState: GameState): void {
        this.executeRetreat(gameState);

        // If this was a close combat retreat AND the hex was actually vacated, push TakeGroundPhase
        const hexWasVacated = this.from.q !== this.to.q || this.from.r !== this.to.r;
        if (this.attackingUnit && this.attackingUnitCoord && hexWasVacated) {
            gameState.pushTakeGroundPhase(
                this.attackingUnit,
                this.attackingUnitCoord,
                this.from // The hex that was just vacated
            );
        }
    }

    executeRetreat(retreater: UnitRetreater): void {
        // Only move if destination is different (unit might ignore flag and stay)
        if (this.from.q !== this.to.q || this.from.r !== this.to.r) {
            retreater.moveUnit(this.from, this.to);
        }
        retreater.popPhase();
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

