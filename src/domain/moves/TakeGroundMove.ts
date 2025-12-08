// ABOUTME: Move for advancing into a hex vacated by an enemy after close combat
// ABOUTME: Part of the Take Ground rule that allows attackers to optionally occupy vacated hexes

import {Move} from "./Move";
import {GameState} from "../GameState";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";

export class TakeGroundMove extends Move {
    readonly unit: Unit;
    readonly fromHex: HexCoord;
    readonly toHex: HexCoord;

    constructor(unit: Unit, fromHex: HexCoord, toHex: HexCoord) {
        super();
        this.unit = unit;
        this.fromHex = fromHex;
        this.toHex = toHex;
    }

    execute(gameState: GameState): void {
        gameState.moveUnit(this.fromHex, this.toHex);
        gameState.popPhase();
    }

    toString(): string {
        return `TakeGroundMove(${this.unit.id} from ${this.fromHex} to ${this.toHex})`;
    }
}
