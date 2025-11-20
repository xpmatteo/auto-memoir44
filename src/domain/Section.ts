// ABOUTME: Board section logic for command card area restrictions
// ABOUTME: Handles left/center/right section determination based on player perspective

import type { HexCoord } from "../utils/hex";
import { Position } from "./Player";

export const Section = {
  LEFT: "Left",
  CENTER: "Center",
  RIGHT: "Right",
} as const;

export type Section = typeof Section[keyof typeof Section];

/**
 * Determine which section a hex coordinate belongs to for a given player position.
 * Sections shift horizontally based on row due to offset coordinate system.
 *
 * The visual board has dividing lines that shift with each pair of rows:
 * - Rows 0-1: Left = 0-3,   Center = 4-8,   Right = 9-12
 * - Rows 2-3: Left = -1-2,  Center = 3-7,   Right = 8-11
 * - Rows 4-5: Left = -2-1,  Center = 2-6,   Right = 7-10
 * - Rows 6-8: Left = -3-0,  Center = 1-5,   Right = 6-9
 *
 * Pattern: offset = -Math.floor(r / 2)
 *
 * For BOTTOM player, sections are based on visual left/center/right from bottom perspective.
 * For TOP player, sections are flipped (screen-left becomes RIGHT, screen-right becomes LEFT).
 */
export function getSection(coord: HexCoord, playerPosition: Position): Section {
  const { q, r } = coord;
  //
  // const boundaries = {
  //   0: [[0, 4], [4, 9], [9, 13]],
  //   1: [[0, 4], [3, 9], [9, 12]],
  //   2: [[-1, 3], [3, 8], [8, 11]],
  //   3: [[-1, 3], [3, 8], [8, 11]],
  //   4: [[-1, 3], [3, 8], [8, 11]],
  //   5: [[-1, 3], [3, 8], [8, 11]],
  //   6: [[-1, 3], [3, 8], [8, 11]],
  //   7: [[-1, 3], [3, 8], [8, 11]],
  //   8: [[-1, 3], [3, 8], [8, 11]],
  // }

  // Calculate row-based offset (shifts left as row increases)
  const offset = -Math.floor(r / 2);

  // Define section boundaries with offset applied
  const leftMin = 0 + offset;
  const leftMax = 3 + offset;
  const centerMin = 4 + offset;
  const centerMax = 8 + offset;
  const rightMin = 9 + offset;
  const rightMax = 12 + offset;

  if (playerPosition === Position.BOTTOM) {
    if (q >= leftMin && q <= leftMax) return Section.LEFT;
    if (q >= centerMin && q <= centerMax) return Section.CENTER;
    if (q >= rightMin && q <= rightMax) return Section.RIGHT;
  } else {
    // TOP player - perspective is flipped
    if (q >= leftMin && q <= leftMax) return Section.RIGHT;
    if (q >= centerMin && q <= centerMax) return Section.CENTER;
    if (q >= rightMin && q <= rightMax) return Section.LEFT;
  }

  throw new Error(`Invalid coordinate q=${q}, r=${r} does not fall into any section`);
}
