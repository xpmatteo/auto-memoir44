// ABOUTME: Combines multiple weighted scoring functions into a single score
// ABOUTME: Returns the weighted sum of all scorers applied to the game state

import type { GameState } from "../../domain/GameState";
import type { ScoringContext, WeightedScorer } from "./types";

/**
 * Combines multiple weighted scoring functions into a single score.
 *
 * @param gameState - The game state to evaluate
 * @param scorers - Array of weighted scorers to apply
 * @param context - Optional context for scenario-specific tuning
 * @returns The weighted sum of all scorer results
 */
export function combineScorers(
    gameState: GameState,
    scorers: WeightedScorer[],
    context?: ScoringContext
): number {
    return scorers.reduce(
        (total, scorer) => total + scorer.weight * scorer.fn(gameState, context),
        0
    );
}
