// ABOUTME: Board section logic for command card area restrictions
// ABOUTME: Handles left/center/right section determination based on player perspective

import { HexCoord } from "../utils/hex";
import { Position } from "./Player";
import { BOARD_GEOMETRY } from "./BoardGeometry";

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
 * For BOTTOM player, sections are based on visual left/center/right from bottom perspective.
 * For TOP player, sections are flipped (screen-left becomes RIGHT, screen-right becomes LEFT).
 */
export function isHexInSection(coord: HexCoord, section: Section, playerPosition: Position): boolean {
  return BOARD_GEOMETRY.isHexInSection(coord, section, playerPosition);
}
