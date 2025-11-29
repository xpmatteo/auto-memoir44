// ABOUTME: AI controller that coordinates AI move execution with the game loop
// ABOUTME: Manages position checks, timing, and UI feedback for AI actions

import type {GameState} from "../domain/GameState";
import type {AIPlayer} from "./AIPlayer";
import {Position} from "../domain/Player";

/**
 * Controller that integrates AI player into the render cycle
 * Checks after each render if AI should act and coordinates execution
 */
export class AIController {
    private isThinking: boolean = false;

    constructor(
        private gameState: GameState,
        private aiPlayer: AIPlayer,
        private onMoveExecuted: () => void,
        private aiDelay: number = 600
    ) {}

    /**
     * Check if AI should act and schedule move execution
     * Called after each render cycle
     */
    checkAndAct(): void {
        // Only act if Top player is active
        if (this.gameState.activePlayer.position !== Position.TOP) {
            return;
        }

        // Don't schedule multiple moves simultaneously
        if (this.isThinking) {
            return;
        }

        const legalMoves = this.gameState.legalMoves();
        if (legalMoves.length === 0) {
            return; // No legal moves available
        }

        // Mark as thinking and show indicator
        this.isThinking = true;
        this.showAIThinking(true);

        // Schedule move execution after delay
        setTimeout(() => {
            try {
                // Clone the game state to prevent AI from cheating
                const clonedState = this.gameState.clone();
                const selectedMove = this.aiPlayer.selectMove(clonedState, legalMoves);

                // Log AI's move selection
                const phaseName = this.gameState.activePhase.name;
                console.log(`[AI] ${phaseName}: ${selectedMove.constructor.name}`, selectedMove);

                this.gameState.executeMove(selectedMove);
            } finally {
                // Always clear thinking state and hide indicator
                this.isThinking = false;
                this.showAIThinking(false);
                // Trigger re-render, which will call checkAndAct again if needed
                this.onMoveExecuted();
            }
        }, this.aiDelay);
    }

    /**
     * Show or hide AI thinking indicator
     * @param show Whether to show the indicator
     */
    private showAIThinking(show: boolean): void {
        const indicator = document.getElementById("ai-thinking-indicator");
        if (indicator) {
            indicator.style.display = show ? "block" : "none";
        }
    }

    /**
     * Get AI delay in milliseconds
     */
    getDelay(): number {
        return this.aiDelay;
    }

    /**
     * Check if AI is currently thinking
     */
    isAIThinking(): boolean {
        return this.isThinking;
    }
}
