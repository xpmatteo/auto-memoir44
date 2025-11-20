// ABOUTME: Hex grid overlay rendering with coordinates
// ABOUTME: Draws pointy-top hexagon grid on canvas with optional coordinate labels

import type { GridConfig } from "../../utils/hex.js";
import { getSection, Section } from "../../domain/Section.js";
import { Position } from "../../domain/Player.js";

const SQRT3 = Math.sqrt(3);

/**
 * Draw a hex grid overlay on the canvas with optional coordinate labels.
 */
export function drawGrid(context: CanvasRenderingContext2D, grid: GridConfig) {
  const { cols, rows, hexRadius, originX, originY, lineWidth, strokeStyle, showCoords, coordColor } = grid;
  const hexHeight = SQRT3 * hexRadius; // pointy-top height
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
      drawHex(context, centerX, centerY, hexRadius);
      if (showCoords) {
        // Get section for this hex from bottom player's perspective
        const section = getSection({ q, r }, Position.BOTTOM);
        const sectionLabel = section === Section.LEFT ? "L" : section === Section.CENTER ? "C" : "R";
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
