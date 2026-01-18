// ABOUTME: Test scenario for artillery

import {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/cards/CommandCard";
import {SeededRNG} from "../adapters/RNG";
import {Deck} from "../domain/Deck";

const unitSetup = [
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    .... in .in. in ....    ....    ....",
    "~~....    ....    .ins in .ins    ....    ....    ~~",
    ".... in ....    .RT. AR .AR. AR ....    .... in ....",
    "~~....    ....    .RT.    ....    ....    ....    ~~",
    "....    .RT.    ....    ....    ....    ....    ....",
];

export class TestArtillery implements Scenario {
    createGameState(rng: SeededRNG): GameState {
        const deck = Deck.createStandardDeck(() => rng.random());
        deck.shuffle();
        const gameState = new GameState(deck);
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(5, CardLocation.TOP_PLAYER_HAND);
        parseAndSetupUnits(gameState, unitSetup);
        return gameState;
    }
}
