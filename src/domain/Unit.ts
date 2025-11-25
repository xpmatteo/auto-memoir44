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

let nextUnitId = 1;

/**
 * Base class for all units
 */
export abstract class Unit {
    readonly id: string;
    abstract readonly type: UnitType;
    readonly initialStrength: number;
    readonly side: Side;

    strength: number;
    private _isOrdered: boolean;
    private _hasMoved: boolean;
    private _skipsBattle: boolean;

    protected constructor(strength: number, owner: Side) {
        this.id = `unit-${nextUnitId++}`;
        this.initialStrength = strength;
        this.side = owner;
        this.strength = strength;
        this._isOrdered = false;
        this._hasMoved = false;
        this._skipsBattle = false;
    }

    // Turn state management
    get isOrdered(): boolean {
        return this._isOrdered;
    }

    setOrdered(ordered: boolean): void {
        this._isOrdered = ordered;
    }

    get hasMoved(): boolean {
        return this._hasMoved;
    }

    setMoved(moved: boolean): void {
        this._hasMoved = moved;
    }

    get skipsBattle(): boolean {
        return this._skipsBattle;
    }

    setSkipsBattle(skips: boolean): void {
        this._skipsBattle = skips;
    }

    /**
     * Clear all turn-based state flags
     */
    clearTurnState(): void {
        this._isOrdered = false;
        this._hasMoved = false;
        this._skipsBattle = false;
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
