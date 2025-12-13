// ABOUTME: Test scenario for retreat mechanics
// ABOUTME: Uses custom dice that return 50% FLAG, 50% STAR for testing retreat behavior

import {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/cards/CommandCard";
import {SeededRNG} from "../adapters/RNG";
import {Dice, RESULT_FLAG} from "../domain/Dice";
import {Deck} from "../domain/Deck";

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    .... in .in. in ....    ....    ....",
    "~~....    ....    .ins in .ins    ....    ....    ~~",
    ".... in ....    .AR. AR .AR. AR ....    .... in ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
];

export class TestArmorOverrun implements Scenario {
    createGameState(rng: SeededRNG): GameState {
        const deck = Deck.createStandardDeck(() => rng.random());
        deck.shuffle();

        const allFlagsDice = new Dice(() => rng.random(), [
            RESULT_FLAG, RESULT_FLAG, RESULT_FLAG,
            RESULT_FLAG, RESULT_FLAG, RESULT_FLAG
        ]);
        const gameState = new GameState(deck, allFlagsDice);

        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);

        return gameState;
    }
}
