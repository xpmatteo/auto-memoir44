import { HexCoord } from "../utils/hex";
import {BOARD_GEOMETRY} from "../domain/BoardGeometry";
import {GameState} from "../domain/GameState";
import {Side} from "../domain/Player";

export interface RetreatPaths {
    maxDistance: number;
    paths: Map<number, Array<HexCoord>>;
}

function subtractOffMap(hexes: Array<HexCoord>): Array<HexCoord> {
    return hexes.filter(hex => BOARD_GEOMETRY.contains(hex));
}

function subtractOccupiedHexes(gameState: GameState, hexes: Array<HexCoord>): Array<HexCoord> {
    return hexes.filter(hex => gameState.getUnitAt(hex));
}

/*
    Return the paths that a unit can retreat along, given a maximum distance.
    The paths are returned as a map from distance to list of hexes that can be retreated to.
    If there is no retreat path, the set is empty
    Examples
    --------
    If the unit is at 4,4 and retreats north and can retreat 1 hex, the result is:
    { 1: [hexOf(4,3), hexOf(5,3)] }
    If it can retreat 2 hexes, the result is:
    { 1: [hexOf(4,3), hexOf(5,3)], 2: [hexOf(4,2), hexOf(5,2), hexOf(6,2)] }
 */
export function retreatPaths(gameState1: GameState, hex: HexCoord, maxDistance: number, side: Side): RetreatPaths {
    let neighborFunction : (hex: HexCoord) =>  [HexCoord, HexCoord] ;
    if (side === gameState1.sideTop) {
        neighborFunction = (hex: HexCoord) => hex.northernNeighbors();
    } else if (side === gameState1.sideBottom) {
        neighborFunction = (hex: HexCoord) => hex.southernNeighbors();
    } else {
        throw new Error(`Invalid side ${side}`);
    }

    let seed = [hex];
    let result: RetreatPaths = {
        maxDistance: -1,
        paths: new Map(),
    };
    result.paths.set(0, seed);
    let distance = 0;
    for (let i = 0; i < maxDistance; i++) {
        seed = subtractOccupiedHexes(gameState1, subtractOffMap(Array.from(new Set(seed.flatMap(neighborFunction)))));
        result.paths.set(i+1, seed);
        if (seed.length > 0) {
            distance++;
        }
    }
    result.maxDistance = distance;
    return result;
}

/*
export class FlagResult {
    damage: number;
    retreats: HexCoord[];

    constructor(damage: number, retreatHexes: HexCoord[]) {
        this.damage = damage;
        this.retreats = retreatHexes;
    }

    static NO_EFFECT = new FlagResult(0, []);

    toString() {
        return `FlagResult(damage: ${this.damage}, retreatHexes: ${this.retreats})`;
    }

    static retreat(hexes: HexCoord[]) {
        return new FlagResult(0, hexes);
    }

    static damage(number: number) {
        return new FlagResult(number, []);
    }
}

function handleFlagsNonIgnorable(flags: number, retreatHexesPerFlag: number, retreatPaths: RetreatPaths): FlagResult {
    const requiredRetreat = flags * retreatHexesPerFlag;
    const damage = Math.max(0, requiredRetreat - retreatPaths.maxDistance);
    const distance = Math.min(retreatPaths.maxDistance, requiredRetreat);
    const retreatPath = (distance === 0) ? [] : retreatPaths.paths.get(distance);
    return new FlagResult(damage, retreatPath);
}

function handleFlagsWithOneIgnorable(flags: number, retreatHexesPerFlag: number, retreatPaths: RetreatPaths): FlagResult {
    const requiredRetreat = flags * retreatHexesPerFlag;
    const retreatWithIgnoredFlag = (flags - 1) * retreatHexesPerFlag;
    if (requiredRetreat === retreatPaths.maxDistance) {
        const notIgnoring = retreatPaths[requiredRetreat];
        const ignoring = retreatPaths[retreatWithIgnoredFlag];
        return new FlagResult(0, ignoring.concat(notIgnoring));
    }
    return handleFlagsNonIgnorable(flags - 1, retreatHexesPerFlag, retreatPaths);
}

export function handleFlags(flags: number, retreatHexesPerFlag: number, ignorableFlags: number, retreatPaths: RetreatPaths): FlagResult {
    if (flags === 0) {
        return FlagResult.NO_EFFECT;
    }

    switch (ignorableFlags) {
        case 0:
            return handleFlagsNonIgnorable(flags, retreatHexesPerFlag, retreatPaths);
        case 1:
            return handleFlagsWithOneIgnorable(flags, retreatHexesPerFlag, retreatPaths);
        default:
            throw new Error("unsupported ignorableFlags: " + ignorableFlags);
    }
}


 */
