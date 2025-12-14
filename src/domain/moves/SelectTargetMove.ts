import {GameState} from "../GameState";
import {Move} from "./Move";
import {SituatedUnit} from "../SituatedUnit";

export class SelectTargetMove extends Move {
    readonly unit: SituatedUnit;

    constructor(unit: SituatedUnit) {
        super();
        this.unit = unit;
    }

    execute(_gameState: GameState): void {

    }

    toString(): string {
        return `SelectTarget(${this.unit.unit}[${this.unit.coord}])`;
    }
}
