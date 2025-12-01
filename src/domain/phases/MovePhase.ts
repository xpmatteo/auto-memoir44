// ABOUTME: Phase for moving ordered units
// ABOUTME: Generates legal moves with unit-specific ranges (infantry 1-2, armor 1-3) with pathfinding

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {EndMovementsMove, Move, MoveUnitMove} from "../Move";
import {Unit, UnitState} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {BOARD_GEOMETRY} from "../BoardGeometry";
import {Terrain} from "../terrain/Terrain";

// Declare which methods from GameState we actually need to do our job
export interface UnitMover {
    getAllUnits(): Array<{ unit: Unit; coord: HexCoord; terrain: Terrain; unitState: UnitState }>;

    getUnitAt(coord: HexCoord): Unit | undefined;

    getTerrain(coord: HexCoord): Terrain;
}

export class MovePhase implements Phase {
    name: string = "Move Units";
    type = PhaseType.MOVE;

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitMover: UnitMover): Array<Move> {
        const allUnits = unitMover.getAllUnits();
        const moves: Array<Move> = [];

        for (const {coord, unit, unitState} of allUnits) {
            // Only consider ordered units that have not moved
            if (!unitState.isOrdered || unitState.hasMoved) {
                continue;
            }

            // Add "no-op" move - unit stays in place (for defensive positions)
            moves.push(new MoveUnitMove(coord, coord));

            // Use unit-specific movement range (infantry: 2, armor: 3)
            const maxDistance = unit.maxMovementDistance();
            const validDestinations = this.findValidDestinations(
                coord,
                maxDistance,
                unitMover
            );

            for (const dest of validDestinations) {
                moves.push(new MoveUnitMove(coord, dest));
            }
        }

        moves.push(new EndMovementsMove());
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

            // Check all neighbors (only valid on-board neighbors)
            for (const neighbor of BOARD_GEOMETRY.getValidNeighbors(coord)) {
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

                // Check terrain to decide if we can move THROUGH this hex
                const terrain = unitMover.getTerrain(neighbor);
                if (terrain.unitMovingInMustStop) {
                    // Can move TO this hex, but cannot move THROUGH it
                    continue;
                }

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
