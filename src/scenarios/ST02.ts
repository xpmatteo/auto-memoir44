// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type {GameState} from "../domain/GameState";
import type {Scenario} from "./Scenario";
import {CardLocation} from "../domain/CommandCard";
import {Infantry} from "../domain/Unit";
import {Side} from "../domain/Player";
import {HexCoord} from "../utils/hex";

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

function parseAndSetupUnits(gameState: GameState, unitSetup: string[]): void {
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

        // Place units based on patterns
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const q = colStart + chunkIndex;
            const coord = new HexCoord(q, r);

            // Normalize patterns by trimming and checking for dots
            const trimmed = chunk.trim();
            const pattern = trimmed.replace(/\./g, ""); // Remove dots

            if (pattern === "" || trimmed === "....") {
                // Empty hex
                continue;
            } else if (pattern.toLowerCase() === "in") {
                // Check if uppercase (Allies) or lowercase (Axis)
                if (pattern === "IN") {
                    // Allies infantry (uppercase IN)
                    gameState.placeUnit(coord, new Infantry(Side.ALLIES));
                } else {
                    // Axis infantry (lowercase in)
                    gameState.placeUnit(coord, new Infantry(Side.AXIS));
                }
            } else {
                throw new Error(
                    `Unknown unit pattern "${chunk}" at line ${lineIndex}, column ${chunkIndex} (${coord.q},${coord.r})`
                );
            }
        }
    }
}

export class ST02Scenario implements Scenario {
    setup(gameState: GameState): void {
        // Draw 5 cards for bottom player, 4 cards for top player
        gameState.drawCards(5, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(4, CardLocation.TOP_PLAYER_HAND);

        // Parse and place units from the unitSetup constant
        parseAndSetupUnits(gameState, unitSetup);
    }
}
