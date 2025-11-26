import {GameState} from "../GameState";
import {Move, ReplenishHandMove} from "../Move";
import {Phase, PhaseType} from "./Phase";

export class ReplenishHandPhase implements Phase {
    name: string = "Play Card";
    type = PhaseType.PLAY_CARD;

    legalMoves(gameState: GameState): Array<Move> {
        return [
            new ReplenishHandMove(gameState.peekCards(1)[0])
        ];
    }
}
