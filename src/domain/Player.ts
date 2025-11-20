// ABOUTME: Player model representing a game participant
// ABOUTME: Tracks side (Allies/Axis) and position (Bottom/Top) but not cards directly

export type Side = "Allies" | "Axis";
export type Position = "Bottom" | "Top";

export interface Player {
  side: Side;
  position: Position;
}

export function createPlayer(side: Side, position: Position): Player {
  return { side, position };
}
