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

            // Find all enemy units within 3 hexes
            for (const {coord: toCoord, unit: toUnit} of allUnits) {
                // Skip friendly units
                if (toUnit.side === activeSide) {
                    continue;
                }

                // Check if within range (at most 3 hexes)
                const distance = hexDistance(fromCoord, toCoord);
                if (distance <= 3) {
                    moves.push(new BattleMove(fromUnit, toUnit));
                }
            }
        }

        return moves;
    }
}
