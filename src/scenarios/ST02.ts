// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {HexCoord} from "../utils/hex";
import {hillTerrain, woodsTerrain} from "../domain/terrain/Terrain";

/*
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    ".in. in W...W   W...    ....    W...W   .... in .in.",
    "~~.in.    W...W   ....    ....W   W...    .in. in ~~",
    ".in.    ....    W...    ....    ....W   .in.W   T...",
    "~~....    ....    ....    T...    ....    ....    ~~",
    "....    ....    ....    Tin.T   ....    ....W   ....",
    "~~....HIN ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    .IN.    ....    ....    ....",
    "~~....    ....W   ....    W... IN ....    .IN.    ~~",
    "....    ....    .IN.    .... IN ....    ....    ....",
 */
const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    ".in. in ....    ....    ....    ....    .... in .in.",
    "~~.in.    ....    ....    ....    ....    .in. in ~~",
    ".in.    ....    ....    ....    ....    .in.    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    .in.    ....    ....    ....",
    "~~.... IN ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    .IN.    ....    ....    ....",
    "~~....    ....    ....    .... IN ....    .IN.    ~~",
    "....    ....    .IN.    .... IN ....    ....    ....",
];

export class ST02Scenario implements Scenario {
    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        gameState.setTerrain(new HexCoord(-1, 5), hillTerrain);
        gameState.setTerrain(new HexCoord(3, 0), woodsTerrain);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);
    }
}
