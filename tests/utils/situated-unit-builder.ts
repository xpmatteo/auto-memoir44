// ABOUTME: Builder pattern for creating SituatedUnit instances in tests
// ABOUTME: Provides fluent API with sensible defaults for test setup

import {SituatedUnit} from "../../src/domain/SituatedUnit";
import {Unit, UnitState, Infantry, Armor} from "../../src/domain/Unit";
import {HexCoord} from "../../src/utils/hex";
import {Terrain, clearTerrain} from "../../src/domain/terrain/Terrain";
import {Side} from "../../src/domain/Player";

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
