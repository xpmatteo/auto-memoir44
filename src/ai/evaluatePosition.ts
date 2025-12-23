// ABOUTME: Evaluates the overall board position by summing offensive potential
// ABOUTME: Used by AI to compare different game states after simulated moves

import type {GameState} from "../domain/GameState";
import {BattleMove} from "../domain/moves/BattleMove";
import {PhaseType} from "../domain/phases/Phase";

/**
 * Evaluate the overall board position for the active player.
 * Returns a score based on the total offensive potential of all ordered units.
 *
 * Preconditions:
 * - GameState must be in BATTLE phase
 * - Only ordered units contribute to score (BattlePhase filters legal moves)
 *
 * Scoring formula:
 * - Each die rolled is worth (5 - targetStrength) * 100 points
 * - Weaker targets (lower strength) are worth more (closer to elimination)
 * - Strength 1: 400/die, Strength 2: 300/die, Strength 3: 200/die, Strength 4: 100/die
 */
export function evaluatePosition(gameState: GameState): number {
    if (gameState.activePhase.type !== PhaseType.BATTLE) {
        throw new Error("evaluatePosition requires gameState to be in BATTLE phase");
    }

    // Get all legal battle moves (already filtered to ordered units by BattlePhase)
    const legalMoves = gameState.legalMoves();
    const battleMoves = legalMoves.filter(m => m instanceof BattleMove) as BattleMove[];

    // Sum weighted dice for ALL battle moves
    let totalScore = 0;
    for (const move of battleMoves) {
        const targetStrength = gameState.getUnitCurrentStrength(move.toUnit);
        const diceValue = 100 * (5 - targetStrength);
        totalScore += move.dice * diceValue;
    }

    return totalScore;
}
