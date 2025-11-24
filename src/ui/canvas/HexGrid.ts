// ABOUTME: Hex grid overlay rendering with coordinates
// ABOUTME: Draws pointy-top hexagon grid on canvas with optional coordinate labels

import { GridConfig, HexCoord } from "../../utils/hex.js";
import { hexToPixel } from "../../utils/hex.js";
import { isHexInSection, Section } from "../../domain/Section.js";
import { Position } from "../../domain/Player.js";
import { BattleTarget } from "../UIState.js";
import {
  ORDERED_UNIT_OUTLINE_COLOR,
  ORDERED_UNIT_SHADOW_COLOR,
  ORDERED_UNIT_OUTLINE_WIDTH,
  ORDERED_UNIT_SHADOW_BLUR,
  SELECTED_UNIT_OUTLINE_COLOR,
  SELECTED_UNIT_SHADOW_COLOR,
  SELECTED_UNIT_OUTLINE_WIDTH,
  SELECTED_UNIT_SHADOW_BLUR,
  VALID_DESTINATION_FILL_COLOR,
  VALID_DESTINATION_OUTLINE_COLOR,
  VALID_DESTINATION_OUTLINE_WIDTH,
  BATTLE_UNIT_OUTLINE_COLOR,
  BATTLE_UNIT_SHADOW_COLOR,
  BATTLE_UNIT_OUTLINE_WIDTH,
  BATTLE_UNIT_SHADOW_BLUR,
  BATTLE_TARGET_OUTLINE_COLOR,
  BATTLE_TARGET_SHADOW_COLOR,
  BATTLE_TARGET_OUTLINE_WIDTH,
  BATTLE_TARGET_SHADOW_BLUR,
  DICE_INDICATOR_CIRCLE_COLOR,
  DICE_INDICATOR_TEXT_COLOR,
  DICE_INDICATOR_RADIUS,
  DICE_INDICATOR_FONT_SIZE
} from "../../utils/constants.js";

const SQRT3 = Math.sqrt(3);

/**
 * Draw a hex grid overlay on the canvas with optional coordinate labels.
 */
