import {HexCoord, hexDistance} from "../../utils/hex";
import {GameState} from "../GameState";
import {Move} from "./Move";
import {GameEvent, UnitMovedEvent} from "../GameEvent";

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

    execute(gameState: GameState): GameEvent[] {
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
        // (allow active card to override)
        const activeCard = gameState.activeCard;
        const skipsBattle = activeCard
            ? activeCard.fixUnitMovementSkipsBattle(unit, distance)
            : unit.movementSkipsBattle(distance);
        if (skipsBattle) {
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

        return [new UnitMovedEvent(unit, this.from, this.to)];
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
