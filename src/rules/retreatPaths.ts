// ABOUTME: Retreat path calculation for flag battle results
// ABOUTME: Computes valid retreat hexes at various distances, excluding occupied and off-board hexes

import {GameState} from "../domain/GameState";
import {HexCoord, HexCoordKey} from "../utils/hex";
import {Side} from "../domain/Player";
import {BOARD_GEOMETRY} from "../domain/BoardGeometry";

export interface RetreatPaths {
    maxDistance: number;
    paths: Map<number, Array<HexCoord>>;
}

function subtractOffMap(hexes: Array<HexCoord>): Array<HexCoord> {
    return hexes.filter(hex => BOARD_GEOMETRY.contains(hex));
}

function subtractOccupiedHexes(gameState: GameState, hexes: Array<HexCoord>): Array<HexCoord> {
    return hexes.filter(hex => !gameState.getUnitAt(hex));
}

function deduplicateHexes(hexes: Array<HexCoord>): Array<HexCoord> {
    const seen = new Map<HexCoordKey, HexCoord>();
    for (const hex of hexes) {
        if (!seen.has(hex.key())) {
            seen.set(hex.key(), hex);
        }
    }
    return Array.from(seen.values());
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
export function retreatPaths(gameState: GameState, unitHex: HexCoord, maxDistance: number, side: Side): RetreatPaths {
    let neighborFunction: (hex: HexCoord) => [HexCoord, HexCoord];
    if (side === gameState.sideTop) {
        neighborFunction = (hex: HexCoord) => hex.northernNeighbors();
    } else if (side === gameState.sideBottom) {
        neighborFunction = (hex: HexCoord) => hex.southernNeighbors();
    } else {
        throw new Error(`Invalid side ${side}`);
    }

    let seed = [unitHex];
    let result: RetreatPaths = {
        maxDistance: -1,
        paths: new Map(),
    };
    result.paths.set(0, seed);
    let distance = 0;
    for (let i = 0; i < maxDistance; i++) {
        seed = subtractOccupiedHexes(gameState, subtractOffMap(deduplicateHexes(seed.flatMap(neighborFunction))));
        result.paths.set(i + 1, seed);
        if (seed.length > 0) {
            distance++;
        }
    }
    result.maxDistance = distance;
    return result;
}
