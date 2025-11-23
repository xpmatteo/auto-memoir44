// ABOUTME: Phase for battling with ordered units
// ABOUTME: Generates legal battle moves for units within 3 hexes of enemies

import {Phase} from "./Phase";
import {GameState} from "../GameState";
import {Move, BattleMove, EndBattlesMove} from "../Move";
import {Unit} from "../Unit";
import type {HexCoord} from "../../utils/hex";
import {hexDistance} from "../../utils/hex";
import type {Player} from "../Player";

// Declare which methods from GameState we actually need to do our job
export interface UnitBattler {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    unitSkipsBattle(unit: Unit): boolean;
    getAllUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    activePlayer: Player;
}

export class BattlePhase implements Phase {
    name: string = "Battle";

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
            // Skip units that skip battle (moved 2 hexes)
            if (unitBattler.unitSkipsBattle(fromUnit)) {
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
                    moves.push(new BattleMove(fromUnit, toUnit));
                }
            }
        }

        return moves;
    }
}
