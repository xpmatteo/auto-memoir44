// ABOUTME: Scoring function that rewards units being closer to enemies
// ABOUTME: Gives distant units a gradient to follow toward enemy positions

import type { GameState } from "../../domain/GameState";
import { hexDistance } from "../../utils/hex";
import type { ScoringContext, ScoringFunction } from "./types";

/**
 * Scaling factor to make scores comparable with battleDiceScorer.
 * battleDiceScorer returns 100-400 per die, so we use 100 per hex to
 * create similar magnitude.
 */
const DISTANCE_SCALE = 100;

/**
 * Scores the position based on proximity to enemy units.
 *
 * For each ordered unit, finds the minimum distance to any enemy unit.
 * Returns negative total distance, scaled by DISTANCE_SCALE.
 * This means closer positions score higher (less negative).
 *
 * Example:
 * - Unit 3 hexes from nearest enemy: contributes -300
 * - Unit 1 hex from nearest enemy: contributes -100
 * - Unit adjacent to enemy (distance 0): contributes 0
 *
 * This scorer works in any phase and doesn't require battle phase.
 */
export const closeTheGapScorer: ScoringFunction = (
    gameState: GameState,
    _context?: ScoringContext
): number => {
    const orderedUnits = gameState.getOrderedUnitsWithPositions();
    const enemyUnits = gameState.getEnemyUnits();

    // No ordered units or no enemies means no distance penalty
    if (orderedUnits.length === 0 || enemyUnits.length === 0) {
        return 0;
    }

    let totalScore = 0;

    for (const { coord: friendlyCoord } of orderedUnits) {
        // Find minimum distance to any enemy
        let minDistance = Infinity;
        for (const { coord: enemyCoord } of enemyUnits) {
            const distance = hexDistance(friendlyCoord, enemyCoord);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        // Subtract distance (closer = higher score)
        if (minDistance !== Infinity) {
            totalScore -= minDistance * DISTANCE_SCALE;
        }
    }

    return totalScore;
};
