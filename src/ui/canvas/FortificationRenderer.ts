// ABOUTME: Fortification rendering on canvas with fortification images
// ABOUTME: Handles loading fortification images and drawing them at hex coordinates

import type {Fortification} from "../../domain/fortifications/Fortification.js";
import {GridConfig, HexCoord} from "../../utils/hex.js";
import {hexToPixel} from "../../utils/hex.js";
import type {GameState} from "../../domain/GameState.js";

const FORTIFICATION_IMAGE_CACHE = new Map<string, HTMLImageElement>();

/**
 * Load a fortification image and cache it
 */
export function loadFortificationImage(imagePath: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (FORTIFICATION_IMAGE_CACHE.has(imagePath)) {
        return Promise.resolve(FORTIFICATION_IMAGE_CACHE.get(imagePath)!);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            FORTIFICATION_IMAGE_CACHE.set(imagePath, img);
            resolve(img);
        };
        img.onerror = () => reject(new Error(`Failed to load fortification image: ${imagePath}`));
        img.src = "/" + imagePath; // Prepend slash for absolute path from public/
    });
}

/**
 * Draw a single fortification feature on the canvas at a specific hex location
 */
export async function drawFortificationAtHex(
    context: CanvasRenderingContext2D,
    fortification: Fortification,
    coord: HexCoord,
    grid: GridConfig
): Promise<void> {
    const image = await loadFortificationImage(fortification.imagePath);

    // Convert hex coordinates to pixel coordinates (center of hex)
    const {x, y} = hexToPixel(coord, grid);

    // Calculate size to fit within hex boundaries
    // Fortification images should fill most of the hex but not overflow
    const aspectRatio = image.width / image.height;
    const maxSize = grid.hexRadius * 1.8; // Slightly larger than hex to ensure coverage
    const fortificationWidth = maxSize;
    const fortificationHeight = maxSize / aspectRatio;

    // Draw fortification image centered on hex
    context.drawImage(
        image,
        x - fortificationWidth / 2,
        y - fortificationHeight / 2,
        fortificationWidth,
        fortificationHeight
    );
}

/**
 * Draw all fortifications on the canvas using gameState.forAllFortifications()
 */
export async function drawFortifications(
    context: CanvasRenderingContext2D,
    gameState: GameState,
    grid: GridConfig
): Promise<void> {
    // Collect all fortifications to draw
    const fortificationsToDraw: Array<{fortification: Fortification; coord: HexCoord}> = [];

    gameState.forAllFortifications((fortification: Fortification, hex: HexCoord) => {
        fortificationsToDraw.push({fortification, coord: hex});
    });

    // Draw all fortification features
    for (const {fortification, coord} of fortificationsToDraw) {
        await drawFortificationAtHex(context, fortification, coord, grid);
    }
}
