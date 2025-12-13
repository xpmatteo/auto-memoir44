import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
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
        gameState.pushPhase(
            new OrderUnitsByPredicatePhase(this.howManyUnits, (unit) => unit.type === UnitType.INFANTRY)
        );
    }
}
