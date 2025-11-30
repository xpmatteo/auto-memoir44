// ABOUTME: Unit domain model representing military units on the board
// ABOUTME: Tracks unit type, strength, and ownership (location managed by GameState)

import {Side} from "./Player";
import {HexCoord} from "../utils/hex";

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

/**
 * Mutable state for a unit, managed by GameState
 */
export class UnitState {
    strength: number;
    isOrdered: boolean;
    hasMoved: boolean;
    skipsBattle: boolean;
    battlesThisTurn: number;

    constructor(initialStrength: number) {
        this.strength = initialStrength;
        this.isOrdered = false;
        this.hasMoved = false;
        this.skipsBattle = false;
        this.battlesThisTurn = 0;
    }

    /**
     * Clear all turn-based state flags
     */
    clearTurnState(): void {
        this.isOrdered = false;
        this.hasMoved = false;
        this.skipsBattle = false;
        this.battlesThisTurn = 0;
    }

    /**
     * Create a deep clone of this UnitState
     */
    clone(): UnitState {
        const cloned = new UnitState(this.strength);
        cloned.isOrdered = this.isOrdered;
        cloned.hasMoved = this.hasMoved;
        cloned.skipsBattle = this.skipsBattle;
        cloned.battlesThisTurn = this.battlesThisTurn;
        return cloned;
    }
}

let nextUnitId = 1;

/**
 * Base class for all units (immutable properties only)
 * Mutable state is stored separately in UnitState within GameState
 */
export abstract class Unit {
    readonly id: string;
    abstract readonly type: UnitType;
    readonly initialStrength: number;
    readonly side: Side;

    protected constructor(strength: number, owner: Side) {
        this.id = `unit-${nextUnitId++}`;
        this.initialStrength = strength;
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

    toString(): string {
        return `Infantry`;
    }
}
