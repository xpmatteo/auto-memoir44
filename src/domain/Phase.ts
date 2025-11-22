import {GameState} from "./GameState";
import {Move} from "./Move";

export interface Phase {
    readonly name: string;

    legalMoves(gameState: GameState): Array<Move>;
}

