// ABOUTME: Unit rendering on canvas with sprite images
// ABOUTME: Handles loading unit images and drawing them at hex coordinates

import type { Unit } from "../../domain/Unit.js";
import type { GridConfig, HexCoord } from "../../utils/hex.js";
import { hexToPixel } from "../../utils/hex.js";
import { Side } from "../../domain/Player.js";

const UNIT_IMAGE_CACHE = new Map<string, HTMLImageElement>();

/**
 * Get the image path for a unit based on its type and owner
 */
function getUnitImagePath(unit: Unit): string {
  const prefix = unit.owner === Side.ALLIES ? "us" : "ger";
  const type = unit.type === "infantry" ? "inf" : "arm";
  return `/images/units/${prefix}_${type}.png`;
}

/**
 * Load a unit image and cache it
 */
function loadUnitImage(imagePath: string): Promise<HTMLImageElement> {
  // Return cached image if available
  if (UNIT_IMAGE_CACHE.has(imagePath)) {
    return Promise.resolve(UNIT_IMAGE_CACHE.get(imagePath)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      UNIT_IMAGE_CACHE.set(imagePath, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load unit image: ${imagePath}`));
    img.src = imagePath;
  });
}

/**
 * Draw a single unit on the canvas at its hex location
 */
export async function drawUnit(
  context: CanvasRenderingContext2D,
  unit: Unit,
  grid: GridConfig
): Promise<void> {
  const imagePath = getUnitImagePath(unit);
  const image = await loadUnitImage(imagePath);

  // Convert hex coordinates to pixel coordinates
  const { x, y } = hexToPixel(unit.location, grid);

  // Calculate size based on natural image proportions
  const aspectRatio = image.width / image.height;
  const maxWidth = grid.hexRadius * 1.4; // Scale to fit nicely in hex
  const unitWidth = maxWidth;
  const unitHeight = maxWidth / aspectRatio;

  // Draw unit image centered on hex with natural proportions
  context.drawImage(
    image,
    x - unitWidth / 2,
    y - unitHeight / 2,
    unitWidth,
    unitHeight
  );

  // Draw strength indicator (number of figures)
  drawStrengthIndicator(context, unit, x, y, grid);
}

/**
 * Draw strength indicator showing number of figures remaining
 */
function drawStrengthIndicator(
  context: CanvasRenderingContext2D,
  unit: Unit,
  x: number,
  y: number,
  grid: GridConfig
): void {
  const radius = grid.hexRadius * 0.2;
  const offsetY = grid.hexRadius * 0.6;

  // Draw circle background
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.beginPath();
  context.arc(x, y + offsetY, radius, 0, Math.PI * 2);
  context.fill();

  // Draw strength number
  context.fillStyle = "white";
  context.font = `bold ${radius * 1.5}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(unit.strength.toString(), x, y + offsetY);
}

/**
 * Draw all units on the canvas
 */
export async function drawUnits(
  context: CanvasRenderingContext2D,
  units: Unit[],
  grid: GridConfig
): Promise<void> {
  // Draw all units
  for (const unit of units) {
    await drawUnit(context, unit, grid);
  }
}
