// ABOUTME: Dig In command card - orders up to 4 infantry and fortifies them with sandbags
// ABOUTME: Infantry on fortified hexes cannot be ordered; fallback to any 1 unit if no infantry exist

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {OrderUnitsByPredicatePhase} from "../phases/OrderUnitsByPredicatePhase";
import {DigInOrderPhase} from "../phases/DigInOrderPhase";
import {Unit, UnitType} from "../Unit";
import {CommandCard} from "./CommandCard";
import {noFortification} from "../fortifications/Fortification";

export class DigIn extends CommandCard {
    readonly name = "Dig In";
    readonly imagePath = "images/cards/a1_dig_in.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);

        const friendlyUnits = gameState.getFriendlyUnits();

        // Check if there are ANY infantry units (regardless of fortification)
        const hasAnyInfantry = friendlyUnits.some(unit => unit.type === UnitType.INFANTRY);

        if (hasAnyInfantry) {
            // Normal mode: Dig In with infantry (even if all are fortified)
            gameState.replacePhase(new ReplenishHandPhase());

            // NO Move or Battle phases - units cannot move after digging in

            // Predicate: Infantry not on fortified hexes
            // Note: If ALL infantry are fortified, this predicate will exclude all units.
            // The phase will only have ConfirmDigInMove available, which will do nothing.
            const predicate = (unit: Unit, gs: GameState): boolean => {
                if (unit.type !== UnitType.INFANTRY) return false;

                // Find unit's position
                const allUnits = gs.getAllUnitsWithPositions();
                const unitWithPos = allUnits.find(({unit: u}) => u.id === unit.id);
                if (!unitWithPos) return false;

                const fort = gs.getFortification(unitWithPos.coord);
                return fort === noFortification;
            };

            gameState.pushPhase(new DigInOrderPhase(this.howManyUnits, predicate));
        } else {
            // Fallback mode: Standard turn with 1 unit of any type
            gameState.replacePhase(new ReplenishHandPhase());
            gameState.pushPhase(new BattlePhase());
            gameState.pushPhase(new MovePhase());
            gameState.pushPhase(new OrderUnitsByPredicatePhase(1, () => true));
        }
    }
}
