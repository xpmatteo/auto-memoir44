// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario, createStandardGameState} from "./Scenario";
import {CardLocation} from "../domain/cards/CommandCard";
import {SeededRNG} from "../adapters/RNG";

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    ".ar.T   ....    ....Tin ....    .....   W...    Tin.",
    "~~W...W   ....    ....    ....    .in.W   ....    ~~",
    ".... in ....    ....    ....    .....   ....    ....",
    "~~....    .in.    ....    ....    .in.    ....    ~~",
    "B...B   B...B   B...B   B...B   B...B   B...B   B...",
    "~~B...B   B...B   B...B   B...B   B...B   B...B   ~~",
    "B...B   B...B   B...B   B...B   B...B   B...B   B...",
    "~~s...sAR sIN.s   sAR.sIN s...s   sIN.sAR sIN.s   ~~",
    "SIN.S   S...S   SIN.SIN SIN.S   S...S   S...S   SIN.",
];

export class ST03Scenario implements Scenario {
    createGameState(rng: SeededRNG): GameState {
        const gameState = createStandardGameState(rng);

        gameState.drawCards(6, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        parseAndSetupUnits(gameState, unitSetup);
        gameState.finishSetup();
        return gameState;
    }
}

