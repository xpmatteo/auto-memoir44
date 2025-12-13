// ABOUTME: Test scenario for medal table rendering with pre-eliminated units
// ABOUTME: Creates a simple game state with 3 units eliminated per side for visual testing

import type {Scenario} from "./Scenario.js";
import {createStandardGameState} from "./Scenario.js";
import type {GameState} from "../domain/GameState.js";
import {Infantry} from "../domain/Unit.js";
import {Side} from "../domain/Player.js";
import {HexCoord} from "../utils/hex.js";
import {CardLocation} from "../domain/cards/CommandCard";
import {SeededRNG} from "../adapters/RNG.js";

export class TestMedalTablesScenario implements Scenario {
    createGameState(rng: SeededRNG): GameState {
        const gameState = createStandardGameState(rng);
        // Draw cards for both players
        gameState.drawCards(6, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Place a few active units on the board for context
        gameState.placeUnit(new HexCoord(3, 4), new Infantry(Side.ALLIES, 4));
        gameState.placeUnit(new HexCoord(9, 4), new Infantry(Side.AXIS, 4));

        // Bottom player (index 0)
        // These will be rendered in the BOTTOM medal circles (left side)
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS, 0), 0);

        // Top player (index 1)
        // These will be rendered in the TOP medal circles (right side)
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);
        gameState.addToMedalTable(new Infantry(Side.ALLIES, 0), 1);

        return gameState;
    }
}
