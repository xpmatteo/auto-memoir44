import {Scenario} from "../scenarios/Scenario";
import {Deck} from "./Deck";
import {GameState} from "./GameState";
import {Move} from "./moves/Move";


export function createGame(scenario: Scenario): Game {
    const deck = Deck.createStandardDeck();
    const gameState = new GameState(deck); // Use default Dice
    scenario.setup(gameState);
    return gameState
}

export interface Game {
    legalMoves(): Array<Move>

    executeMove(move: Move): void
}
