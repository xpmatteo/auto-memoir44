import {GameState} from "./GameState";
import {Move, PlayCardMove} from "./Move";
import {Position} from "./Player";
import {CardLocation} from "./CommandCard";

export interface Phase {
    legalMoves(gameState: GameState): Array<Move>;
}

export class PlayCardPhase implements Phase {
    legalMoves(gameState: GameState): Array<Move> {
        let location = (gameState.activePlayer.position === Position.BOTTOM) ?
            CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return gameState.getCardsInLocation(location).map(card => new PlayCardMove(card));
    }
}
