// ABOUTME: Evaluates the overall board position by summing offensive potential
// ABOUTME: Used by AI to compare different game states after simulated moves

import type { GameState } from "../domain/GameState";
import { battleDiceScorer } from "./scoring/battleDiceScorer";

/**
 * Evaluate the overall board position for the active player.
 * Returns a score based on the total offensive potential of all ordered units.
 *
 * This is a convenience wrapper around battleDiceScorer for backward compatibility.
 * New code should use the modular scoring system directly.
 *
 * Preconditions:
 * - GameState must be in BATTLE phase
 * - Only ordered units contribute to score (BattlePhase filters legal moves)
 *
 * @see battleDiceScorer for the underlying implementation
 */
export function evaluatePosition(gameState: GameState): number {
    return battleDiceScorer(gameState);
}
