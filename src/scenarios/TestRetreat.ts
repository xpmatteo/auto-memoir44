// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    .... in .in.    ....    ....    ....",
    "~~....    ....    .in. in .in.    ....    ....    ~~",
    ".... in ....    .IN. IN .IN. IN ....    .... in ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
];

export class TestRetreat implements Scenario {
    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);
        
        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);
    }
}
