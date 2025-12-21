// ABOUTME: Dig In command card - orders up to 4 infantry and fortifies them with sandbags
// ABOUTME: Infantry on fortified hexes cannot be ordered; fallback to any 1 unit if no infantry exist

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {GeneralOrderUnitsPhase} from "../phases/GeneralOrderUnitsPhase";
import {UnitType} from "../Unit";
import {CommandCard} from "./CommandCard";
import {noFortification} from "../fortifications/Fortification";
import {SituatedUnit} from "../SituatedUnit";
import {ConfirmDigInMove} from "../moves/ConfirmDigInMove";

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

            // Note: If ALL infantry are fortified, this predicate will exclude all units.
            // The phase will only have ConfirmDigInMove available, which will do nothing.
            const predicate = (su: SituatedUnit) =>
                su.unit.type === UnitType.INFANTRY &&
                gameState.getFortification(su.coord) === noFortification;

            gameState.pushPhase(new GeneralOrderUnitsPhase(
                [{ predicate, maxCount: this.howManyUnits }],
                new ConfirmDigInMove()
            ));
        } else {
            // Fallback mode: Standard turn with 1 unit of any type
            gameState.replacePhase(new ReplenishHandPhase());
            gameState.pushPhase(new BattlePhase());
            gameState.pushPhase(new MovePhase());
            gameState.pushPhase(new GeneralOrderUnitsPhase([{ predicate: () => true, maxCount: 1 }]));
        }
    }
}
