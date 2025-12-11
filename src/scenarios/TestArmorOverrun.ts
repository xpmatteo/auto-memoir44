// ABOUTME: Test scenario for retreat mechanics
// ABOUTME: Uses custom dice that return 50% FLAG, 50% STAR for testing retreat behavior

import {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {SeededRNG} from "../adapters/RNG";
import {Dice} from "../domain/Dice";
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
        // Create standard deck with RNG
        const deck = Deck.createStandardDeck(() => rng.random());
        deck.shuffle();

        // Create custom dice that return FLAG or STAR with 50% probability
        // The Die class maps random() * 6 to indices 0-5 in the values array
        // Index 4 = STAR, Index 5 = FLAG
        // To get index 4: return 4/6 (0.667)
        // To get index 5: return 5/6 (0.833)
        const customDiceRng = () => {
            return rng.random() < 0.5 ? 4/6 : 5/6;
        };
        const dice = new Dice(customDiceRng);

        // Create GameState with custom dice
        const gameState = new GameState(deck, dice);

        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);

        return gameState;
    }
}
