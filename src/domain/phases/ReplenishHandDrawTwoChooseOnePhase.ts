// ABOUTME: Phase for drawing two cards and choosing one to keep
// ABOUTME: Special replenishment - player sees two cards and selects which to add to hand

import {GameState} from "../GameState";
import {Move, ReplenishHandChooseCardMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";

export class ReplenishHandDrawTwoChooseOnePhase implements Phase {
    name: string = "Replenish hand (draw 2, choose 1)";
    type = PhaseType.REPLENISH_HAND;

    legalMoves(gameState: GameState): Array<Move> {
        const cards = gameState.peekCards(2);

        // Create two moves: one for choosing each card
        return [
            new ReplenishHandChooseCardMove(cards[0], cards[1]),
            new ReplenishHandChooseCardMove(cards[1], cards[0])
        ];
    }
}
