// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import {parseAndSetupUnits, Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {HexCoord} from "../utils/hex";
import {Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";
import {SeededRNG} from "../adapters/RNG";

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    ".in. in W...W   W...    ....    W...W   .... in .ar.",
    "~~.in.    W...W   ....    ....W   W...    .in. in ~~",
    ".in.    ....T   W...    ....    ....W   .in.W   T...",
    "~~....    T...    ....    T...    ....    ....    ~~",
    "....    ....    R...    Tin.T   ....    ....W   ....",
    "~~....HINS....    ....    ....    ....R   ....    ~~",
    "....    ....    ....    .IN.    ....    ....    ....",
    "~~....    ....W   ....    W... INSR...    .IN.    ~~",
    "....    ....    .INS    .... IN ....    ....    ....",
];

export class ST02Scenario implements Scenario {
    private rng: SeededRNG;
    constructor(rng: SeededRNG = new SeededRNG()) {
        this.rng = rng;
    }

    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);

        // Add 4 parachute units to random locations from 3rd row downwards (r >= 2)
        this.placeParachuteUnits(gameState);

        // Set the prerequisite number of medals
        gameState.setPrerequisiteNumberOfMedals(4);

        // Finalize setup - terrain is now immutable
        gameState.finishSetup();
    }

    private placeParachuteUnits(gameState: GameState): void {
        // Get all valid hexes from rows 2-8 (3rd row downwards)
        const candidateHexes = this.getCandidateHexesForParachute();

        // Try to place 4 parachute units
        for (let i = 0; i < 4; i++) {
            if (candidateHexes.length === 0) {
                // No more hexes available
                break;
            }

            // Pick a random hex
            const randomIndex = this.getRandomInt(0, candidateHexes.length - 1);
            const selectedHex = candidateHexes[randomIndex];

            // Remove from candidates so we don't pick it again
            candidateHexes.splice(randomIndex, 1);

            // Try to place the unit (will be skipped if hex is occupied)
            try {
                gameState.placeUnit(selectedHex, new Infantry(Side.ALLIES));
            } catch (error) {
                // Hex is occupied - skip this unit (no deployment)
            }
        }
    }

    private getRandomInt(min: number, max: number): number {
        return Math.floor(this.rng.random() * (max - min + 1)) + min;
    }

    private getCandidateHexesForParachute(): HexCoord[] {
        const candidates: HexCoord[] = [];

        // Iterate through rows 2-8
        for (let r = 2; r <= 8; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;

            for (let q = colStart; q < colStart + numCols; q++) {
                const hex = new HexCoord(q, r);
                candidates.push(hex);
            }
        }

        return candidates;
    }
}
