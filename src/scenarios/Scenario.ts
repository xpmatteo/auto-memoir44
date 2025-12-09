// ABOUTME: Scenario interface definition
// ABOUTME: Scenarios implement createGameState() to create fully initialized game state

import {GameState} from "../domain/GameState";
import {HexCoord} from "../utils/hex";
import {Armor, Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";
import {hillTerrain, woodsTerrain, town1Terrain, Terrain, hedgerowsTerrain} from "../domain/terrain/Terrain";
import {Fortification, sandbagAllies, sandbagAxis} from "../domain/fortifications/Fortification";
import {SeededRNG} from "../adapters/RNG";
import {Dice} from "../domain/Dice";
import {Deck} from "../domain/Deck";

export interface Scenario {
    /**
     * Create and return a fully initialized GameState
     * @param rng Random number generator for reproducible game setup
     * @returns Fully configured GameState ready to play
     */
    createGameState(rng: SeededRNG): GameState;
}

/**
 * Helper function to create a standard GameState with consistent RNG
 * Scenarios can use this as a base and customize as needed
 */
export function createStandardGameState(rng: SeededRNG): GameState {
    const dice = new Dice(() => rng.random());
    const deck = Deck.createStandardDeck(() => rng.random());
    deck.shuffle();
    return new GameState(deck, dice);
}

const terrainCodes = new Map(Object.entries({
    "H": hillTerrain,
    "R": hedgerowsTerrain,
    "T": town1Terrain,
    "W": woodsTerrain,
})) as Map<string, Terrain>;

const fortificationCodes = new Map(Object.entries({
    "S": sandbagAllies,
    "s": sandbagAxis,
})) as Map<string, Fortification>;

/*
Sample:

const unitSetup = [
    "   0   1   2   3   4   5   6   7   8   9  10  11  12",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
    "~~....    ....    ....    ....    ....    ....    ~~",
    "....    ....    ....    ....    ....    ....    ....",
];


 */

export function parseAndSetupUnits(gameState: GameState, unitSetup: string[]): void {
    // Skip line 0 (column header)
    for (let lineIndex = 1; lineIndex < unitSetup.length; lineIndex++) {
        const r = lineIndex - 1; // Map line index to board row
        let line = unitSetup[lineIndex];

        // Calculate expected column parameters based on board geometry
        const colStart = -Math.trunc(r / 2);
        const numCols = r % 2 === 0 ? 13 : 12;

        // Strip leading ~~ for odd rows
        if (r % 2 === 1) {
            if (!line.startsWith("~~")) {
                throw new Error(`Line ${lineIndex} (r=${r}) is odd row but doesn't start with ~~`);
            }
            line = line.substring(2);
        }

        // Strip trailing ~~ for odd rows
        if (r % 2 === 1) {
            if (!line.endsWith("~~")) {
                throw new Error(`Line ${lineIndex} (r=${r}) is odd row but doesn't end with ~~`);
            }
            line = line.substring(0, line.length - 2);
        }

        // Parse 4-character chunks (including spaces)
        const chunks: string[] = [];
        for (let i = 0; i < line.length; i += 4) {
            chunks.push(line.substring(i, i + 4));
        }

        // Validate column count
        if (chunks.length !== numCols) {
            throw new Error(
                `Line ${lineIndex} (r=${r}): expected ${numCols} columns but got ${chunks.length}`
            );
        }

        // Place terrain and units
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const q = colStart + chunkIndex;
            const coord = new HexCoord(q, r);

            // Check for terrain markers (first character)
            const firstChar = chunk.charAt(0);
            if (firstChar != " " && firstChar != ".") {
                if (terrainCodes.has(firstChar)) {
                    gameState.setTerrain(coord, terrainCodes.get(firstChar)!);
                } else {
                    throw new Error(`Unknown terrain code: "${firstChar}"`)
                }
            }

            // Check for units (second and third characters)
            const unit = chunk.substring(1, 3)
            if (unit === "  " || unit === "..") {
                // No unit
            } else if (unit === "IN") {
                gameState.placeUnit(coord, new Infantry(Side.ALLIES));
            } else if (unit === "in") {
                gameState.placeUnit(coord, new Infantry(Side.AXIS));
            } else if (unit === "AR") {
                gameState.placeUnit(coord, new Armor(Side.ALLIES));
            } else if (unit === "ar") {
                gameState.placeUnit(coord, new Armor(Side.AXIS));
            } else {
                throw new Error(
                    `Unknown hex specification pattern "${chunk}" at line ${lineIndex}, column ${chunkIndex} (${coord.q},${coord.r})`
                );
            }

            // Check for fortification markers (fourth character)
            const fourthChar = chunk.charAt(3);
            if (fourthChar !== " " && fourthChar !== ".") {
                if (fortificationCodes.has(fourthChar)) {
                    gameState.setFortification(coord, fortificationCodes.get(fourthChar)!);
                } else {
                    throw new Error(`Unknown fortification code: "${fourthChar}"`);
                }
            }
        }
    }
}
