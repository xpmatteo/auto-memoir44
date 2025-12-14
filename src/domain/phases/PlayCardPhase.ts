// ABOUTME: Phase for selecting and playing a command card from hand
// ABOUTME: First phase of each turn - determines the rest of the turn's actions

import {GameState} from "../GameState";
import {Move, PlayCardMove} from "../moves/Move";
import {Position} from "../Player";
import {CardLocation} from "../cards/CommandCard";
import {Phase, PhaseType} from "./Phase";

export class PlayCardPhase implements Phase {
    name: string = "Play Card";
    type = PhaseType.PLAY_CARD;

    legalMoves(gameState: GameState): Array<Move> {
        let location = (gameState.activePlayer.position === Position.BOTTOM) ?
            CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return gameState.getCardsInLocation(location).map(card => new PlayCardMove(card));
    }
}
