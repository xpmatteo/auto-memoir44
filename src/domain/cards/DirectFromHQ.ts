import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {CommandCard} from "./CommandCard";

export class DirectFromHQ extends CommandCard {
    readonly name = "Direct from HQ";
    readonly imagePath = "images/cards/a2_direct_from_hq.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());
        gameState.pushPhase(new OrderUnitsByPredicatePhase(this.howManyUnits, () => true));
    }
}
