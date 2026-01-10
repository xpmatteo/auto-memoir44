// ABOUTME: Type definitions for the modular AI scoring system
// ABOUTME: Defines ScoringFunction, ScoringContext, and WeightedScorer

import type { GameState } from "../../domain/GameState";

/**
 * Optional context for scenario-specific tuning of scoring functions.
 * Future use cases: objectives, defensive mode flag, etc.
 */
export interface ScoringContext {
    // Placeholder for future scenario-specific parameters
}

/**
 * A scoring function evaluates a game state and returns a numeric score.
 * Higher scores indicate more favorable positions for the active player.
 *
 * Scoring functions are stateless and pure - they only depend on the
 * game state and optional context passed to them.
 *
 * @param gameState - The game state to evaluate
 * @param context - Optional context for scenario-specific tuning
 * @returns A numeric score (higher = better for active player)
 */
export type ScoringFunction = (gameState: GameState, context?: ScoringContext) => number;

/**
 * A weighted scorer combines a scoring function with its weight.
 * The weight determines how much this scorer contributes to the
 * overall position evaluation.
 */
export interface WeightedScorer {
    /** Human-readable name for debugging/logging */
    name: string;
    /** The scoring function to apply */
    fn: ScoringFunction;
    /** Weight multiplier for this scorer's contribution */
    weight: number;
}
