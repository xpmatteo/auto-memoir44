// ABOUTME: Represents a unit with its full game context
// ABOUTME: Combines unit data, position, terrain, and mutable state

import {Unit, UnitState} from "./Unit";
import {HexCoord} from "../utils/hex";
import {Terrain} from "./terrain/Terrain";

/**
 * A unit with its complete game context: position, terrain, and mutable state.
 * This is a value object that aggregates all the information about a unit
 * that's needed for game logic calculations.
 */
export class SituatedUnit {
    readonly unit: Unit;
    readonly coord: HexCoord;
    readonly terrain: Terrain;
    readonly unitState: UnitState;

    constructor(unit: Unit, coord: HexCoord, terrain: Terrain, unitState: UnitState) {
        this.unit = unit;
        this.coord = coord;
        this.terrain = terrain;
        this.unitState = unitState;
    }
}
