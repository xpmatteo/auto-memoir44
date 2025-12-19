// ABOUTME: Movement phase for Artillery Bombard card
// ABOUTME: Artillery can move up to 3 hexes OR battle twice (not both)

import {Phase, PhaseType} from "./Phase";
import {GameState} from "../GameState";
import {EndMovementsMove, Move} from "../moves/Move";
import {Unit} from "../Unit";
import {HexCoord} from "../../utils/hex";
import {BOARD_GEOMETRY} from "../BoardGeometry";
import {Terrain} from "../terrain/Terrain";
import {MoveUnitMove} from "../moves/MoveUnitMove";
import {SituatedUnit} from "../SituatedUnit";

// Declare which methods from GameState we actually need to do our job
export interface UnitMover {
    getAllUnits(): SituatedUnit[];
    getUnitAt(coord: HexCoord): Unit | undefined;
    getTerrain(coord: HexCoord): Terrain;
}

export class ArtilleryBombardMovementPhase extends Phase {
    name: string = "Move Artillery";
    type = PhaseType.MOVE;
    private readonly maxDistance: number;

    constructor(maxDistance: number = 3) {
        super();
        this.maxDistance = maxDistance;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitMover: UnitMover): Array<Move> {
        const allUnits = unitMover.getAllUnits();
        const moves: Array<Move> = [];

        for (const {coord, unitState, terrain} of allUnits) {
            // Only consider ordered units that have not moved
            if (!unitState.isOrdered || unitState.hasMoved) {
                continue;
            }

            // Add "no-op" move - unit stays in place (can battle twice)
            moves.push(new MoveUnitMove(coord, coord));

            // Use custom max distance for artillery
            let maxDistance = this.maxDistance;

            // If unit is in terrain requiring adjacent movement, limit to 1 hex
            if (terrain.requiresAdjacentMovement) {
                maxDistance = 1;
            }

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

                // Check terrain restrictions for destination
                const terrain = unitMover.getTerrain(neighbor);

                // If destination requires adjacent movement, only allow at distance 1
                if (terrain.requiresAdjacentMovement && distance + 1 > 1) {
                    // Can't move to this restricted terrain from distance > 1
                    continue;
                }

                // This is a valid destination
                validDestinations.push(neighbor);

                // Check if we can move THROUGH this hex
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
