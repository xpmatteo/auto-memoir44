// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import type {Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";

export class ST02Scenario implements Scenario {
    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Helper to place a unit at coordinates
        // US infantry at bottom (6 units with 4 figures each)
        gameState.placeUnit({q: -3, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: -2, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: -1, r: 7}, new Infantry(Side.ALLIES));

        gameState.placeUnit({q: -0, r: 7}, new Infantry(Side.ALLIES));

        gameState.placeUnit({q: 1, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: 2, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: 3, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: 4, r: 7}, new Infantry(Side.ALLIES));

        gameState.placeUnit({q: 5, r: 7}, new Infantry(Side.ALLIES));

        gameState.placeUnit({q: 6, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: 7, r: 7}, new Infantry(Side.ALLIES));
        gameState.placeUnit({q: 8, r: 7}, new Infantry(Side.ALLIES));

        // German infantry at top (2 units with 4 figures each)
        gameState.placeUnit({q: 5, r: 1}, new Infantry(Side.AXIS));
        gameState.placeUnit({q: 6, r: 1}, new Infantry(Side.AXIS));
        gameState.placeUnit({q: 7, r: 1}, new Infantry(Side.AXIS));
    }
}
