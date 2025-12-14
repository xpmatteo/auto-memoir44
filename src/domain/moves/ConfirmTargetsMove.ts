// ABOUTME: Move that confirms target selection and executes air power battles
// ABOUTME: Automatically battles all targeted units with variable dice based on attacking side

import {GameState} from "../GameState";
import {Move} from "./Move";
import {resolveHits} from "../../rules/combat";
import {RESULT_FLAG} from "../Dice";
import {handleFlags} from "../../rules/flags";
import {retreatPaths} from "../../rules/retreatPaths";
import {RetreatPhase} from "../phases/RetreatPhase";
import {HexCoord} from "../../utils/hex";
import {Position} from "../Player";

export class ConfirmTargetsMove extends Move {
    private readonly dicePerTarget: number;
    private readonly starsCountAsHits: boolean;

    constructor(dicePerTarget: number, starsCountAsHits: boolean = true) {
        super();
        this.dicePerTarget = dicePerTarget;
        this.starsCountAsHits = starsCountAsHits;
    }

    execute(gameState: GameState): void {
        const allUnits = gameState.getAllUnits();
        const targetedUnits = allUnits.filter(su => su.unitState.isTargeted);

        // Execute air power battle against each targeted unit
        for (const su of targetedUnits) {
            const targetHex = su.coord;
            const targetUnit = su.unit;
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
                this.eliminateUnit(gameState, targetHex, targetUnit);
                continue;
            }

            // Handle flag results (retreat)
            if (flagCount > 0) {
                const retreats = retreatPaths(gameState, targetHex, flagCount, targetUnit.side);

                // Air power has no fortification benefits
                const ignorableFlags = 0;

                const flagResult = handleFlags(flagCount, ignorableFlags, retreats);

                // Apply any damage, then check if eliminated
                const newStrengthAfterFlagResult = newStrength - flagResult.damage;
                gameState.setUnitCurrentStrength(targetUnit, newStrengthAfterFlagResult);
                if (newStrengthAfterFlagResult <= 0) {
                    this.eliminateUnit(gameState, targetHex, targetUnit);
                    continue;
                }

                // Only handle retreat if there are valid retreat hexes
                if (flagResult.retreats.length === 1) {
                    // Only one retreat path - automatically move unit
                    gameState.moveUnit(targetHex, flagResult.retreats[0]);
                } else if (flagResult.retreats.length > 1) {
                    // Multiple retreat paths - push RetreatPhase so owner can choose
                    gameState.pushPhase(new RetreatPhase(
                        targetUnit,
                        targetHex,
                        flagResult.retreats,
                        undefined,  // No attacker for take ground (air power)
                        undefined,
                        false       // No overrun
                    ));
                }
                // If flagResult.retreats.length === 0, all paths blocked and damage already applied
            }
        }

        // Pop the SelectTargetPhase
        gameState.popPhase();
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord, targetUnit: any) {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(targetUnit, attackerPlayerIndex as 0 | 1);
    }

    uiButton(): Array<{label: string, callback: (gameState: GameState) => void}> {
        return [{
            label: "Confirm Targets",
            callback: (gameState: GameState) => {
                this.execute(gameState);
            },
        }];
    }

    toString(): string {
        return `ConfirmTargetsMove(${this.dicePerTarget} dice, starsCountAsHits=${this.starsCountAsHits})`;
    }
}
