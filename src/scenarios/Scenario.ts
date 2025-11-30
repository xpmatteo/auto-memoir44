// ABOUTME: Scenario interface definition
// ABOUTME: Scenarios implement setup() to initialize game state

import type {GameState} from "../domain/GameState";
import {HexCoord} from "../utils/hex";
import {Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";
import {hillTerrain, woodsTerrain, town1Terrain} from "../domain/terrain/Terrain";

export interface Scenario {
    /**
     * Initialize the game state with units, cards, and initial configuration
     */
    setup(gameState: GameState): void;
}

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
            if (firstChar === 'W') {
                gameState.setTerrain(coord, woodsTerrain);
            } else if (firstChar === 'H') {
                gameState.setTerrain(coord, hillTerrain);
            } else if (firstChar === 'T') {
                gameState.setTerrain(coord, town1Terrain);
            }

            // Check for units (second and third characters)
            const unit = chunk.substring(1, 3)
            if (unit === "  " || unit === "..") {
                // No unit
            } else if (unit === "IN") {
                gameState.placeUnit(coord, new Infantry(Side.ALLIES));
            } else if (unit === "in") {
                gameState.placeUnit(coord, new Infantry(Side.AXIS));
            } else {
                throw new Error(
                    `Unknown hex specification pattern "${chunk}" at line ${lineIndex}, column ${chunkIndex} (${coord.q},${coord.r})`
                );
            }
        }
    }
}
