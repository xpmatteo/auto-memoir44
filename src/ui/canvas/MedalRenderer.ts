// ABOUTME: Renders eliminated units as sprites in medal circle positions
// ABOUTME: Uses percentage-based positioning for medal circles with overflow support

import type {GameState} from "../../domain/GameState.js";
import type {Unit} from "../../domain/Unit.js";
import {getUnitImagePath, loadUnitImage} from "./UnitRenderer.js";

// Medal circle positions as percentages of canvas dimensions
// Top medals (for bottom player's eliminated units) - right side
const TOP_MEDALS_BASE_X_PERCENT = 0.540;
const TOP_MEDALS_BASE_Y_PERCENT = 0.031;
const TOP_MEDALS_SPACING_X_PERCENT = 0.075;
const TOP_MEDALS_SPACING_Y_PERCENT = 0.0;

// Bottom medals (for top player's eliminated units) - left side
const BOTTOM_MEDALS_BASE_X_PERCENT = 0.084;
const BOTTOM_MEDALS_BASE_Y_PERCENT = 0.948;
const BOTTOM_MEDALS_SPACING_X_PERCENT = TOP_MEDALS_SPACING_X_PERCENT;
const BOTTOM_MEDALS_SPACING_Y_PERCENT = TOP_MEDALS_SPACING_Y_PERCENT;

// Scale factor for unit sprites in medal circles
const MEDAL_SPRITE_SCALE = 1.8;

/**
 * Calculate pixel position for a medal at given index
 * Layout: Single row of 6 positions, continues for overflow
 *
 * [0] [1] [2] [3] [4] [5] [6] [7] ...
 */
function getMedalPosition(
    index: number,
    isTopMedals: boolean,
    canvasWidth: number,
    canvasHeight: number
): {x: number; y: number} {
    const row = Math.floor(index / 6);
    const col = index % 6;

    if (isTopMedals) {
        const x = canvasWidth * (TOP_MEDALS_BASE_X_PERCENT + col * TOP_MEDALS_SPACING_X_PERCENT);
        const y = canvasHeight * (TOP_MEDALS_BASE_Y_PERCENT + row * TOP_MEDALS_SPACING_Y_PERCENT);
        return {x, y};
    } else {
        const x = canvasWidth * (BOTTOM_MEDALS_BASE_X_PERCENT + col * BOTTOM_MEDALS_SPACING_X_PERCENT);
        const y = canvasHeight * (BOTTOM_MEDALS_BASE_Y_PERCENT + row * BOTTOM_MEDALS_SPACING_Y_PERCENT);
        return {x, y};
    }
}

/**
 * Draw a single eliminated unit sprite at a medal position
 */
async function drawMedalSprite(
    context: CanvasRenderingContext2D,
    unit: Unit,
    x: number,
    y: number
): Promise<void> {
    const imagePath = getUnitImagePath(unit);
    const image = await loadUnitImage(imagePath);

    // Calculate size with natural aspect ratio
    const aspectRatio = image.width / image.height;
    const maxWidth = 60 * MEDAL_SPRITE_SCALE; // Base size for medal sprites
    const spriteWidth = maxWidth;
    const spriteHeight = maxWidth / aspectRatio;

    // Draw sprite centered at position
    context.drawImage(
        image,
        x - spriteWidth / 2,
        y - spriteHeight / 2,
        spriteWidth,
        spriteHeight
    );
}

/**
 * Main rendering function for medal circles
 * Note: medalTables[0] = Top player's medals → render in BOTTOM circles
 *       medalTables[1] = Bottom player's medals → render in TOP circles
 */
export async function drawMedals(
    context: CanvasRenderingContext2D,
    gameState: GameState,
    canvasWidth: number,
    canvasHeight: number
): Promise<void> {
    // Render bottom player's medals (from top player's eliminations) in TOP circles
    const bottomPlayerMedals = gameState.getMedalTable(1);
    for (let i = 0; i < bottomPlayerMedals.length; i++) {
        const unit = bottomPlayerMedals[i];
        const {x, y} = getMedalPosition(i, true, canvasWidth, canvasHeight);
        await drawMedalSprite(context, unit, x, y);
    }

    // Render top player's medals (from bottom player's eliminations) in BOTTOM circles
    const topPlayerMedals = gameState.getMedalTable(0);
    for (let i = 0; i < topPlayerMedals.length; i++) {
        const unit = topPlayerMedals[i];
        const {x, y} = getMedalPosition(i, false, canvasWidth, canvasHeight);
        await drawMedalSprite(context, unit, x, y);
    }
}
