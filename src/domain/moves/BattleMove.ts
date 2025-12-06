import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {resolveHits} from "../../rules/combat";
import {RESULT_FLAG} from "../Dice";
import {retreatPaths} from "../../rules/retreatPaths";
import {handleFlags} from "../../rules/flags";
import {RetreatPhase} from "../phases/RetreatPhase";
import {HexCoord} from "../../utils/hex";
import {Position} from "../Player";
import {Move} from "./Move";

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

        // Resolve hits
        const hits = resolveHits(diceResults, this.toUnit);

        // Count flags (treat multiple flags as a single flag for now)
        let flagCount = diceResults.filter(result => result === RESULT_FLAG).length;
        if (flagCount > 1) {
            flagCount = 1;
        }

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(this.toUnit);
        const newStrength = currentStrength - hits;
        gameState.setUnitCurrentStrength(this.toUnit, newStrength);
        const target = this.findTarget(gameState);

        if (newStrength <= 0) {
            // Unit is eliminated - find its position and remove it
            this.eliminateUnit(gameState, target.coord);
            return;
        }

        // Handle flag results (retreat)
        if (flagCount > 0) {
            const retreats = retreatPaths(gameState, target.coord, flagCount, this.toUnit.side);
            const flagResult = handleFlags(flagCount, 0, retreats);

            // apply any damage, then check if eliminated
            const newStrengthAfterFlagResult = newStrength - flagResult.damage;
            gameState.setUnitCurrentStrength(this.toUnit, newStrengthAfterFlagResult);
            if (newStrengthAfterFlagResult <= 0) {
                const targetPosition = this.findTarget(gameState);
                this.eliminateUnit(gameState, targetPosition.coord);
                return;
            }

            if (flagResult.retreats.length === 1) {
                // Only one retreat path - automatically move unit
                gameState.moveUnit(target.coord, flagResult.retreats[0]);
            } else {
                // Multiple retreat paths - push RetreatPhase so owner can choose
                gameState.pushPhase(new RetreatPhase(
                    this.toUnit,
                    target.coord,
                    flagResult.retreats
                ));
            }
        }
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
