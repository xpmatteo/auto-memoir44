// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import type {Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";
import {HexCoord} from "../utils/hex";

export class ST02Scenario implements Scenario {
    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Helper to place a unit at coordinates
        // US infantry at bottom (6 units with 4 figures each)
        gameState.placeUnit(new HexCoord(-2, 7), new Infantry(Side.ALLIES));
        gameState.placeUnit(new HexCoord(-1, 7), new Infantry(Side.ALLIES));

        gameState.placeUnit(new HexCoord(-0, 7), new Infantry(Side.ALLIES));

        gameState.placeUnit(new HexCoord(1, 7), new Infantry(Side.ALLIES));
        gameState.placeUnit(new HexCoord(2, 7), new Infantry(Side.ALLIES));
        gameState.placeUnit(new HexCoord(3, 7), new Infantry(Side.ALLIES));
        gameState.placeUnit(new HexCoord(4, 7), new Infantry(Side.ALLIES));

        gameState.placeUnit(new HexCoord(5, 7), new Infantry(Side.ALLIES));

        gameState.placeUnit(new HexCoord(6, 7), new Infantry(Side.ALLIES));
        gameState.placeUnit(new HexCoord(7, 7), new Infantry(Side.ALLIES));

        // German infantry at top (2 units with 4 figures each)
        gameState.placeUnit(new HexCoord(3, 4), new Infantry(Side.AXIS));
        gameState.placeUnit(new HexCoord(4, 4), new Infantry(Side.AXIS));
        gameState.placeUnit(new HexCoord(5, 4), new Infantry(Side.AXIS));
    }
}
