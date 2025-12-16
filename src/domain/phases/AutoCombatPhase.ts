// ABOUTME: Phase that automatically executes combat for a single target when popped up
// ABOUTME: Used by AirPower and Barrage cards to sequence multiple combats with potential retreats

import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {HexCoord} from "../../utils/hex";
import {Unit} from "../Unit";
import {resolveHits} from "../../rules/combat";
import {RESULT_FLAG} from "../Dice";
import {handleFlags} from "../../rules/flags";
import {retreatPaths} from "../../rules/retreatPaths";
import {RetreatPhase} from "./RetreatPhase";
import {Position} from "../Player";

export class AutoCombatPhase extends Phase {
    readonly name: string = "Auto Combat";
    readonly type = PhaseType.AUTO_COMBAT;

    private readonly targetHex: HexCoord;
    private readonly dicePerTarget: number;
    private readonly starsCountAsHits: boolean;

    constructor(
        targetHex: HexCoord,
        dicePerTarget: number,
        starsCountAsHits: boolean
    ) {
        super();
        this.targetHex = targetHex;
        this.dicePerTarget = dicePerTarget;
        this.starsCountAsHits = starsCountAsHits;
    }

    legalMoves(_gameState: GameState): Array<Move> {
        // This phase should never be active long enough to call legalMoves
        // because it pops itself immediately in onBeingPoppedUp()
        return [];
    }

    onBeingPoppedUp(gameState: GameState): void {
        // Check if target still exists (may have been eliminated by previous AutoCombatPhase)
        const targetUnit = gameState.getUnitAt(this.targetHex);
        if (!targetUnit) {
            // Target no longer exists, skip combat and pop ourselves
            gameState.popPhase();
            return;
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
            // Pop ourselves and continue to next AutoCombatPhase
            gameState.popPhase();
            return;
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
                // Pop ourselves and continue
                gameState.popPhase();
                return;
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
            }
            // If flagResult.retreats.length === 0, all paths blocked and damage already applied
        }

        // Pop ourselves out of the way (RetreatPhase will be on top if we pushed it)
        gameState.popPhase();
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord, targetUnit: Unit): void {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(targetUnit, attackerPlayerIndex as 0 | 1);
    }
}
