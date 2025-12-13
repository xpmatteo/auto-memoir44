// ABOUTME: Phase for battling with ordered units
// ABOUTME: Generates legal battle moves for units within 3 hexes of enemies

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move, EndBattlesMove} from "../moves/Move";
import {HexCoord} from "../../utils/hex";
import {hexDistance, hasLineOfSight} from "../../utils/hex";
import type {Player} from "../Player";
import {calculateDiceCount} from "../../rules/combat";
import {Terrain} from "../terrain/Terrain";
import {Fortification} from "../fortifications/Fortification";
import {BattleMove} from "../moves/BattleMove";
import {SituatedUnit} from "../SituatedUnit";

// Declare which methods from GameState we actually need to do our job
export interface UnitBattler {
    getAllUnits(): SituatedUnit[];
    getTerrain(coord: HexCoord): Terrain;
    getFortification(coord: HexCoord): Fortification;

    activePlayer: Player;
}

export class BattlePhase implements Phase {
    name = "Battle";
    type = PhaseType.BATTLE;

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitBattler: UnitBattler): Array<Move> {
        const battleMoves: BattleMove[] = [];

        const allUnits = unitBattler.getAllUnits();
        const activeSide = unitBattler.activePlayer.side;

        // Filter for ordered units
        const orderedUnits = allUnits.filter(({unitState}) => unitState.isOrdered);

        for (const fromUnit of orderedUnits) {
            // Skip units that skip battle
            if (fromUnit.unitState.skipsBattle) {
                continue;
            }

            // Skip units that have already attacked this turn
            if (fromUnit.unitState.battlesThisTurn > 0) {
                continue;
            }

            // Check if there are any adjacent enemies (close combat restriction)
            const hasAdjacentEnemy = allUnits.some(({coord, unit}) =>
                unit.side !== activeSide && hexDistance(fromUnit.coord, coord) === 1
            );

            // Find all enemy units within range
            for (const {coord: toCoord, unit: toUnit, terrain: defenderTerrain} of allUnits) {
                // Skip friendly units
                if (toUnit.side === activeSide) {
                    continue;
                }

                const distance = hexDistance(fromUnit.coord, toCoord);

                // If engaged in close combat (adjacent enemy), can only battle at distance 1
                if (hasAdjacentEnemy && distance > 1) {
                    continue;
                }

                // Otherwise, can battle enemies at distance 1-3
                if (distance <= 3) {
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
                        return terrainAtHex.blocksLineOfSight;
                    };

                    if (!hasLineOfSight(toCoord, fromUnit.coord, isBlocked)) {
                        continue;
                    }

                    const defenderFortification = unitBattler.getFortification(toCoord);
                    const dice = calculateDiceCount(fromUnit.unit, fromUnit.terrain, distance, defenderTerrain, defenderFortification);
                    if (dice > 0) {
                        battleMoves.push(new BattleMove(fromUnit.unit, toUnit, dice));
                    }
                }
            }
        }

        // Apply card-specific battle move transformations
        const gameState = unitBattler as GameState;
        const activeCard = gameState.activeCard;
        const fixedBattleMoves = activeCard ? activeCard.fixBattleMoves(battleMoves, gameState) : battleMoves;

        // Always provide an EndBattlesMove
        return [new EndBattlesMove(), ...fixedBattleMoves];
    }
}
