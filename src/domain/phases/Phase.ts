import {GameState} from "../GameState";
import {Move} from "../Move";

// A Phase defines which moves are available to the current player at any given time
export interface Phase {
    readonly name: string;

    legalMoves(gameState: GameState): Array<Move>;
}

