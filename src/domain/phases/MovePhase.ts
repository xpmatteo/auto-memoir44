// ABOUTME: Phase for moving ordered units
// ABOUTME: Generates legal moves for infantry units (1-2 hexes) with pathfinding

import {Phase} from "./Phase";
import {GameState} from "../GameState";
import {Move, MoveUnitMove} from "../Move";
import {Unit} from "../Unit";
import type {HexCoord} from "../../utils/hex";

// Declare which methods from GameState we actually need to do our job
export interface UnitMover {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;
    isUnitMoved(unit: Unit): boolean;
    getUnitAt(coord: HexCoord): Unit | undefined;
}

// Pointy-top hex neighbors in axial coordinates
const HEX_NEIGHBORS = [
    {q: 1, r: 0},   // East
    {q: 0, r: 1},   // Southeast
    {q: -1, r: 1},  // Southwest
    {q: -1, r: 0},  // West
    {q: -1, r: -1}, // Northwest
    {q: 0, r: -1},  // Northeast
];

function getNeighbors(coord: HexCoord): HexCoord[] {
    return HEX_NEIGHBORS.map(offset => ({
        q: coord.q + offset.q,
        r: coord.r + offset.r
    }));
}

function hexDistance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export class MovePhase implements Phase {
    name: string = "Move Units";

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitMover: UnitMover): Array<Move> {
        const orderedUnits = unitMover.getOrderedUnitsWithPositions();
        const moves: Array<Move> = [];

        for (const {coord, unit} of orderedUnits) {
            // Skip units that have already moved
            if (unitMover.isUnitMoved(unit)) {
                continue;
            }

            // Infantry can move 1 or 2 hexes
            const maxDistance = 2;
            const validDestinations = this.findValidDestinations(
                coord,
                maxDistance,
                unitMover
            );

            for (const dest of validDestinations) {
                moves.push(new MoveUnitMove(coord, dest));
            }
        }

        return moves;
    }

    /**
     * Find all valid destinations within maxDistance hexes from start,
     * respecting pathfinding constraints (cannot move through friendly units)
     */
    private findValidDestinations(
        start: HexCoord,
        maxDistance: number,
        unitMover: UnitMover
    ): HexCoord[] {
        const validDestinations: HexCoord[] = [];
        const visited = new Set<string>();

        // BFS to find all reachable hexes within maxDistance
        const queue: { coord: HexCoord; distance: number }[] = [{coord: start, distance: 0}];
        visited.add(coordToKey(start));

        while (queue.length > 0) {
            const {coord, distance} = queue.shift()!;

            // Don't expand from this hex if we're at max distance
            if (distance >= maxDistance) {
                continue;
            }

            // Check all neighbors
            for (const neighbor of getNeighbors(coord)) {
                const key = coordToKey(neighbor);

                // Skip if already visited
                if (visited.has(key)) {
                    continue;
                }

                visited.add(key);

                // Check if hex is occupied
                const occupyingUnit = unitMover.getUnitAt(neighbor);
                if (occupyingUnit) {
                    // Can't move to or through occupied hexes
                    continue;
                }

                // This is a valid destination
                validDestinations.push(neighbor);

                // Add to queue to continue searching from this hex
                queue.push({coord: neighbor, distance: distance + 1});
            }
        }

        return validDestinations;
    }
}

function coordToKey(coord: HexCoord): string {
    return `${coord.q},${coord.r}`;
}
