import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {Unit, UnitType} from "../Unit";
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
            // Predicate: unit must be Infantry
            const predicate = (unit: Unit): boolean => {
                return unit.type === UnitType.INFANTRY;
            };
            gameState.pushPhase(new OrderUnitsByPredicatePhase(this.howManyUnits, predicate));
        } else {
            // Fallback: if no infantry units, allow ordering any 1 unit
            const predicate = (_unit: Unit): boolean => {
                return true; // Any unit is eligible
            };
            gameState.pushPhase(new OrderUnitsByPredicatePhase(1, predicate));
        }
    }
}
