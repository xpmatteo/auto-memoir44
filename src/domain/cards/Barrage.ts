// ABOUTME: Barrage command card - select one enemy unit for artillery barrage
// ABOUTME: Battle with 4 dice, stars don't count as hits, terrain protection ignored

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {CommandCard} from "./CommandCard";
import {SelectTargetPhase} from "../phases/SelectTargetPhase";

export class Barrage extends CommandCard {
    readonly name = "Barrage";
    readonly imagePath = "images/cards/a1_barrage.png";
    readonly howManyUnits = 1;
    readonly dicePerTarget = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());

        // Stars don't count as hits for Barrage
        gameState.pushPhase(new SelectTargetPhase(this.howManyUnits, this.dicePerTarget, false));
    }

}
