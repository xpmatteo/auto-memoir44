// ABOUTME: Moves for selecting and unselecting target units during air power attacks
// ABOUTME: SelectTargetMove targets a unit, UnSelectTargetMove removes targeting

import {GameState} from "../GameState";
import {Move} from "./Move";
import {SituatedUnit} from "../SituatedUnit";
import {GameEvent} from "../GameEvent";

export class SelectTargetMove extends Move {
    readonly unit: SituatedUnit;

    constructor(unit: SituatedUnit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): GameEvent[] {
        gameState.targetUnit(this.unit.unit);
        return [];
    }

    toString(): string {
        return `SelectTargetMove(${this.unit.unit}[${this.unit.coord}])`;
    }
}

export class UnSelectTargetMove extends Move {
    readonly unit: SituatedUnit;

    constructor(unit: SituatedUnit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): GameEvent[] {
        gameState.untargetUnit(this.unit.unit);
        return [];
    }

    toString(): string {
        return `UnSelectTargetMove(${this.unit.unit}[${this.unit.coord}])`;
    }
}
