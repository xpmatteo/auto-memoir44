import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {hexDistance} from "../../utils/hex";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
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

        // Get all enemy positions
        const enemyUnits = gameState.getEnemyUnits();
        const enemyPositions = enemyUnits.map(su => su.coord);

        // Predicate: unit must NOT be adjacent to any enemy
        gameState.pushPhase(new OrderUnitsPhase([{
            predicate: su => {
                // Check if any enemy is adjacent (distance 1)
                for (const enemyCoord of enemyPositions) {
                    if (hexDistance(su.coord, enemyCoord) === 1) {
                        return false; // Unit is adjacent to an enemy, not eligible
                    }
                }
                return true; // No adjacent enemies, unit is eligible
            },
            maxCount: this.howManyUnits
        }]));
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Filter out close combat moves and increase dice by 1 for remaining moves
        return moves
            .filter(move => !move.isCloseCombat(gameState))
            .map(move => move.increaseDice(1));
    }
}
