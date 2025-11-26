import {GameState} from "../GameState";
import {Move, ReplenishHandMove} from "../Move";
import {Phase, PhaseType} from "./Phase";

export class ReplenishHandPhase implements Phase {
    name: string = "Replenish hand";
    type = PhaseType.REPLENISH_HAND;

    legalMoves(gameState: GameState): Array<Move> {
        return [
            new ReplenishHandMove(gameState.peekOneCard())
        ];
    }
}
