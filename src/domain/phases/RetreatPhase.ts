// ABOUTME: Phase for handling unit retreats after flag battle results
// ABOUTME: Uses temporary player switch so unit owner chooses retreat hex

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move, RetreatMove} from "../moves/Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";

export class RetreatPhase implements Phase {
    readonly name = "Retreat";
    readonly type = PhaseType.RETREAT;
    readonly temporaryPlayerSwitch = true;

    readonly unit: Unit;
    readonly currentPosition: HexCoord;
    readonly availableRetreatHexes: HexCoord[];
    readonly attackingUnit?: Unit;
    readonly attackingUnitCoord?: HexCoord;

    constructor(
        unit: Unit,
        currentPosition: HexCoord,
        availableRetreatHexes: HexCoord[],
        attackingUnit?: Unit,
        attackingUnitCoord?: HexCoord
    ) {
        this.unit = unit;
        this.currentPosition = currentPosition;
        this.availableRetreatHexes = availableRetreatHexes;
        this.attackingUnit = attackingUnit;
        this.attackingUnitCoord = attackingUnitCoord;
    }

    legalMoves(_gameState: GameState): Move[] {
        return this.availableRetreatHexes.map(hex =>
            new RetreatMove(
                this.unit,
                this.currentPosition,
                hex,
                this.attackingUnit,
                this.attackingUnitCoord
            )
        );
    }
}
