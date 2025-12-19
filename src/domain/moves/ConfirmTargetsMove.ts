// ABOUTME: Move that confirms target selection and queues CombatTasks for each target
// ABOUTME: Each CombatTask executes combat independently, allowing retreats to interleave

import {GameState} from "../GameState";
import {Move} from "./Move";
import {CombatTask} from "../tasks/CombatTask";

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

        // Queue CombatTasks in forward order (FIFO queue behavior)
        // Tasks execute in selection order (first selected → first attacked)
        for (const su of targetedUnits) {
            gameState.queueTask(new CombatTask(
                su.coord,
                this.dicePerTarget,
                this.starsCountAsHits
            ));
        }

        // Pop the SelectTargetPhase - this will automatically trigger processDeferredTasks()
        gameState.popPhase();
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
