// ABOUTME: Phase for armor overrun attacks after taking ground
// ABOUTME: Prioritizes distance 1 targets, offers single battle opportunity

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move, EndBattlesMove} from "../moves/Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {hexDistance, hasLineOfSight} from "../../utils/hex";
import {calculateDiceCount} from "../../rules/combat";
import {BattleMove} from "../moves/BattleMove";
import {UnitBattler} from "./BattlePhase";

export class ArmorOverrunPhase implements Phase {
    readonly name = "Armor Overrun";
    readonly type = PhaseType.BATTLE;

    readonly armorUnit: Unit;
    readonly armorPosition: HexCoord;

    constructor(armorUnit: Unit, armorPosition: HexCoord) {
        this.armorUnit = armorUnit;
        this.armorPosition = armorPosition;
    }

    legalMoves(gameState: GameState): Move[] {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitBattler: UnitBattler): Move[] {
        console.log(`[ArmorOverrunPhase] Starting legalMoves for armor at ${this.armorPosition.q},${this.armorPosition.r}`);
        const moves: Move[] = [];

        // Always offer EndBattlesMove (to decline the overrun)
        moves.push(new EndBattlesMove());

        const allUnits = unitBattler.getAllUnits();
        console.log(`[ArmorOverrunPhase] Found ${allUnits.length} total units on board`);
        const activeSide = unitBattler.activePlayer.side;
        const fromUnitTerrain = unitBattler.getTerrain(this.armorPosition);
        console.log(`[ArmorOverrunPhase] Active side: ${activeSide}, armor terrain: ${fromUnitTerrain.name}`);

        // Find all valid targets with their distances
        interface PotentialTarget {
            unit: Unit;
            coord: HexCoord;
            distance: number;
            dice: number;
        }

        const potentialTargets: PotentialTarget[] = [];

        // Check for adjacent enemies (close combat restriction)
        const hasAdjacentEnemy = allUnits.some(({coord, unit}) =>
            unit.side !== activeSide && hexDistance(this.armorPosition, coord) === 1
        );
        console.log(`[ArmorOverrunPhase] Has adjacent enemy: ${hasAdjacentEnemy}`);

        for (const {coord: toCoord, unit: toUnit, terrain: defenderTerrain} of allUnits) {
            // Skip friendly units
            if (toUnit.side === activeSide) {
                console.log(`[ArmorOverrunPhase] Skipping friendly unit at ${toCoord.q},${toCoord.r}`);
                continue;
            }

            const distance = hexDistance(this.armorPosition, toCoord);
            console.log(`[ArmorOverrunPhase] Checking enemy ${toUnit.type} at ${toCoord.q},${toCoord.r}, distance ${distance}`);

            // If engaged in close combat (adjacent enemy), can only battle at distance 1
            if (hasAdjacentEnemy && distance > 1) {
                console.log(`[ArmorOverrunPhase]   -> Filtered: has adjacent enemy and distance > 1`);
                continue;
            }

            // Armor can attack at range 1-3
            if (distance < 1 || distance > 3) {
                console.log(`[ArmorOverrunPhase]   -> Filtered: distance out of range (${distance})`);
                continue;
            }

            // Check line of sight
            const isBlocked = (hexCoord: HexCoord): boolean => {
                // Check if there's a unit at this hex
                const unitAtHex = allUnits.find(({coord}) =>
                    coord.q === hexCoord.q && coord.r === hexCoord.r
                );
                if (unitAtHex) {
                    return true;
                }

                // Check if terrain blocks LOS
                const terrainAtHex = unitBattler.getTerrain(hexCoord);
                if (terrainAtHex.blocksLineOfSight) {
                    return true;
                }

                return false;
            };

            if (!hasLineOfSight(toCoord, this.armorPosition, isBlocked)) {
                console.log(`[ArmorOverrunPhase]   -> Filtered: no line of sight`);
                continue;
            }

            // Calculate dice
            const defenderFortification = unitBattler.getFortification(toCoord);
            const dice = calculateDiceCount(
                this.armorUnit,
                fromUnitTerrain,
                distance,
                defenderTerrain,
                defenderFortification
            );
            console.log(`[ArmorOverrunPhase]   -> Dice count: ${dice}`);

            if (dice > 0) {
                potentialTargets.push({
                    unit: toUnit,
                    coord: toCoord,
                    distance,
                    dice
                });
                console.log(`[ArmorOverrunPhase]   -> Added to potential targets`);
            } else {
                console.log(`[ArmorOverrunPhase]   -> Filtered: dice count is 0`);
            }
        }

        console.log(`[ArmorOverrunPhase] Potential targets: ${potentialTargets.length}`);

        // Apply distance prioritization: if ANY target at distance 1, ONLY offer distance 1
        const hasDistanceOneTarget = potentialTargets.some(t => t.distance === 1);
        console.log(`[ArmorOverrunPhase] Has distance 1 target: ${hasDistanceOneTarget}`);

        const finalTargets = hasDistanceOneTarget
            ? potentialTargets.filter(t => t.distance === 1)
            : potentialTargets;
        console.log(`[ArmorOverrunPhase] Final targets after distance prioritization: ${finalTargets.length}`);

        // Generate BattleMoves
        for (const {unit: toUnit, dice} of finalTargets) {
            console.log(`[ArmorOverrunPhase] Adding BattleMove against ${toUnit.type} with ${dice} dice`);
            moves.push(new BattleMove(this.armorUnit, toUnit, dice));
        }

        console.log(`[ArmorOverrunPhase] Total moves (including EndBattlesMove): ${moves.length}`);
        return moves;
    }
}
