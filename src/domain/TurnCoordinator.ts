// ABOUTME: Manages turn flow with phase stack and active player tracking
// ABOUTME: Coordinates phase transitions and player turn switching

import {Phase} from "./phases/Phase";
import {PlayCardPhase} from "./phases/PlayCardPhase";

export class TurnCoordinator {
    private phases: Array<Phase>;
    private activePlayerIndex: 0 | 1;

    constructor() {
        this.phases = new Array<Phase>();
        this.phases.push(new PlayCardPhase());
        this.activePlayerIndex = 0;
    }

    /**
     * Get the current active phase (top of the phase stack)
     */
    get activePhase(): Phase {
        if (this.phases.length === 0) {
            throw Error("Phases stack empty");
        }
        return this.phases[this.phases.length - 1];
    }

    /**
     * Get the active player index (0 = bottom, 1 = top)
     */
    getActivePlayerIndex(): 0 | 1 {
        return this.activePlayerIndex;
    }

    getInactivePlayerIndex() {
        return this.activePlayerIndex === 0 ? 1 : 0;
    }

    /**
     * Switch to the other player
     */
    switchActivePlayer(): void {
        this.activePlayerIndex = this.getInactivePlayerIndex();
    }

    /**
     * Push a new phase onto the stack
     */
    pushPhase(phase: Phase): void {
        this.phases.push(phase);
    }

    /**
     * Pop the current phase from the stack
     * @returns Object indicating if the turn ended (phase stack became empty)
     */
    popPhase(): { turnEnded: boolean } {
        if (this.phases.length === 0) {
            throw Error("Phases stack is empty");
        }
        this.phases.pop();

        const turnEnded = this.phases.length === 0;

        if (turnEnded) {
            // Start new turn for next player
            this.switchActivePlayer();
            this.pushPhase(new PlayCardPhase());
        }

        return { turnEnded };
    }

    /**
     * Replace the current phase with a new one
     */
    replacePhase(phase: Phase): void {
        this.phases.pop();
        this.phases.push(phase);
    }

    /**
     * Create a deep clone of this TurnCoordinator for AI simulation
     */
    clone(): TurnCoordinator {
        const cloned = new TurnCoordinator();

        // Clone phases array (Phase instances are stateless, shallow copy is safe)
        cloned.phases.length = 0; // Clear the default PlayCardPhase
        this.phases.forEach(phase => cloned.phases.push(phase));

        // Clone active player index
        cloned.activePlayerIndex = this.activePlayerIndex;

        return cloned;
    }
}
