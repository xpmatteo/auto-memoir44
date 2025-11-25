// ABOUTME: Combat rules for calculating dice counts based on unit type and distance
// ABOUTME: Used by BattlePhase to determine how many dice a unit rolls in battle

import {Unit, UnitType} from "../domain/Unit";
import {DiceResult, RESULT_INFANTRY, RESULT_GRENADE} from "../domain/Dice";

/**
 * Calculate the number of dice a unit rolls when battling at a given distance.
 *
 * Infantry units can battle at distances 1-3 with decreasing dice:
 * - Distance 1: 3 dice
 * - Distance 2: 2 dice
 * - Distance 3: 1 die
 *
 * @param unit - The attacking unit
 * @param distance - The distance in hexes to the target
 * @returns The number of dice to roll
 * @throws Error if the unit type is unsupported or distance is invalid
 */
export function calculateDiceCount(unit: Unit, distance: number): number {
    if (distance < 1 || distance > 3) {
        throw new Error(`Invalid battle distance: ${distance}. Valid range is 1-3.`);
    }

    if (unit.type === UnitType.INFANTRY) {
        // Infantry: 3 dice at distance 1, 2 dice at distance 2, 1 die at distance 3
        return 4 - distance;
    }

    throw new Error(`Unsupported unit type for dice calculation: ${unit.type}`);
}

/**
 * Resolve hits from dice results against a target unit.
 *
 * Infantry units are hit by:
 * - RESULT_INFANTRY
 * - RESULT_GRENADE
 *
 * @param diceResults - The results from rolling dice
 * @param targetUnit - The unit being attacked
 * @returns The number of hits scored
 */
export function resolveHits(diceResults: DiceResult[], targetUnit: Unit): number {
    let hits = 0;

    for (const result of diceResults) {
        if (targetUnit.type === UnitType.INFANTRY) {
            if (result === RESULT_INFANTRY || result === RESULT_GRENADE) {
                hits++;
            }
        }
        // Future: Add armor and other unit types here
    }

    return hits;
}