export function drawGrid(context: CanvasRenderingContext2D, grid: GridConfig) {
  const { cols, rows, hexRadius, originX, originY, lineWidth, strokeStyle, showCoords } = grid;
  const horizStep = SQRT3 * hexRadius; // width of a column offset
  const vertStep = hexRadius * 1.5; // vertical spacing for pointy-top

  context.save();
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.shadowColor = "rgba(0, 0, 0, 0.35)";
  context.shadowBlur = 1.5;
  context.font = `${Math.floor(hexRadius * 0.36)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let q = 0; q < cols; q += 1) {
    for (let r = 0; r < rows; r += 1) {
      const centerX = originX + horizStep * (q + r / 2);
      const centerY = originY + vertStep * r;
      //drawHex(context, centerX, centerY, hexRadius);
      if (showCoords) {
        // Get section(s) for this hex from bottom player's perspective
        const sections = [];
        const coord = new HexCoord(q, r);
        if (isHexInSection(coord, Section.LEFT, Position.BOTTOM)) sections.push("L");
        if (isHexInSection(coord, Section.CENTER, Position.BOTTOM)) sections.push("C");
        if (isHexInSection(coord, Section.RIGHT, Position.BOTTOM)) sections.push("R");
        const sectionLabel = sections.join("/");
        const label = `${q},${r} ${sectionLabel}`;
        context.fillStyle = "black";
        context.fillText(label, centerX, centerY);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
      }
    }
  }

  context.restore();
}

/**
 * Draw a single hexagon at the specified center point.
 * Uses pointy-top orientation (vertex at top).
 */
export function drawHex(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const corners = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top orientation
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  context.beginPath();
  context.moveTo(corners[0].x, corners[0].y);
  corners.slice(1).forEach((corner) => context.lineTo(corner.x, corner.y));
  context.closePath();
  context.stroke();
}

/**
 * Draw outlines around ordered units to highlight them.
 * Uses a thicker, more visible stroke to indicate ordered status.
 */
export function drawOrderedUnitOutlines(
  context: CanvasRenderingContext2D,
  orderedCoords: HexCoord[],
  grid: GridConfig
) {
  context.save();
  context.lineWidth = ORDERED_UNIT_OUTLINE_WIDTH;
  context.strokeStyle = ORDERED_UNIT_OUTLINE_COLOR;
  context.shadowColor = ORDERED_UNIT_SHADOW_COLOR;
  context.shadowBlur = ORDERED_UNIT_SHADOW_BLUR;

  for (const coord of orderedCoords) {
    const { x, y } = hexToPixel(coord, grid);
    drawHex(context, x, y, grid.hexRadius);
  }

  context.restore();
}

/**
 * Draw outline around the selected unit to highlight it.
 * Uses bright yellow with a thicker outline than ordered units.
 */
export function drawSelectedUnit(
  context: CanvasRenderingContext2D,
  selectedCoord: HexCoord,
  grid: GridConfig
) {
  context.save();
  context.lineWidth = SELECTED_UNIT_OUTLINE_WIDTH;
  context.strokeStyle = SELECTED_UNIT_OUTLINE_COLOR;
  context.shadowColor = SELECTED_UNIT_SHADOW_COLOR;
  context.shadowBlur = SELECTED_UNIT_SHADOW_BLUR;

  const { x, y } = hexToPixel(selectedCoord, grid);
  drawHex(context, x, y, grid.hexRadius);

  context.restore();
}

/**
 * Draw highlighting on valid destination hexes.
 * Uses semi-transparent green fill with green outline.
 */
export function drawValidDestinations(
  context: CanvasRenderingContext2D,
  destinations: HexCoord[],
  grid: GridConfig
) {
  context.save();
  context.lineWidth = VALID_DESTINATION_OUTLINE_WIDTH;
  context.strokeStyle = VALID_DESTINATION_OUTLINE_COLOR;
  context.fillStyle = VALID_DESTINATION_FILL_COLOR;

  for (const coord of destinations) {
    const { x, y } = hexToPixel(coord, grid);
    const corners = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top orientation
      return {
        x: x + grid.hexRadius * Math.cos(angle),
        y: y + grid.hexRadius * Math.sin(angle)
      };
    });

    context.beginPath();
    context.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((corner) => context.lineTo(corner.x, corner.y));
    context.closePath();
    context.fill();
    context.stroke();
  }

  context.restore();
}

/**
 * Draw outlines around battle-ready units to highlight them.
 * Uses red stroke to indicate units that can attack during BattlePhase.
 */
export function drawBattleUnitOutlines(
  context: CanvasRenderingContext2D,
  battleCoords: HexCoord[],
  grid: GridConfig
) {
  context.save();
  context.lineWidth = BATTLE_UNIT_OUTLINE_WIDTH;
  context.strokeStyle = BATTLE_UNIT_OUTLINE_COLOR;
  context.shadowColor = BATTLE_UNIT_SHADOW_COLOR;
  context.shadowBlur = BATTLE_UNIT_SHADOW_BLUR;

  for (const coord of battleCoords) {
    const { x, y } = hexToPixel(coord, grid);
    drawHex(context, x, y, grid.hexRadius);
  }

  context.restore();
}

/**
 * Draw outlines and dice indicators on battle target units.
 * Uses bright red outline with a circle showing the number of dice that will be rolled.
 */
export function drawBattleTargets(
  context: CanvasRenderingContext2D,
  targets: BattleTarget[],
  grid: GridConfig
) {
  context.save();

  // Draw outlines around target hexes
  context.lineWidth = BATTLE_TARGET_OUTLINE_WIDTH;
  context.strokeStyle = BATTLE_TARGET_OUTLINE_COLOR;
  context.shadowColor = BATTLE_TARGET_SHADOW_COLOR;
  context.shadowBlur = BATTLE_TARGET_SHADOW_BLUR;

  for (const target of targets) {
    const { x, y } = hexToPixel(target.coord, grid);
    drawHex(context, x, y, grid.hexRadius);
  }

  // Draw dice count indicators
  context.shadowBlur = 0; // Disable shadow for crisp text
  for (const target of targets) {
    const { x, y } = hexToPixel(target.coord, grid);

    // Position dice indicator towards southeast edge of hex
    // For pointy-top hex, southeast is at angle 30 degrees (π/6 radians)
    const angle = Math.PI / 6;
    const offsetDistance = grid.hexRadius * 0.6; // 60% towards the edge
    const diceX = x + offsetDistance * Math.cos(angle);
    const diceY = y + offsetDistance * Math.sin(angle);

    // Draw circle background
    context.beginPath();
    context.arc(diceX, diceY, DICE_INDICATOR_RADIUS, 0, 2 * Math.PI);
    context.fillStyle = DICE_INDICATOR_CIRCLE_COLOR;
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.8)"; // White outline for circle
    context.lineWidth = 2;
    context.stroke();

    // Draw dice count text
    context.fillStyle = DICE_INDICATOR_TEXT_COLOR;
    context.font = `bold ${DICE_INDICATOR_FONT_SIZE}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(target.dice.toString(), diceX, diceY);
  }

  context.restore();
}
