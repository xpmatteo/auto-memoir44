// ABOUTME: ArmorAssault command card - orders up to 4 armor units for ranged or close combat
// ABOUTME: Increases dice by 1 for close combat attacks

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {UnitType} from "../Unit";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
import {BattleMove} from "../moves/BattleMove";
import {CommandCard} from "./CommandCard";

export class ArtilleryBombard extends CommandCard {
    readonly name = "Artillery Bombard";
    readonly imagePath = "images/cards/a1_artillery_bombard.png";
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());

        // Check if there are any artillery units available
        const hasArtillery = gameState.getFriendlyUnits().some(unit => unit.type === UnitType.ARTILLERY);

        if (hasArtillery) {
            // Artillery units who can battle, battle twice
            gameState.pushPhase(new BattlePhase(2));
            gameState.pushPhase(new MovePhase());
            gameState.pushPhase(new OrderUnitsPhase([{
                predicate: su => su.unit.type === UnitType.ARTILLERY,
                maxCount: this.howManyUnits
            }]));
        } else {
            // Fallback: if no armor units, allow ordering any 1 unit
            gameState.pushPhase(new BattlePhase());
            gameState.pushPhase(new MovePhase());
            gameState.pushPhase(new OrderUnitsPhase([{
                predicate: () => true,
                maxCount: 1
            }]));
        }
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Allow both ranged and close combat, but increase dice by 1 for close combat
        return moves.map(move =>
            move.isCloseCombat(gameState) ? move.increaseDice(1) : move
        );
    }
}
