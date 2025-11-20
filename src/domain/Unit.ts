// ABOUTME: Unit domain model representing military units on the board
// ABOUTME: Tracks unit type, strength, location, and ownership

import { Side } from "./Player";

export type UnitType = "infantry" | "armor";

export interface HexLocation {
  q: number;
  r: number;
}

export class Unit {
  id: string;
  type: UnitType;
  strength: number; // Number of figures remaining
  location: HexLocation;
  owner: Side;

  constructor(
    id: string,
    type: UnitType,
    strength: number,
    location: HexLocation,
    owner: Side
  ) {
    this.id = id;
    this.type = type;
    this.strength = strength;
    this.location = location;
    this.owner = owner;
  }
}

export function createUnit(
  id: string,
  type: UnitType,
  strength: number,
  q: number,
  r: number,
  owner: Side
): Unit {
  return new Unit(id, type, strength, { q, r }, owner);
}
