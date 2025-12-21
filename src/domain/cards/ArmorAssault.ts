// ABOUTME: ArmorAssault command card - orders up to 4 armor units for ranged or close combat
// ABOUTME: Increases dice by 1 for close combat attacks

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {UnitType} from "../Unit";
import {GeneralOrderUnitsPhase} from "../phases/GeneralOrderUnitsPhase";
import {BattleMove} from "../moves/BattleMove";
import {CommandCard} from "./CommandCard";

export class ArmorAssault extends CommandCard {
    readonly name = "Armor Assault";
    readonly imagePath = "images/cards/a2_armor_assault.png";
    readonly howManyUnits = 4;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());

        // Check if there are any armor units available
        const friendlyUnits = gameState.getFriendlyUnits();
        const hasArmorUnits = friendlyUnits.some(unit => unit.type === UnitType.ARMOR);

        if (hasArmorUnits) {
            // Order up to 4 armor units
            gameState.pushPhase(new GeneralOrderUnitsPhase([{
                predicate: su => su.unit.type === UnitType.ARMOR,
                maxCount: this.howManyUnits
            }]));
        } else {
            // Fallback: if no armor units, allow ordering any 1 unit
            gameState.pushPhase(new GeneralOrderUnitsPhase([{
                predicate: () => true,
                maxCount: 1
            }]));
        }
    }

    fixBattleMoves(moves: BattleMove[], gameState: GameState): BattleMove[] {
        // Allow both ranged and close combat, but increase dice by 1 for close combat
        return moves.map(move =>
            move.isCloseCombat(gameState) ? move.increaseDice(1) : move
        );
    }
}
