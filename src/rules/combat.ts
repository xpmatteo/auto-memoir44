// ABOUTME: Combat rules for calculating dice counts based on unit type and distance
// ABOUTME: Used by BattlePhase to determine how many dice a unit rolls in battle

import {Unit, UnitType} from "../domain/Unit";
import {DiceResult, RESULT_INFANTRY, RESULT_GRENADE, RESULT_ARMOR} from "../domain/Dice";
import {
    hillTerrain,
    Terrain,
} from "../domain/terrain/Terrain";
import {Fortification} from "../domain/fortifications/Fortification";

interface DiceReducer {
    infantryBattleInReduction: number
    armorBattleInReduction: number
}

function reduction(attacker: Unit, reducer: DiceReducer) {
    if (attacker.type == UnitType.INFANTRY) {
        return reducer.infantryBattleInReduction;
    }
    if (attacker.type == UnitType.ARMOR) {
        return reducer.armorBattleInReduction;
    }
    return 0;
}

/**
 * Calculate the number of dice a unit rolls when battling at a given distance.
 *
 * Infantry units can battle at distances 1-3 with decreasing dice:
 * - Distance 1: 3 dice
 * - Distance 2: 2 dice
 * - Distance 3: 1 die
 *
 * @returns The number of dice to roll
 * @throws Error if the unit type is unsupported or distance is invalid
 */
export function calculateDiceCount(
    attacker: Unit,
    attackerTerrain: Terrain,
    distance: number,
    defenderTerrain: Terrain,
    defenderFortification: Fortification
): number {
    if (distance < 1) {
        throw new Error(`Invalid battle distance: ${distance}. Only positive numbers are valid.`);
    }

    let baseDice = attacker.baseBattleDice(distance);
    let terrainReduction = reduction(attacker, defenderTerrain);
    // Hill are treated specially
    if (attackerTerrain != hillTerrain && defenderTerrain === hillTerrain) {
        terrainReduction = 1;
    }
    let fortificationReduction = reduction(attacker, defenderFortification);

    // Apply max reduction (non-cumulative with terrain)
    baseDice -= Math.max(terrainReduction, fortificationReduction);


    return Math.max(0, baseDice);
}

/**
 * Resolve hits from dice results against a target unit.
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
        } else if (targetUnit.type === UnitType.ARMOR) {
            if (result === RESULT_ARMOR || result === RESULT_GRENADE) {
                hits++;
            }
        } else {
            throw new Error("Artillery not implemented");
        }
    }

    return hits;
}
