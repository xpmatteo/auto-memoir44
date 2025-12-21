// ABOUTME: Board geometry for the 13×9 Memoir '44 hex grid
// ABOUTME: Validates hex positions and determines section assignments

import {HexCoord, hexOf} from "../utils/hex";
import {Position} from "./Player";
import {Section} from "./Section";

/**
 * Immutable board geometry defining the valid hexes on the Memoir '44 board.
 * Extracted from the original board.js implementation.
 */
export class BoardGeometry {
    private readonly validHexes: Map<string, HexCoord>;
    private readonly leftHexes: Set<string>;
    private readonly centerHexes: Set<string>;
    private readonly rightHexes: Set<string>;

    constructor() {
        this.validHexes = new Map<string, HexCoord>();
        this.leftHexes = new Set();
        this.centerHexes = new Set();
        this.rightHexes = new Set();

        this.generateMap();
    }

    /**
     * Generate all valid hexes on the 13×9 board.
     * Algorithm from board.js:makeMap()
     */
    private generateMap(): void {
        for (let r = 0; r <= 8; r++) {
            const colStart = -Math.trunc(r / 2);
            const numCols = r % 2 === 0 ? 13 : 12;

            for (let q = colStart; q < colStart + numCols; q++) {
                const hex = hexOf(q, r);
                const key = this.hexKey(hex);
                this.validHexes.set(key, hex);

                // Determine section (from BOTTOM player perspective)
                if (this.isLeft(r, q)) {
                    this.leftHexes.add(key);
                } else if (this.isRight(r, q)) {
                    this.rightHexes.add(key);
                } else {
                    this.centerHexes.add(key);
                }
            }
        }

        // add extra hexes that straddle the center and either the left or right sections
        this.centerHexes.add(this.hexKey(hexOf(3, 1)));
        this.centerHexes.add(this.hexKey(hexOf(2, 3)));
        this.centerHexes.add(this.hexKey(hexOf(1, 5)));
        this.centerHexes.add(this.hexKey(hexOf(0, 7)));
        this.centerHexes.add(this.hexKey(hexOf(8, 1)));
        this.centerHexes.add(this.hexKey(hexOf(7, 3)));
        this.centerHexes.add(this.hexKey(hexOf(6, 5)));
        this.centerHexes.add(this.hexKey(hexOf(5, 7)));
    }

    /**
     * Check if a hex is in the LEFT section (from BOTTOM player perspective).
     * Adapted from board.js:isWest()
     */
    private isLeft(r: number, q: number): boolean {
        return (
            (r === 0 && q < 4) ||
            (r === 1 && q <= 3) ||
            (r === 2 && q < 3) ||
            (r === 3 && q <= 2) ||
            (r === 4 && q < 2) ||
            (r === 5 && q <= 1) ||
            (r === 6 && q < 1) ||
            (r === 7 && q <= 0) ||
            (r === 8 && q < 0)
        );
    }

    /**
     * Check if a hex is in the RIGHT section (from BOTTOM player perspective).
     * Adapted from board.js:isEast()
     */
    private isRight(r: number, q: number): boolean {
        return (
            (r === 0 && q > 8) ||
            (r === 1 && q >= 8) ||
            (r === 2 && q > 7) ||
            (r === 3 && q >= 7) ||
            (r === 4 && q > 6) ||
            (r === 5 && q >= 6) ||
            (r === 6 && q > 5) ||
            (r === 7 && q >= 5) ||
            (r === 8 && q > 4)
        );
    }

    /**
     * Create a unique key for a hex coordinate.
     */
    private hexKey(coord: HexCoord): string {
        return `${coord.q},${coord.r}`;
    }

    /**
     * Check if a hex coordinate is within the board boundaries.
     */
    contains(coord: HexCoord): boolean {
        return this.validHexes.has(this.hexKey(coord));
    }

    /**
     * Check if a hex belongs to a specific section from a player's perspective.
     */
    isHexInSection(coord: HexCoord, section: Section, playerPosition: Position): boolean {
        const key = this.hexKey(coord);

        // Get section membership from BOTTOM player perspective
        const isLeft = this.leftHexes.has(key);
        const isCenter = this.centerHexes.has(key);
        const isRight = this.rightHexes.has(key);

        // Apply player perspective
        if (playerPosition === Position.BOTTOM) {
            if (section === Section.LEFT) return isLeft;
            if (section === Section.CENTER) return isCenter;
            if (section === Section.RIGHT) return isRight;
        } else {
            // TOP player - perspective is flipped
            if (section === Section.LEFT) return isRight;
            if (section === Section.CENTER) return isCenter;
            if (section === Section.RIGHT) return isLeft;
        }

        return false;
    }

    /**
     * Get all valid neighbor hexes (within board boundaries).
     */
    getValidNeighbors(coord: HexCoord): HexCoord[] {
        const neighbors: HexCoord[] = [
            coord.east(),
            coord.northeast(),
            coord.northwest(),
            coord.west(),
            coord.southwest(),
            coord.southeast(),
        ];

        return neighbors.filter(neighbor => this.contains(neighbor));
    }

    /**
     * Get all valid hexes on the board.
     */
    getAllHexes(): HexCoord[] {
        return [...this.validHexes.values()];
    }
}

// Singleton instance
export const BOARD_GEOMETRY = new BoardGeometry();
