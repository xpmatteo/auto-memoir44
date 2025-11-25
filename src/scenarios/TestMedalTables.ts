// ABOUTME: Test scenario for medal table rendering with pre-eliminated units
// ABOUTME: Creates a simple game state with 3 units eliminated per side for visual testing

import type {Scenario} from "./Scenario.js";
import type {GameState} from "../domain/GameState.js";
import {Infantry} from "../domain/Unit.js";
import {Side} from "../domain/Player.js";
import {HexCoord} from "../utils/hex.js";
import {CardLocation} from "../domain/CommandCard.js";

export class TestMedalTablesScenario implements Scenario {
    setup(gameState: GameState): void {
        // Draw cards for both players
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Place a few active units on the board for context
        gameState.placeUnit(new HexCoord(3, 4), new Infantry(Side.ALLIES, 4));
        gameState.placeUnit(new HexCoord(9, 4), new Infantry(Side.AXIS, 4));

        // Bottom player (index 0) has eliminated 3 Axis units
        // These will be rendered in the BOTTOM medal circles (left side)
        const bottomMedal1 = new Infantry(Side.AXIS, 2);
        const bottomMedal2 = new Infantry(Side.AXIS, 3);
        const bottomMedal3 = new Infantry(Side.AXIS, 4);

        gameState.addToMedalTable(bottomMedal1, 0);
        gameState.addToMedalTable(bottomMedal2, 0);
        gameState.addToMedalTable(bottomMedal3, 0);

        // Top player (index 1) has eliminated 3 Allied units
        // These will be rendered in the TOP medal circles (right side)
        const topMedal1 = new Infantry(Side.ALLIES, 2);
        const topMedal2 = new Infantry(Side.ALLIES, 3);
        const topMedal3 = new Infantry(Side.ALLIES, 4);

        gameState.addToMedalTable(topMedal1, 1);
        gameState.addToMedalTable(topMedal2, 1);
        gameState.addToMedalTable(topMedal3, 1);
    }
}
