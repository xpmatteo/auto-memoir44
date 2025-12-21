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
import {GameEvent, BattleEvent, BattleOutcome, MedalEarnedEvent} from "../GameEvent";

export class BattleMove extends Move {
    readonly fromUnit: Unit;
    readonly toUnit: Unit;
    readonly dice: number;
    readonly popsPhaseAfterExecution: boolean;

    constructor(fromUnit: Unit, toUnit: Unit, dice: number, popsPhaseAfterExecution: boolean = false) {
        super();
        this.fromUnit = fromUnit;
        this.toUnit = toUnit;
        this.dice = dice;
        this.popsPhaseAfterExecution = popsPhaseAfterExecution;
    }

    execute(gameState: GameState): GameEvent[] {
        const events: GameEvent[] = [];

        // Pop phase if requested (used for armor overrun - only one attack allowed)
        if (this.popsPhaseAfterExecution) {
            gameState.popPhase();
        }

        // Roll dice
        const diceResults = gameState.rollDice(this.dice);

        // Track that this unit has attacked
        gameState.incrementUnitBattlesThisTurn(this.fromUnit);

        // Find positions for both units
        const attackerHex = this.findUnitHex(gameState, this.fromUnit.id);
        const targetHex = this.findUnitHex(gameState, this.toUnit.id);

        // Check if this is close combat (adjacent hexes)
        const isCloseCombat = hexDistance(attackerHex, targetHex) === 1;

        // Resolve hits
        const hits = resolveHits(diceResults, this.toUnit);

        // Count flags
        const flagCount = diceResults.filter(result => result === RESULT_FLAG).length;

        // Apply casualties to target unit
        const currentStrength = gameState.getUnitCurrentStrength(this.toUnit);
        const newStrength = currentStrength - hits;
        gameState.setUnitCurrentStrength(this.toUnit, newStrength);

        if (newStrength <= 0) {
            // Unit is eliminated
            const outcome: BattleOutcome = { type: 'eliminated' };
            events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
            events.push(new MedalEarnedEvent(gameState.activePlayer.side, this.toUnit));

            this.eliminateUnit(gameState, targetHex);

            // If close combat, offer take ground option
            if (isCloseCombat) {
                gameState.pushPhase(new TakeGroundPhase(
                    this.fromUnit,
                    attackerHex,
                    targetHex,
                    !this.popsPhaseAfterExecution  // If from overrun, don't allow another overrun
                ));
            }
            return events;
        }

        // Handle flag results (retreat)
        if (flagCount > 0) {
            const retreats = retreatPaths(gameState, targetHex, flagCount, this.toUnit.side);

            // Check if target is on a sandbag fortification (allows ignoring one flag)
            const fortification = gameState.getFortification(targetHex);
            const ignorableFlags = (fortification === sandbagAllies || fortification === sandbagAxis) ? 1 : 0;

            const flagResult = handleFlags(flagCount, ignorableFlags, retreats);

            // apply any damage, then check if eliminated
            const newStrengthAfterFlagResult = newStrength - flagResult.damage;
            gameState.setUnitCurrentStrength(this.toUnit, newStrengthAfterFlagResult);
            if (newStrengthAfterFlagResult <= 0) {
                // Eliminated by retreat damage
                const outcome: BattleOutcome = { type: 'eliminated' };
                events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
                events.push(new MedalEarnedEvent(gameState.activePlayer.side, this.toUnit));

                this.eliminateUnit(gameState, targetHex);

                // If close combat, offer take ground option
                if (isCloseCombat) {
                    gameState.pushPhase(new TakeGroundPhase(
                        this.fromUnit,
                        attackerHex,
                        targetHex,
                        !this.popsPhaseAfterExecution  // If from overrun, don't allow another overrun
                    ));
                }
                return events;
            }

            // Only handle retreat if there are valid retreat hexes
            if (flagResult.retreats.length === 1) {
                // Only one retreat path - automatically move unit
                const outcome: BattleOutcome = { type: 'retreat', flagCount };
                events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));

                gameState.moveUnit(targetHex, flagResult.retreats[0]);

                // If close combat, offer take ground option
                if (isCloseCombat) {
                    gameState.pushPhase(new TakeGroundPhase(
                        this.fromUnit,
                        attackerHex,
                        targetHex, // The hex that was just vacated
                        !this.popsPhaseAfterExecution  // If from overrun, don't allow another overrun
                    ));
                }
            } else if (flagResult.retreats.length > 1) {
                // Multiple retreat paths - push RetreatPhase so owner can choose
                const outcome: BattleOutcome = { type: 'retreat', flagCount };
                events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));

                // If close combat, pass attacker info so TakeGroundPhase can be pushed after retreat
                gameState.pushPhase(new RetreatPhase(
                    this.toUnit,
                    targetHex,
                    flagResult.retreats,
                    isCloseCombat ? this.fromUnit : undefined,
                    isCloseCombat ? attackerHex : undefined,
                    this.popsPhaseAfterExecution  // Pass overrun flag so retreat knows not to trigger another overrun
                ));
            } else {
                // flagResult.retreats.length === 0, all paths blocked and damage already applied
                if (hits > 0 || flagResult.damage > 0) {
                    const totalDamage = hits + flagResult.damage;
                    const outcome: BattleOutcome = { type: 'damage', damage: totalDamage };
                    events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
                } else {
                    const outcome: BattleOutcome = { type: 'no_effect' };
                    events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
                }
            }
        } else {
            // No flags - just damage or no effect
            if (hits > 0) {
                const outcome: BattleOutcome = { type: 'damage', damage: hits };
                events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
            } else {
                const outcome: BattleOutcome = { type: 'no_effect' };
                events.push(new BattleEvent(this.fromUnit, attackerHex, this.toUnit, targetHex, diceResults, outcome));
            }
        }

        return events;
    }

    private findUnitHex(gameState: GameState, unitId: string) {
        const allUnits = gameState.getAllUnitsWithPositions();
        const attacker = allUnits.find(({unit}) => unit.id === unitId);
        if (!attacker) {
            throw new Error(`Could not find position for attacking unit ${unitId}`);
        }
        return attacker.coord;
    }

    private eliminateUnit(gameState: GameState, coord: HexCoord) {
        gameState.removeUnit(coord);
        const attackerPlayerIndex = gameState.activePlayer.position === Position.BOTTOM ? 0 : 1;
        gameState.addToMedalTable(this.toUnit, attackerPlayerIndex as 0 | 1);
    }

    isCloseCombat(gameState: GameState): boolean {
        const attackerHex = this.findUnitHex(gameState, this.fromUnit.id);
        const targetHex = this.findUnitHex(gameState, this.toUnit.id);
        return hexDistance(attackerHex, targetHex) === 1;
    }

    increaseDice(amount: number): BattleMove {
        return new BattleMove(this.fromUnit, this.toUnit, this.dice + amount, this.popsPhaseAfterExecution);
    }

    toString(): string {
        return `Battle(${this.fromUnit}, ${this.toUnit}, ${this.dice})`;
    }
}
