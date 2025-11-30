// ABOUTME: Terrain rendering on canvas with terrain images
// ABOUTME: Handles loading terrain images and drawing them at hex coordinates

import type {Terrain} from "../../domain/terrain/Terrain.js";
import {GridConfig, HexCoord} from "../../utils/hex.js";
import {hexToPixel} from "../../utils/hex.js";
import type {GameState} from "../../domain/GameState.js";

const TERRAIN_IMAGE_CACHE = new Map<string, HTMLImageElement>();

/**
 * Load a terrain image and cache it
 */
export function loadTerrainImage(imagePath: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (TERRAIN_IMAGE_CACHE.has(imagePath)) {
        return Promise.resolve(TERRAIN_IMAGE_CACHE.get(imagePath)!);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            TERRAIN_IMAGE_CACHE.set(imagePath, img);
            resolve(img);
        };
        img.onerror = () => reject(new Error(`Failed to load terrain image: ${imagePath}`));
        img.src = "/" + imagePath; // Prepend slash for absolute path from public/
    });
}

/**
 * Draw a single terrain feature on the canvas at a specific hex location
 */
export async function drawTerrainAtHex(
    context: CanvasRenderingContext2D,
    terrain: Terrain,
    coord: HexCoord,
    grid: GridConfig
): Promise<void> {
    // Skip clearTerrain (has no image)
    if (!terrain.imagePath) {
        return;
    }

    const image = await loadTerrainImage(terrain.imagePath);

    // Convert hex coordinates to pixel coordinates (center of hex)
    const {x, y} = hexToPixel(coord, grid);

    // Calculate size to fit within hex boundaries
    // Terrain images should fill most of the hex but not overflow
    const aspectRatio = image.width / image.height;
    const maxSize = grid.hexRadius * 1.8; // Slightly larger than hex to ensure coverage
    const terrainWidth = maxSize;
    const terrainHeight = maxSize / aspectRatio;

    // Draw terrain image centered on hex
    context.drawImage(
        image,
        x - terrainWidth / 2,
        y - terrainHeight / 2,
        terrainWidth,
        terrainHeight
    );
}

/**
 * Draw all terrain on the canvas using gameState.forAllTerrain()
 */
export async function drawTerrain(
    context: CanvasRenderingContext2D,
    gameState: GameState,
    grid: GridConfig
): Promise<void> {
    // Collect all terrain to draw (excluding clearTerrain)
    const terrainToDraw: Array<{terrain: Terrain; coord: HexCoord}> = [];

    gameState.forAllTerrain((terrain: Terrain, hex: HexCoord) => {
        if (terrain.imagePath) {
            terrainToDraw.push({terrain, coord: hex});
        }
    });

    // Draw all terrain features
    for (const {terrain, coord} of terrainToDraw) {
        await drawTerrainAtHex(context, terrain, coord, grid);
    }
}
