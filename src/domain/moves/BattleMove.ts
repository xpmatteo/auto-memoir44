import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {resolveHits} from "../../rules/combat";
import {RESULT_FLAG} from "../Dice";
import {retreatPaths} from "../../rules/retreatPaths";
import {handleFlags} from "../../rules/flags";
import {RetreatPhase} from "../phases/RetreatPhase";
import {TakeGroundPhase} from "../phases/TakeGroundPhase";
import {HexCoord, hexDistance} from "../../utils/hex";
import {Position} from "../Player";
import {Move} from "./Move";
import {sandbagAllies, sandbagAxis} from "../fortifications/Fortification";

export class BattleMove extends Move {
    readonly fromUnit: Unit;
    readonly toUnit: Unit;
    readonly dice: number;

    constructor(fromUnit: Unit, toUnit: Unit, dice: number) {
        super();
        this.fromUnit = fromUnit;
        this.toUnit = toUnit;
        this.dice = dice;
    }

    execute(gameState: GameState): void {
        // Roll dice
        const diceResults = gameState.rollDice(this.dice);

        // Track that this unit has attacked
        gameState.incrementUnitBattlesThisTurn(this.fromUnit);

        // Find positions for both units
        const attacker = this.findUnit(gameState, this.fromUnit.id);
        const target = this.findUnit(gameState, this.toUnit.id);

        // Check if this is close combat (adjacent hexes)
        const isCloseCombat = hexDistance(attacker.coord, target.coord) === 1;

        // Resolve hits
        const hits = resolveHits(diceResults, this.toUnit);

        // Count flags
        const flagCount = diceResults.filter(result => result === RESULT_FLAG).length;

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(this.toUnit);
        const newStrength = currentStrength - hits;
        gameState.setUnitCurrentStrength(this.toUnit, newStrength);

        if (newStrength <= 0) {
            // Unit is eliminated - find its position and remove it
            this.eliminateUnit(gameState, target.coord);

            // If close combat, offer take ground option
            if (isCloseCombat) {
                gameState.pushPhase(new TakeGroundPhase(
                    this.fromUnit,
                    attacker.coord,
                    target.coord
                ));
            }
            return;
        }

        // Handle flag results (retreat)
        if (flagCount > 0) {
            const retreats = retreatPaths(gameState, target.coord, flagCount, this.toUnit.side);

            // Check if target is on a sandbag fortification (allows ignoring one flag)
            const fortification = gameState.getFortification(target.coord);
            const ignorableFlags = (fortification === sandbagAllies || fortification === sandbagAxis) ? 1 : 0;

            const flagResult = handleFlags(flagCount, ignorableFlags, retreats);

            // apply any damage, then check if eliminated
            const newStrengthAfterFlagResult = newStrength - flagResult.damage;
            gameState.setUnitCurrentStrength(this.toUnit, newStrengthAfterFlagResult);
            if (newStrengthAfterFlagResult <= 0) {
                this.eliminateUnit(gameState, target.coord);

                // If close combat, offer take ground option
                if (isCloseCombat) {
                    gameState.pushPhase(new TakeGroundPhase(
                        this.fromUnit,
                        attacker.coord,
                        target.coord
                    ));
                }
                return;
            }

            // Only handle retreat if there are valid retreat hexes
            if (flagResult.retreats.length === 1) {
                // Only one retreat path - automatically move unit
                gameState.moveUnit(target.coord, flagResult.retreats[0]);

                // If close combat, offer take ground option
                if (isCloseCombat) {
                    gameState.pushPhase(new TakeGroundPhase(
                        this.fromUnit,
                        attacker.coord,
                        target.coord // The hex that was just vacated
                    ));
                }
            } else if (flagResult.retreats.length > 1) {
                // Multiple retreat paths - push RetreatPhase so owner can choose
                // If close combat, pass attacker info so TakeGroundPhase can be pushed after retreat
                gameState.pushPhase(new RetreatPhase(
                    this.toUnit,
                    target.coord,
                    flagResult.retreats,
                    isCloseCombat ? this.fromUnit : undefined,
                    isCloseCombat ? attacker.coord : undefined
                ));
            }
            // If flagResult.retreats.length === 0, all paths blocked and damage already applied
        }
    }

    private findUnit(gameState: GameState, unitId: string) {
        const allUnits = gameState.getAllUnitsWithPositions();
        const attacker = allUnits.find(({unit}) => unit.id === unitId);
        if (!attacker) {
            throw new Error(`Could not find position for attacking unit ${unitId}`);
        }
        return attacker;
    }

    private findTarget(gameState: GameState) {
        const allUnits = gameState.getAllUnitsWithPositions();
        const target = allUnits.find(({unit}) => unit.id === this.toUnit.id);
        if (!target) {
            throw new Error(`Could not find position for target unit ${this.toUnit.id}`);
        }
        return target;
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord) {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(this.toUnit, attackerPlayerIndex as 0 | 1);
    }

    toString(): string {
        return `Battle(${this.fromUnit}, ${this.toUnit}, ${this.dice})`;
    }
}
