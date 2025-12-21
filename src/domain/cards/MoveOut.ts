import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
import {UnitType} from "../Unit";
import {CommandCard} from "./CommandCard";

export class MoveOut extends CommandCard {
    readonly name = "Move Out!";
    readonly imagePath = "images/cards/a2_move_out.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());

        // Check if there are any infantry units available
        const friendlyUnits = gameState.getFriendlyUnits();
        const hasInfantryUnits = friendlyUnits.some(unit => unit.type === UnitType.INFANTRY);

        if (hasInfantryUnits) {
            // Order up to 4 infantry units
            gameState.pushPhase(new OrderUnitsPhase([{
                predicate: su => su.unit.type === UnitType.INFANTRY,
                maxCount: this.howManyUnits
            }]));
        } else {
            // Fallback: if no infantry units, allow ordering any 1 unit
            gameState.pushPhase(new OrderUnitsPhase([{
                predicate: () => true,
                maxCount: 1
            }]));
        }
    }
}
