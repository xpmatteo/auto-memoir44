// ABOUTME: Moves for selecting and unselecting target units during air power attacks
// ABOUTME: SelectTargetMove targets a unit, UnSelectTargetMove removes targeting

import {GameState} from "../GameState";
import {Move} from "./Move";
import {SituatedUnit} from "../SituatedUnit";

export class SelectTargetMove extends Move {
    readonly unit: SituatedUnit;

    constructor(unit: SituatedUnit) {
        super();
        this.unit = unit;
    }

    execute(gameState: GameState): void {
        gameState.targetUnit(this.unit.unit);
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

    execute(gameState: GameState): void {
        gameState.untargetUnit(this.unit.unit);
    }

    toString(): string {
        return `UnSelectTargetMove(${this.unit.unit}[${this.unit.coord}])`;
    }
}
