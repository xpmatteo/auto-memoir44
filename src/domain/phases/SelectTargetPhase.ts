// ABOUTME: Phase for selecting up to N contiguous enemy units for air attacks
// ABOUTME: Ensures selected targets form a connected group on the board

import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {SelectTargetMove, UnSelectTargetMove} from "../moves/SelectTargetMove";
import {SituatedUnit} from "../SituatedUnit";
import {hexDistance} from "../../utils/hex";
import {ConfirmTargetsMove} from "../moves/ConfirmTargetsMove";

interface TargetSelector {
    getEnemyUnits(): Array<SituatedUnit>;
}

export class SelectTargetPhase implements Phase {
    name: string = "Select Targets";
    type = PhaseType.TARGET_SELECTION;
    private readonly maxTargets: number;
    private readonly dicePerTarget: number;
    private readonly starsCountAsHits: boolean;

    constructor(maxTargets: number, dicePerTarget: number, starsCountAsHits: boolean = true) {
        this.maxTargets = maxTargets;
        this.dicePerTarget = dicePerTarget;
        this.starsCountAsHits = starsCountAsHits;
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
        moves.push(new ConfirmTargetsMove(this.dicePerTarget, this.starsCountAsHits));

        // Allow untargeting units, but only if it wouldn't break contiguity
        // A unit can be untargeted if removing it leaves the rest still contiguous
        for (const su of targetedUnits) {
            if (this.canUntarget(su, targetedUnits)) {
                moves.push(new UnSelectTargetMove(su));
            }
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

    /**
     * Check if a unit can be untargeted without breaking contiguity.
     * A unit can be untargeted if:
     * 1. It's the only targeted unit, OR
     * 2. After removing it, the remaining units are still contiguous
     */
    private canUntarget(unitToRemove: SituatedUnit, targetedUnits: SituatedUnit[]): boolean {
        // If only one unit targeted, can always untarget it
        if (targetedUnits.length <= 1) {
            return true;
        }

        // Get remaining units after removal
        const remaining = targetedUnits.filter(su => su !== unitToRemove);

        // Check if remaining units form a contiguous group
        // Use BFS starting from first remaining unit
        const visited = new Set<SituatedUnit>();
        const queue: SituatedUnit[] = [remaining[0]];
        visited.add(remaining[0]);

        while (queue.length > 0) {
            const current = queue.shift()!;

            // Find adjacent remaining units
            for (const other of remaining) {
                if (!visited.has(other) && hexDistance(current.coord, other.coord) === 1) {
                    visited.add(other);
                    queue.push(other);
                }
            }
        }

        // All remaining units should be visited if they're contiguous
        return visited.size === remaining.length;
    }
}
