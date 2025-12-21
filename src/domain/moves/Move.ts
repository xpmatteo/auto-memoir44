// ABOUTME: Move types and definitions for game actions
// ABOUTME: Base Move class and all concrete move implementations (PlayCard, Order, Battle, etc.)

import {CommandCard} from "../cards/CommandCard";
import {GameState} from "../GameState";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {Side} from "../Player";
import {GameEvent, CardPlayedEvent, UnitRetreatedEvent, GameWonEvent} from "../GameEvent";

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
    abstract execute(gameState: GameState): GameEvent[];

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

    execute(gameState: GameState): GameEvent[] {
        this.card.onCardPlayed(gameState);
        return [new CardPlayedEvent(this.card.name, gameState.activePlayer.side)];
    }
}

export class OrderUnitMove extends Move {
    readonly unit;

    constructor(unit: Unit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): GameEvent[] {
        gameState.orderUnit(this.unit);
        return [];
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

    execute(gameState: GameState): GameEvent[] {
        gameState.unOrderUnit(this.unit);
        return [];
    }

    toString(): string {
        return `UnOrderMove(${this.unit.id}/${this.unit.side})`
    }

}

export class ConfirmOrdersMove extends Move {
    execute(gameState: GameState): GameEvent[] {
        gameState.popPhase();
        return [];
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
    execute(gameState: GameState): GameEvent[] {
        gameState.popPhase();
        return [];
    }

    uiButton(): UiButton[] {
        return [{
            label: "End Movements",
            callback: (gameState: GameState) => {
                gameState.popPhase();
            },
        }];
    }

    toString(): string {
        return 'EndMovements';
    }
}

export class EndBattlesMove extends Move {
    execute(gameState: GameState): GameEvent[] {
        gameState.popPhase();
        return [];
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

    execute(gameState: GameState): GameEvent[] {
        gameState.discardActiveCard();
        gameState.drawSpecificCard(this.card.id, gameState.activePlayerHand);
        gameState.popPhase();
        return [];
    }

    uiButton(): UiButton[] {
        return [{
            label: `Draw "${this.card.name}"`,
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

    toString(): string {
        return `ReplenishHandMove(${this.card.name})`;
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

    execute(gameState: GameState): GameEvent[] {
        // Draw the chosen card to the active player's hand
        gameState.drawSpecificCard(this.chosenCard.id, gameState.activePlayerHand);

        // Discard the rejected card
        gameState.discardCard(this.rejectedCard.id);

        // Discard the active card (the card that was played this turn)
        gameState.discardActiveCard();

        // End the replenish hand phase
        gameState.popPhase();
        return [];
    }

    uiButton(): UiButton[] {
        return [{
            label: `Draw "${this.chosenCard.name}"`,
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

    toString(): string {
        return `ReplenishHandChooseCardMove(${this.chosenCard.name}, ${this.rejectedCard.name})`;
    }
}

export class RetreatMove extends Move {
    readonly unit: Unit;
    readonly from: HexCoord;
    readonly to: HexCoord;
    readonly attackingUnit?: Unit;
    readonly attackingUnitCoord?: HexCoord;
    readonly isFromOverrun: boolean;

    constructor(
        unit: Unit,
        from: HexCoord,
        to: HexCoord,
        attackingUnit?: Unit,
        attackingUnitCoord?: HexCoord,
        isFromOverrun: boolean = false
    ) {
        super();
        this.unit = unit;
        this.from = from;
        this.to = to;
        this.attackingUnit = attackingUnit;
        this.attackingUnitCoord = attackingUnitCoord;
        this.isFromOverrun = isFromOverrun;
    }

    execute(gameState: GameState): GameEvent[] {
        this.executeRetreat(gameState);

        // If this was a close combat retreat AND the hex was actually vacated, push TakeGroundPhase
        const hexWasVacated = this.from.q !== this.to.q || this.from.r !== this.to.r;
        if (this.attackingUnit && this.attackingUnitCoord && hexWasVacated) {
            gameState.pushTakeGroundPhase(
                this.attackingUnit,
                this.attackingUnitCoord,
                this.from, // The hex that was just vacated
                !this.isFromOverrun  // If from overrun, don't allow another overrun
            );
        }

        return [new UnitRetreatedEvent(this.unit, this.from, this.to)];
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
    readonly medals: number;

    constructor(winningPlayerSide: Side, medals: number) {
        super();
        this.winningPlayerSide = winningPlayerSide;
        this.medals = medals;
    }

    execute(_gameState: GameState): GameEvent[] {
        // No-op: game is over, no state changes needed
        return [new GameWonEvent(this.winningPlayerSide, this.medals)];
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

