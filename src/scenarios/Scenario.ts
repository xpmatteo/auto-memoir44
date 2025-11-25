// ABOUTME: Scenario interface definition
// ABOUTME: Scenarios implement setup() to initialize game state

import type {GameState} from "../domain/GameState";

export interface Scenario {
    /**
     * Initialize the game state with units, cards, and initial configuration
     */
    setup(gameState: GameState): void;
}
