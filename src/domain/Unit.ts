// ABOUTME: Unit domain model representing military units on the board
// ABOUTME: Tracks unit type, strength, and ownership (location managed by GameState)

import { Side } from "./Player";
import type { HexCoord } from "../utils/hex";

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
  return { q, r };
}

export class Unit {
  id: string;
  type: UnitType;
  strength: number; // Number of figures remaining
  owner: Side;

  constructor(id: string, type: UnitType, strength: number, owner: Side) {
    this.id = id;
    this.type = type;
    this.strength = strength;
    this.owner = owner;
  }
}

/**
 * Base class for unit types
 * Each unit type defines its type identifier and default strength
 */
export abstract class UnitClass {
  abstract readonly type: UnitType;
  abstract readonly defaultStrength: number;

  /**
   * Create a unit instance of this type
   */
  createUnit(id: string, owner: Side, strength?: number): Unit {
    return new Unit(id, this.type, strength ?? this.defaultStrength, owner);
  }
}

/**
 * Infantry unit type
 */
export class Infantry extends UnitClass {
  readonly type = UnitType.INFANTRY;
  readonly defaultStrength = 4;
}
