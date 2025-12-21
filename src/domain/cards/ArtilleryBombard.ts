// ABOUTME: ArmorAssault command card - orders up to 4 armor units for ranged or close combat
// ABOUTME: Increases dice by 1 for close combat attacks

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {Unit, UnitType} from "../Unit";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
import {CommandCard} from "./CommandCard";

export class ArtilleryBombard extends CommandCard {
    readonly name = "Artillery Bombard";
    readonly imagePath = "images/cards/a1_artillery_bombard.png";
    readonly howManyUnits = 0;

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
                maxCount: 1000, // all
            }]));
        } else {
            // Fallback: if no armor units, allow ordering any 1 unit
            gameState.pushPhase(new BattlePhase());
            gameState.pushPhase(new MovePhase());
            gameState.pushPhase(new OrderUnitsPhase([{
                predicate: () => true,
                maxCount: 1,
            }]));
        }
    }

    fixUnitMaxMovement(unit: Unit): number {
        // Artillery moves up to 3 hexes
        if (unit.type === UnitType.ARTILLERY) {
            return 3;
        }
        return unit.maxMovementDistance();
    }
}
