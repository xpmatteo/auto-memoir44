// ABOUTME: Phase for handling Take Ground after close combat
// ABOUTME: Allows attacking player to optionally advance into hex vacated by eliminated or retreating enemy

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {TakeGroundMove} from "../moves/TakeGroundMove";
import {DeclineTakeGroundMove} from "../moves/DeclineTakeGroundMove";

export class TakeGroundPhase implements Phase {
    readonly name = "Take Ground";
    readonly type = PhaseType.MOVE;

    readonly attackingUnit: Unit;
    readonly fromHex: HexCoord;
    readonly toHex: HexCoord;
    readonly allowsOverrun: boolean;

    constructor(attackingUnit: Unit, fromHex: HexCoord, toHex: HexCoord, allowsOverrun: boolean = true) {
        this.attackingUnit = attackingUnit;
        this.fromHex = fromHex;
        this.toHex = toHex;
        this.allowsOverrun = allowsOverrun;
    }

    legalMoves(_gameState: GameState): Move[] {
        return [
            new TakeGroundMove(this.attackingUnit, this.fromHex, this.toHex, this.allowsOverrun),
            new DeclineTakeGroundMove()
        ];
    }
}
