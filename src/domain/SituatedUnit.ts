// ABOUTME: Represents a unit with its full game context
// ABOUTME: Combines unit data, position, terrain, and mutable state

import {Armor, Infantry, Unit, UnitState} from "./Unit";
import {HexCoord} from "../utils/hex";
import {clearTerrain, Terrain} from "./terrain/Terrain";
import {Side} from "./Player";

/**
 * A unit with its complete game context: position, terrain, and mutable state.
 * This is a value object that aggregates all the information about a unit
 * that's needed for game logic calculations.
 */
export class SituatedUnit {
    readonly unit: Unit;
    readonly coord: HexCoord;
    terrain: Terrain;
    readonly unitState: UnitState;

    constructor(unit: Unit, coord: HexCoord, terrain: Terrain, unitState: UnitState) {
        this.unit = unit;
        this.coord = coord;
        this.terrain = terrain;
        this.unitState = unitState;
    }
}


export class SituatedUnitBuilder {
    private unit: Unit = new Infantry(Side.ALLIES);
    private coord: HexCoord = new HexCoord(0, 0);
    private terrain: Terrain = clearTerrain;
    private unitState: UnitState = new UnitState(Infantry.defaultStrength);

    withUnit(unit: Unit): this {
        this.unit = unit;
        this.unitState = new UnitState(unit.initialStrength);
        return this;
    }

    withInfantry(side: Side = Side.ALLIES, strength?: number): this {
        const infantry = new Infantry(side, strength);
        return this.withUnit(infantry);
    }

    withArmor(side: Side = Side.ALLIES, strength?: number): this {
        const armor = new Armor(side, strength);
        return this.withUnit(armor);
    }

    at(q: number, r: number): this {
        this.coord = new HexCoord(q, r);
        return this;
    }

    atCoord(coord: HexCoord): this {
        this.coord = coord;
        return this;
    }

    onTerrain(terrain: Terrain): this {
        this.terrain = terrain;
        return this;
    }

    withState(unitState: UnitState): this {
        this.unitState = unitState;
        return this;
    }

    withStrength(strength: number): this {
        this.unitState.strength = strength;
        return this;
    }

    ordered(): this {
        this.unitState.isOrdered = true;
        return this;
    }

    moved(): this {
        this.unitState.hasMoved = true;
        return this;
    }

    skipsBattle(): this {
        this.unitState.skipsBattle = true;
        return this;
    }

    withBattles(count: number): this {
        this.unitState.battlesThisTurn = count;
        return this;
    }

    build(): SituatedUnit {
        return new SituatedUnit(this.unit, this.coord, this.terrain, this.unitState);
    }
}

/**
 * Helper function to create a SituatedUnitBuilder
 */
export function situatedUnit(): SituatedUnitBuilder {
    return new SituatedUnitBuilder();
}
