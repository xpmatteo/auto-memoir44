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
 * Some hexes straddle section boundaries and belong to multiple sections:
 * - Left-Center boundary: 3,1 | 2,3 | 1,5 | 0,7
 * - Center-Right boundary: 8,1 | 7,3 | 6,5 | 5,7
 *
 * Sections shift horizontally based on row due to offset coordinate system.
 * The visual board has diagonal dividing lines between sections.
 *
 * For BOTTOM player, sections are based on visual left/center/right from bottom perspective.
 * For TOP player, sections are flipped (screen-left becomes RIGHT, screen-right becomes LEFT).
 */
export function isHexInSection(coord: HexCoord, section: Section, playerPosition: Position): boolean {
  const { q, r } = coord;

  // Calculate the left-center and center-right boundary columns for this row
  // These boundaries shift diagonally across the board
  const leftCenterBoundary = 3 - Math.floor(r / 2);
  const centerRightBoundary = 8 - Math.floor(r / 2);

  // Determine which section(s) this hex belongs to from BOTTOM player perspective
  let isLeft = false;
  let isCenter = false;
  let isRight = false;

  if (q < leftCenterBoundary) {
    isLeft = true;
  } else if (q === leftCenterBoundary) {
    // Boundary hex - belongs to both left and center
    isLeft = true;
    isCenter = true;
  } else if (q > leftCenterBoundary && q < centerRightBoundary) {
    isCenter = true;
  } else if (q === centerRightBoundary) {
    // Boundary hex - belongs to both center and right
    isCenter = true;
    isRight = true;
  } else {
    isRight = true;
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
