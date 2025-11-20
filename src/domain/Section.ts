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
 * Check if a hex coordinate belongs to a specific section for a given player position.
 *
 * Some hexes straddle section boundaries and belong to multiple sections.
 * These boundary hexes only occur on odd rows (1, 3, 5, 7):
 * - Left-Center boundary: 3,1 | 2,3 | 1,5 | 0,7
 * - Center-Right boundary: 8,1 | 7,3 | 6,5 | 5,7
 *
 * Pattern: On odd rows, boundary column = baseColumn - floor(r/2)
 * - Left-Center: q = 3 - floor(r/2) on odd rows
 * - Center-Right: q = 8 - floor(r/2) on odd rows
 *
 * For BOTTOM player, sections are based on visual left/center/right from bottom perspective.
 * For TOP player, sections are flipped (screen-left becomes RIGHT, screen-right becomes LEFT).
 */
export function isHexInSection(coord: HexCoord, section: Section, playerPosition: Position): boolean {
  const { q, r } = coord;

  // Determine which section(s) this hex belongs to from BOTTOM player perspective
  let isLeft = false;
  let isCenter = false;
  let isRight = false;

  // Check if this is a boundary hex (only on odd rows)
  const isOddRow = r % 2 === 1;
  const leftCenterBoundaryCol = 3 - Math.floor(r / 2);
  const centerRightBoundaryCol = 8 - Math.floor(r / 2);

  if (isOddRow && q === leftCenterBoundaryCol) {
    // Left-Center boundary hex
    isLeft = true;
    isCenter = true;
  } else if (isOddRow && q === centerRightBoundaryCol) {
    // Center-Right boundary hex
    isCenter = true;
    isRight = true;
  } else {
    // Regular hex - determine section based on column ranges
    // Ranges shift every 2 rows
    const offset = -Math.floor(r / 2);
    const leftMax = 3 + offset;
    const centerMax = 8 + offset;

    if (q <= leftMax) {
      isLeft = true;
    } else if (q <= centerMax) {
      isCenter = true;
    } else {
      isRight = true;
    }
  }

  // Apply player perspective
  if (playerPosition === Position.BOTTOM) {
    if (section === Section.LEFT) return isLeft;
    if (section === Section.CENTER) return isCenter;
    if (section === Section.RIGHT) return isRight;
  } else {
    // TOP player - perspective is flipped
    if (section === Section.LEFT) return isRight;
    if (section === Section.CENTER) return isCenter;
    if (section === Section.RIGHT) return isLeft;
  }

  return false;
}
