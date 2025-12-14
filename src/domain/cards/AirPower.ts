// ABOUTME: ArmorAssault command card - orders up to 4 armor units for ranged or close combat
// ABOUTME: Increases dice by 1 for close combat attacks

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {CommandCard} from "./CommandCard";

export class AirPower extends CommandCard {
    readonly name = "Armor Assault";
    readonly imagePath = "images/cards/a2_armor_assault.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
    }

}
