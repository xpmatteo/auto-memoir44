// ABOUTME: Unit domain model representing military units on the board
// ABOUTME: Tracks unit type, strength, and ownership (location managed by GameState)

import { Side } from "./Player";
import { HexCoord } from "../utils/hex";

export const UnitType = {
  INFANTRY: "infantry",
  ARMOR: "armor",
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

/**
 * Convert a hex coordinate to a string key for use in maps
 */
export function coordToKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

/**
 * Parse a coordinate key back to a HexCoord
 */
export function keyToCoord(key: string): HexCoord {
  const [q, r] = key.split(",").map(Number);
  return new HexCoord(q, r);
}

let nextUnitId = 1;

/**
 * Base class for all units
 */
export abstract class Unit {
  id: string;
  abstract readonly type: UnitType;
  strength: number; // Number of figures remaining
  side: Side;

  constructor(strength: number, owner: Side) {
    this.id = `unit-${nextUnitId++}`;
    this.strength = strength;
    this.side = owner;
  }
}

/**
 * Infantry unit type
 */
export class Infantry extends Unit {
  readonly type = UnitType.INFANTRY;
  static readonly defaultStrength = 4;

  constructor(owner: Side, strength?: number) {
    super(strength ?? Infantry.defaultStrength, owner);
  }
}
