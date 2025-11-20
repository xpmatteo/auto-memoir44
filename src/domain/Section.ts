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
 * Board is 13 columns wide (q: 0-12).
 *
 * For BOTTOM player:
 * - Left: q = 0-3
 * - Center: q = 4-8
 * - Right: q = 9-12
 *
 * For TOP player (perspective flipped):
 * - Left: q = 9-12 (screen-right)
 * - Center: q = 4-8 (same)
 * - Right: q = 0-3 (screen-left)
 */
export function getSection(coord: HexCoord, playerPosition: Position): Section {
  const { q } = coord;

  if (playerPosition === Position.BOTTOM) {
    if (q >= 0 && q <= 3) return Section.LEFT;
    if (q >= 4 && q <= 8) return Section.CENTER;
    if (q >= 9 && q <= 12) return Section.RIGHT;
  } else {
    // TOP player - perspective is flipped
    if (q >= 0 && q <= 3) return Section.RIGHT;
    if (q >= 4 && q <= 8) return Section.CENTER;
    if (q >= 9 && q <= 12) return Section.LEFT;
  }

  throw new Error(`Invalid coordinate q=${q} for board (valid range: 0-12)`);
}
