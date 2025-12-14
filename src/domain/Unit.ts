// ABOUTME: Unit domain model representing military units on the board
// ABOUTME: Tracks unit type, strength, and ownership (location managed by GameState)

import {Side} from "./Player";

export const UnitType = {
    INFANTRY: "infantry",
    ARMOR: "armor",
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

/**
 * Mutable state for a unit, managed by GameState
 */
export class UnitState {
    strength: number;
    isOrdered: boolean;
    hasMoved: boolean;
    skipsBattle: boolean;
    battlesThisTurn: number;
    isTargeted: boolean;

    constructor(initialStrength: number) {
        this.strength = initialStrength;
        this.isOrdered = false;
        this.hasMoved = false;
        this.skipsBattle = false;
        this.battlesThisTurn = 0;
        this.isTargeted = false;
    }

    /**
     * Clear all turn-based state flags
     */
    clearTurnState(): void {
        this.isOrdered = false;
        this.hasMoved = false;
        this.skipsBattle = false;
        this.battlesThisTurn = 0;
        this.isTargeted = false;
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
        cloned.isTargeted = this.isTargeted;
        return cloned;
    }
}

let nextUnitId = 1;

export function resetUnitIdCounter(): void {
    nextUnitId = 1;
}

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

    toString(): string {
        return `${this.constructor.name}/${this.side}`;
    }

    abstract baseBattleDice(distance: number): number;

    abstract maxMovementDistance(): number;

    abstract movementSkipsBattle(distance: number): boolean;
}

export class Infantry extends Unit {
    readonly type = UnitType.INFANTRY;
    static readonly defaultStrength = 4;
    constructor(owner: Side, strength?: number) {
        super(strength ?? Infantry.defaultStrength, owner);
    }

    baseBattleDice(distance: number): number {
        return 4 - distance;
    }

    maxMovementDistance(): number {
        return 2;
    }

    movementSkipsBattle(distance: number): boolean {
        return distance === 2;
    }
}

export class Armor extends Unit {
    readonly type = UnitType.ARMOR;
    static readonly defaultStrength = 3;

    constructor(owner: Side, strength?: number) {
        super(strength ?? Armor.defaultStrength, owner);
    }

    baseBattleDice(distance: number): number {
        return (distance <= 3) ? 3 : 0;
    }

    maxMovementDistance(): number {
        return 3;
    }

    movementSkipsBattle(_distance: number): boolean {
        return false; // armor never skips battle based on movement distance
    }
}
