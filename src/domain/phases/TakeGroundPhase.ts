// ABOUTME: Phase for handling optional advance after eliminating/forcing retreat of adjacent enemy
// ABOUTME: Allows attacker to advance into vacated hex or stay in current position

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move, TakeGroundMove, DoNotTakeGroundMove} from "../Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";

export class TakeGroundPhase implements Phase {
    readonly name = "Take Ground";
    readonly type = PhaseType.TAKE_GROUND;

    readonly attackingUnit: Unit;
    readonly attackerPosition: HexCoord;
    readonly vacatedHex: HexCoord;

    constructor(attackingUnit: Unit, attackerPosition: HexCoord, vacatedHex: HexCoord) {
        this.attackingUnit = attackingUnit;
        this.attackerPosition = attackerPosition;
        this.vacatedHex = vacatedHex;
    }

    legalMoves(_gameState: GameState): Move[] {
        return [
            new TakeGroundMove(this.attackingUnit, this.attackerPosition, this.vacatedHex),
            new DoNotTakeGroundMove()
        ];
    }
}
