// ABOUTME: Scoring function that evaluates offensive potential based on available battle dice
// ABOUTME: Scores higher when units can roll more dice against weaker targets

import type { GameState } from "../../domain/GameState";
import { BattleMove } from "../../domain/moves/BattleMove";
import { PhaseType } from "../../domain/phases/Phase";
import type { ScoringContext, ScoringFunction } from "./types";

/**
 * Scores the position based on battle dice potential.
 *
 * Scoring formula:
 * - Each die rolled is worth (5 - targetStrength) * 100 points
 * - Weaker targets (lower strength) are worth more (closer to elimination)
 * - Strength 1: 400/die, Strength 2: 300/die, Strength 3: 200/die, Strength 4: 100/die
 *
 * Preconditions:
 * - GameState must be in BATTLE phase
 * - Only ordered units contribute to score (BattlePhase filters legal moves)
 *
 * @throws Error if gameState is not in BATTLE phase
 */
export const battleDiceScorer: ScoringFunction = (
    gameState: GameState,
    _context?: ScoringContext
): number => {
    if (gameState.activePhase.type !== PhaseType.BATTLE) {
        throw new Error("battleDiceScorer requires gameState to be in BATTLE phase");
    }

    const legalMoves = gameState.legalMoves();
    const battleMoves = legalMoves.filter((m) => m instanceof BattleMove) as BattleMove[];

    let totalScore = 0;
    for (const move of battleMoves) {
        const targetStrength = gameState.getUnitCurrentStrength(move.toUnit);
        const diceValue = 100 * (5 - targetStrength);
        totalScore += move.dice * diceValue;
    }

    return totalScore;
};
