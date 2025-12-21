// ABOUTME: ArmorAssault command card - orders up to 4 armor units for ranged or close combat
// ABOUTME: Increases dice by 1 for close combat attacks

import {GameState} from "../GameState";
import {ReplenishHandPhase} from "../phases/ReplenishHandPhase";
import {BattlePhase} from "../phases/BattlePhase";
import {MovePhase} from "../phases/MovePhase";
import {UnitType} from "../Unit";
import {OrderUnitsPhase} from "../phases/OrderUnitsPhase";
import {CommandCard} from "./CommandCard";
import {RESULT_ARMOR, RESULT_INFANTRY, RESULT_STAR} from "../Dice";
import {BattleMove} from "../moves/BattleMove";

export class TheirFinestHour extends CommandCard {
    readonly name = "Their Finest Hour";
    readonly imagePath = "images/cards/a1_finest_hour.png";
    readonly howManyUnits = 0;

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());

        const results = gameState.rollDice(gameState.activePlayerHandSize);
        const infantryResults = results.filter(res => res === RESULT_INFANTRY).length;
        const armorResults = results.filter(res => res === RESULT_ARMOR).length;
        const anyResults = results.filter(res => res === RESULT_STAR).length;

        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());
        gameState.pushPhase(new OrderUnitsPhase([
            {
                predicate: su => su.unit.type === UnitType.INFANTRY,
                maxCount: infantryResults,
            },
            {
                predicate: su => su.unit.type === UnitType.ARMOR,
                maxCount: armorResults,
            },
            {
                predicate: () => true,
                maxCount: anyResults,
            },
        ]));

        gameState.reshuffle();
    }

    fixBattleMoves(moves: BattleMove[], _gameState: GameState): BattleMove[] {
        return moves.map(battle => battle.increaseDice(1));
    }
}
