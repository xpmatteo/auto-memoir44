// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario, createStandardGameState} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {SeededRNG} from "../adapters/RNG";

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    .in.    ....    ....    ~~",
    "....    ....    ....    .in.    ....    ....    ....",
    "~~....    ....    .... in ....    ....    ....    ~~",
    "....    ....    .... in ....    ....    ....    ....",
    "~~....    ....    .in.    ....    ....    ....    ~~",
    ".... in ....    .... IN .IN. IN ....    .... in ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
];

export class TestAIAggression implements Scenario {
    createGameState(rng: SeededRNG): GameState {
        const gameState = createStandardGameState(rng);

        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);

        return gameState;
    }
}
