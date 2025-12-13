import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {HexCoord, hexDistance} from "../../utils/hex";
import {Unit, UnitType} from "../Unit";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {BattleMove} from "../moves/BattleMove";
import {CommandCard} from "./CommandCard";

export class CloseAssault extends CommandCard {
    readonly name = "Close Assault";
    readonly imagePath = "images/cards/a1_close_assault.png";
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

        // Predicate: unit must be Infantry or Armor AND adjacent to an enemy
        const predicate = (unit: Unit): boolean => {
            // Must be Infantry or Armor
            if (unit.type !== UnitType.INFANTRY && unit.type !== UnitType.ARMOR) {
                return false;
            }

            const unitCoord = unitPositions.get(unit.id);
            if (!unitCoord) {
                throw new Error("Unit not found, shouldn't happen");
            }

            // Check if any enemy is adjacent (distance 1)
            for (const enemyCoord of enemyPositions) {
                if (hexDistance(unitCoord, enemyCoord) === 1) {
                    return true; // Unit is adjacent to an enemy, eligible
                }
            }

            return false; // No adjacent enemies, not eligible
        };

        gameState.pushPhase(new OrderUnitsByPredicatePhase(this.howManyUnits, predicate));
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Keep only close combat moves and increase dice by 1
        return moves
            .filter(move => move.isCloseCombat(gameState))
            .map(move => move.increaseDice(1));
    }
}
