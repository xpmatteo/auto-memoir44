import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {HexCoord, hexDistance} from "../../utils/hex";
import {Unit} from "../Unit";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {BattleMove} from "../moves/BattleMove";
import {CommandCard} from "./CommandCard";

export class Firefight extends CommandCard {
    readonly name = "Firefight";
    readonly imagePath = "images/cards/a1_firefight.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());

        // Build a map of unit ID to coordinate
        const allUnitsWithPositions = gameState.getAllUnitsWithPositions();
        const unitPositions = new Map<string, HexCoord>();
        for (const {unit, coord} of allUnitsWithPositions) {
            unitPositions.set(unit.id, coord);
        }

        // Get all enemy units with their positions
        const activeSide = gameState.activePlayer.side;
        const enemyPositions: HexCoord[] = [];
        for (const {unit, coord} of allUnitsWithPositions) {
            if (unit.side !== activeSide) {
                enemyPositions.push(coord);
            }
        }

        // Predicate: unit must NOT be adjacent to any enemy
        const predicate = (unit: Unit): boolean => {
            const unitCoord = unitPositions.get(unit.id);
            if (!unitCoord) {
                throw new Error("Unit not found, shouldn't happen");
            }

            // Check if any enemy is adjacent (distance 1)
            for (const enemyCoord of enemyPositions) {
                if (hexDistance(unitCoord, enemyCoord) === 1) {
                    return false; // Unit is adjacent to an enemy, not eligible
                }
            }

            return true; // No adjacent enemies, unit is eligible
        };

        gameState.pushPhase(new OrderUnitsByPredicatePhase(this.howManyUnits, predicate));
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Filter out close combat moves and increase dice by 1 for remaining moves
        return moves
            .filter(move => !move.isCloseCombat(gameState))
            .map(move => move.increaseDice(1));
    }
}
