// ABOUTME: AI player interface and implementations for automated move selection
// ABOUTME: Provides strategy pattern for different AI difficulty levels and behaviors

import type {Move} from "../domain/Move";
import {EndBattlesMove, EndMovementsMove} from "../domain/Move";

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
 * Prefers action moves over phase-ending moves to be more active
 */
export class RandomAIPlayer implements AIPlayer {
    selectMove(legalMoves: Move[], rng: () => number): Move {
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available for AI to select");
        }

        // Filter out phase-ending moves if there are other options
        // Note: ConfirmOrdersMove is allowed to prevent infinite toggling of unit orders
        const actionMoves = legalMoves.filter(move =>
            !(move instanceof EndMovementsMove) &&
            !(move instanceof EndBattlesMove)
        );

        // Use action moves if available, otherwise use all legal moves
        const movesToChooseFrom = actionMoves.length > 0 ? actionMoves : legalMoves;

        // Use the same random selection pattern as Dice and Deck
        const index = Math.floor(rng() * movesToChooseFrom.length);
        return movesToChooseFrom[index];
    }
}
