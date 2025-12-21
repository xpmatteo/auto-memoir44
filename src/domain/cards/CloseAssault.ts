import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {hexDistance} from "../../utils/hex";
import {UnitType} from "../Unit";
import {GeneralOrderUnitsPhase} from "../phases/GeneralOrderUnitsPhase";
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

        // Get all enemy positions
        const enemyUnits = gameState.getEnemyUnits();
        const enemyPositions = enemyUnits.map(su => su.coord);

        // Predicate: unit must be Infantry or Armor AND adjacent to an enemy
        gameState.pushPhase(new GeneralOrderUnitsPhase([{
            predicate: su => {
                // Must be Infantry or Armor
                if (su.unit.type !== UnitType.INFANTRY && su.unit.type !== UnitType.ARMOR) {
                    return false;
                }

                // Check if any enemy is adjacent (distance 1)
                for (const enemyCoord of enemyPositions) {
                    if (hexDistance(su.coord, enemyCoord) === 1) {
                        return true; // Unit is adjacent to an enemy, eligible
                    }
                }

                return false; // No adjacent enemies, not eligible
            },
            maxCount: this.howManyUnits
        }]));
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Keep only close combat moves and increase dice by 1
        return moves
            .filter(move => move.isCloseCombat(gameState))
            .map(move => move.increaseDice(1));
    }
}
