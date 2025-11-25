// ABOUTME: AI player interface and implementations for automated move selection
// ABOUTME: Provides strategy pattern for different AI difficulty levels and behaviors

import type {Move} from "../domain/Move";

/**
 * Interface for AI players that can select moves from legal options
 */
export interface AIPlayer {
    /**
     * Select a move from the available legal moves
     * @param legalMoves Array of legal moves to choose from
     * @param rng Random number generator function returning [0, 1)
     * @returns The selected move to execute
     */
    selectMove(legalMoves: Move[], rng: () => number): Move;
}

/**
 * Simple AI that randomly selects from legal moves
 * Uses seeded RNG for reproducible behavior
 */
export class RandomAIPlayer implements AIPlayer {
    selectMove(legalMoves: Move[], rng: () => number): Move {
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available for AI to select");
        }

        // Use the same random selection pattern as Dice and Deck
        const index = Math.floor(rng() * legalMoves.length);
        return legalMoves[index];
    }
}
