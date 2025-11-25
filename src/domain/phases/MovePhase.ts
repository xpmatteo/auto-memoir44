// ABOUTME: Phase for moving ordered units
// ABOUTME: Generates legal moves for infantry units (1-2 hexes) with pathfinding

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {EndMovementsMove, Move, MoveUnitMove} from "../Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {BOARD_GEOMETRY} from "../BoardGeometry";

// Declare which methods from GameState we actually need to do our job
export interface UnitMover {
    getOrderedUnitsWithPositions(): Array<{ coord: HexCoord; unit: Unit }>;

    isUnitMoved(unit: Unit): boolean;

    getUnitAt(coord: HexCoord): Unit | undefined;
}

export class MovePhase implements Phase {
    name: string = "Move Units";
    type = PhaseType.MOVE;

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
