import {Scenario} from "../scenarios/Scenario";
import {Move} from "./moves/Move";
import {SeededRNG} from "../adapters/RNG";


export function createGame(scenario: Scenario, rng?: SeededRNG): Game {
    const actualRng = rng ?? new SeededRNG();
    const gameState = scenario.createGameState(actualRng);
    return gameState
}

export interface Game {
    legalMoves(): Array<Move>

    executeMove(move: Move): void
}
