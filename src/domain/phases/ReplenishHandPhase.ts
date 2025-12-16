// ABOUTME: Phase for drawing a single card to replenish hand after playing a card
// ABOUTME: Standard replenishment - automatically draws one card from deck

import {GameState} from "../GameState";
import {Move, ReplenishHandMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";

export class ReplenishHandPhase extends Phase {
    name: string = "Replenish hand";
    type = PhaseType.REPLENISH_HAND;

    legalMoves(gameState: GameState): Array<Move> {
        return [
            new ReplenishHandMove(gameState.peekOneCard())
        ];
    }
}
