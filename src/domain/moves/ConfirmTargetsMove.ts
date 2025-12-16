// ABOUTME: Move that confirms target selection and pushes AutoCombatPhases for each target
// ABOUTME: Each AutoCombatPhase executes combat independently, allowing retreats to interleave

import {GameState} from "../GameState";
import {Move} from "./Move";
import {AutoCombatPhase} from "../phases/AutoCombatPhase";

export class ConfirmTargetsMove extends Move {
    private readonly dicePerTarget: number;
    private readonly starsCountAsHits: boolean;

    constructor(dicePerTarget: number, starsCountAsHits: boolean = true) {
        super();
        this.dicePerTarget = dicePerTarget;
        this.starsCountAsHits = starsCountAsHits;
    }

    execute(gameState: GameState): void {
        const allUnits = gameState.getAllUnits();
        const targetedUnits = allUnits.filter(su => su.unitState.isTargeted);

        // Pop the SelectTargetPhase FIRST (before pushing new phases)
        gameState.popPhase();

        // Push AutoCombatPhases in REVERSE order (LIFO stack behavior)
        // This ensures they execute in selection order (first selected → first attacked)
        for (let i = targetedUnits.length - 1; i >= 0; i--) {
            const su = targetedUnits[i];
            gameState.pushPhase(new AutoCombatPhase(
                su.coord,
                this.dicePerTarget,
                this.starsCountAsHits
            ));
        }

        // Manually trigger the first AutoCombatPhase's onBeingPoppedUp
        // This starts the cascade of combat executions
        if (targetedUnits.length > 0) {
            gameState.activePhase.onBeingPoppedUp(gameState);
        }
    }

    uiButton(): Array<{label: string, callback: (gameState: GameState) => void}> {
        return [{
            label: "Confirm Targets",
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

    toString(): string {
        return `ConfirmTargetsMove(${this.dicePerTarget} dice, starsCountAsHits=${this.starsCountAsHits})`;
    }
}
