// ABOUTME: Phase for battling with ordered units
// ABOUTME: Generates legal battle moves for units within 3 hexes of enemies

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {Move, BattleMove, EndBattlesMove} from "../Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {hexDistance} from "../../utils/hex";
import type {Player} from "../Player";
import {calculateDiceCount} from "../../rules/combat";

// Declare which methods from GameState we actually need to do our job
export interface UnitBattler {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;

    unitSkipsBattle(unit: Unit): boolean;

    getUnitBattlesThisTurn(unit: Unit): number;

    getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;

    activePlayer: Player;
}

export class BattlePhase implements Phase {
    name = "Battle";
    type = PhaseType.BATTLE;

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitBattler: UnitBattler): Array<Move> {
        const moves: Array<Move> = [];

        // Always provide an EndBattlesMove
        moves.push(new EndBattlesMove());

        const orderedUnits = unitBattler.getOrderedUnitsWithPositions();
        const allUnits = unitBattler.getAllUnitsWithPositions();
        const activeSide = unitBattler.activePlayer.side;

        for (const {coord: fromCoord, unit: fromUnit} of orderedUnits) {
            // Skip units that skip battle
            if (unitBattler.unitSkipsBattle(fromUnit)) {
                continue;
            }

            // Skip units that have already attacked this turn
            if (unitBattler.getUnitBattlesThisTurn(fromUnit) > 0) {
                continue;
            }

            // Check if there are any adjacent enemies (close combat restriction)
            const hasAdjacentEnemy = allUnits.some(({coord, unit}) =>
                unit.side !== activeSide && hexDistance(fromCoord, coord) === 1
            );

            // Find all enemy units within range
            for (const {coord: toCoord, unit: toUnit} of allUnits) {
                // Skip friendly units
                if (toUnit.side === activeSide) {
                    continue;
                }

                const distance = hexDistance(fromCoord, toCoord);

                // If engaged in close combat (adjacent enemy), can only battle at distance 1
                if (hasAdjacentEnemy && distance > 1) {
                    continue;
                }

                // Otherwise, can battle enemies at distance 1-3
                if (distance <= 3) {
                    const dice = calculateDiceCount(fromUnit, distance);
                    moves.push(new BattleMove(fromUnit, toUnit, dice));
                }
            }
        }

        return moves;
    }
}
