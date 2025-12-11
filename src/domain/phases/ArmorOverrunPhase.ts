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
        const moves: Move[] = [];

        // Always offer EndBattlesMove (to decline the overrun)
        moves.push(new EndBattlesMove());

        const allUnits = unitBattler.getAllUnits();
        const activeSide = unitBattler.activePlayer.side;
        const fromUnitTerrain = unitBattler.getTerrain(this.armorPosition);

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

        for (const {coord: toCoord, unit: toUnit, terrain: defenderTerrain} of allUnits) {
            // Skip friendly units
            if (toUnit.side === activeSide) {
                continue;
            }

            const distance = hexDistance(this.armorPosition, toCoord);

            // If engaged in close combat (adjacent enemy), can only battle at distance 1
            if (hasAdjacentEnemy && distance > 1) {
                continue;
            }

            // Armor can attack at range 1-3
            if (distance < 1 || distance > 3) {
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

            if (dice > 0) {
                potentialTargets.push({
                    unit: toUnit,
                    coord: toCoord,
                    distance,
                    dice
                });
            }
        }

        // Apply distance prioritization: if ANY target at distance 1, ONLY offer distance 1
        const hasDistanceOneTarget = potentialTargets.some(t => t.distance === 1);

        const finalTargets = hasDistanceOneTarget
            ? potentialTargets.filter(t => t.distance === 1)
            : potentialTargets;

        // Generate BattleMoves with popsPhaseAfterExecution = true
        // (armor overrun allows only ONE attack, then phase ends)
        for (const {unit: toUnit, dice} of finalTargets) {
            moves.push(new BattleMove(this.armorUnit, toUnit, dice, true));
        }

        return moves;
    }
}
