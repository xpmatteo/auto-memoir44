// ABOUTME: AirPower command card - select up to 4 contiguous enemy units for air attack
// ABOUTME: Allies battle with 2 dice per target, Axis with 1 die per target

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {CommandCard} from "./CommandCard";
import {SelectTargetPhase} from "../phases/SelectTargetPhase";
import {Side} from "../Player";

export class AirPower extends CommandCard {
    readonly name = "Air Power";
    readonly imagePath = "images/cards/a1_airpower.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());

        // Dice per target varies by side: Allies get 2, Axis gets 1
        const dicePerTarget = (side: Side) => side === Side.ALLIES ? 2 : 1;

        gameState.pushPhase(new SelectTargetPhase(this.howManyUnits, dicePerTarget));
    }

}
