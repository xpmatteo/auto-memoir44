// ABOUTME: Deferred task that executes combat for a single target
// ABOUTME: Used by AirPower and Barrage cards to sequence multiple combats with potential retreats

import {DeferredTask, TaskResult} from "../DeferredTask";
import {GameState} from "../GameState";
import {HexCoord} from "../../utils/hex";
import {Unit} from "../Unit";
import {resolveHits} from "../../rules/combat";
import {RESULT_FLAG} from "../Dice";
import {handleFlags} from "../../rules/flags";
import {retreatPaths} from "../../rules/retreatPaths";
import {RetreatPhase} from "../phases/RetreatPhase";
import {Position} from "../Player";

export class CombatTask implements DeferredTask {
    private readonly targetHex: HexCoord;
    private readonly dicePerTarget: number;
    private readonly starsCountAsHits: boolean;

    constructor(
        targetHex: HexCoord,
        dicePerTarget: number,
        starsCountAsHits: boolean
    ) {
        this.targetHex = targetHex;
        this.dicePerTarget = dicePerTarget;
        this.starsCountAsHits = starsCountAsHits;
    }

    execute(gameState: GameState): TaskResult {
        // Check if target still exists (may have been eliminated by previous CombatTask)
        const targetUnit = gameState.getUnitAt(this.targetHex);
        if (!targetUnit) {
            // Target no longer exists, skip combat
            return { type: 'complete' };
        }

        // Roll dice
        const diceResults = gameState.rollDice(this.dicePerTarget);

        // Resolve hits (whether stars count depends on the card)
        const hits = resolveHits(diceResults, targetUnit, this.starsCountAsHits);

        // Count flags
        const flagCount = diceResults.filter(result => result === RESULT_FLAG).length;

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(targetUnit);
        const newStrength = currentStrength - hits;
        gameState.setUnitCurrentStrength(targetUnit, newStrength);

        if (newStrength <= 0) {
            // Unit is eliminated
            this.eliminateUnit(gameState, this.targetHex, targetUnit);
            return { type: 'complete' };
        }

        // Handle flag results (retreat)
        if (flagCount > 0) {
            const retreats = retreatPaths(gameState, this.targetHex, flagCount, targetUnit.side);

            // Air power/barrage has no fortification benefits
            const ignorableFlags = 0;

            const flagResult = handleFlags(flagCount, ignorableFlags, retreats);

            // Apply any damage, then check if eliminated
            const newStrengthAfterFlagResult = newStrength - flagResult.damage;
            gameState.setUnitCurrentStrength(targetUnit, newStrengthAfterFlagResult);
            if (newStrengthAfterFlagResult <= 0) {
                this.eliminateUnit(gameState, this.targetHex, targetUnit);
                return { type: 'complete' };
            }

            // Only handle retreat if there are valid retreat hexes
            if (flagResult.retreats.length === 1) {
                // Only one retreat path - automatically move unit
                gameState.moveUnit(this.targetHex, flagResult.retreats[0]);
            } else if (flagResult.retreats.length > 1) {
                // Multiple retreat paths - push RetreatPhase so owner can choose
                gameState.pushPhase(new RetreatPhase(
                    targetUnit,
                    this.targetHex,
                    flagResult.retreats,
                    undefined,  // No attacker for take ground (air power/barrage)
                    undefined,
                    false       // No overrun
                ));
                // Task is done, but we pushed a phase, so pause task processing
                return { type: 'paused' };
            }
            // If flagResult.retreats.length === 0, all paths blocked and damage already applied
        }

        return { type: 'complete' };
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord, targetUnit: Unit): void {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(targetUnit, attackerPlayerIndex as 0 | 1);
    }

    clone(): CombatTask {
        return new CombatTask(this.targetHex, this.dicePerTarget, this.starsCountAsHits);
    }
}
