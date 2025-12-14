// ABOUTME: Phase for selecting up to N contiguous enemy units for air attacks
// ABOUTME: Ensures selected targets form a connected group on the board

import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {SelectTargetMove, UnSelectTargetMove} from "../moves/SelectTargetMove";
import {SituatedUnit} from "../SituatedUnit";
import {hexDistance} from "../../utils/hex";
import {ConfirmTargetsMove} from "../moves/ConfirmTargetsMove";
import {Side} from "../Player";

interface TargetSelector {
    getEnemyUnits(): Array<SituatedUnit>;
}

export class SelectTargetPhase implements Phase {
    name: string = "Select Targets";
    type = PhaseType.ORDER;
    private readonly maxTargets: number;
    private readonly dicePerTarget: (side: Side) => number;

    constructor(maxTargets: number, dicePerTarget: (side: Side) => number) {
        this.maxTargets = maxTargets;
        this.dicePerTarget = dicePerTarget;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(targetSelector: TargetSelector): Array<Move> {
        const allEnemyUnits = targetSelector.getEnemyUnits();
        const targetedUnits = allEnemyUnits.filter(su => su.unitState.isTargeted);
        const untargetedUnits = allEnemyUnits.filter(su => !su.unitState.isTargeted);

        const moves: Array<Move> = [];

        // Always allow confirming (even with 0 targets)
        moves.push(new ConfirmTargetsMove(this.dicePerTarget));

        // Allow untargeting any targeted unit
        for (const su of targetedUnits) {
            moves.push(new UnSelectTargetMove(su));
        }

        // If we've reached the max, don't allow more selections
        if (targetedUnits.length >= this.maxTargets) {
            return moves;
        }

        // If no units are targeted yet, any enemy unit can be selected
        if (targetedUnits.length === 0) {
            for (const su of untargetedUnits) {
                moves.push(new SelectTargetMove(su));
            }
            return moves;
        }

        // Otherwise, only allow selecting units adjacent to already-targeted units
        for (const su of untargetedUnits) {
            const isAdjacentToTargeted = targetedUnits.some(targeted =>
                hexDistance(su.coord, targeted.coord) === 1
            );
            if (isAdjacentToTargeted) {
                moves.push(new SelectTargetMove(su));
            }
        }

        return moves;
    }
}
