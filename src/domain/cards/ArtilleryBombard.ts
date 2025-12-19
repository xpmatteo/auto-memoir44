// ABOUTME: Artillery Bombard command card - orders all artillery units
// ABOUTME: Artillery can move up to 3 hexes OR battle twice (not both)

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {Unit, UnitType} from "../Unit";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {CommandCard} from "./CommandCard";
import {ArtilleryBombardMovementPhase} from "../phases/ArtilleryBombardMovementPhase";

export class ArtilleryBombard extends CommandCard {
    readonly name = "Artillery Bombard";
    readonly imagePath = "images/cards/a1_artillery_bombard.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());

        // Check if there are any artillery units available
        const friendlyUnits = gameState.getFriendlyUnits();
        const artilleryUnits = friendlyUnits.filter(unit => unit.type === UnitType.ARTILLERY);

        if (artilleryUnits.length > 0) {
            // Order all artillery units automatically
            artilleryUnits.forEach(unit => gameState.orderUnit(unit));

            // Push phases for artillery (battle twice, move up to 3)
            gameState.pushPhase(new BattlePhase(2)); // can battle twice
            gameState.pushPhase(new ArtilleryBombardMovementPhase(3)); // can move up to 3 hexes
        } else {
            // Fallback: if no artillery units, use normal phases
            gameState.pushPhase(new BattlePhase()); // normal battle (default: 1)
            gameState.pushPhase(new MovePhase()); // normal movement

            // Order one unit from any section
            const predicate = (_unit: Unit): boolean => {
                return true; // Any unit is eligible
            };
            gameState.pushPhase(new OrderUnitsByPredicatePhase(1, predicate));
        }
    }
}
