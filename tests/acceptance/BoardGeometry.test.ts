// ABOUTME: Acceptance tests for board geometry validation
// ABOUTME: Tests that board boundaries and sections match the original board.js implementation

import { describe, expect, it } from "vitest";
import { BOARD_GEOMETRY } from "../../src/domain/BoardGeometry";
import { Position } from "../../src/domain/Player";
import { Section } from "../../src/domain/Section";
import type { HexCoord } from "../../src/utils/hex";

describe("BoardGeometry", () => {
    describe("Board boundaries", () => {
        it("Contains all 113 valid hexes from the 13×9 board (5×13 + 4×12)", () => {
            const allHexes = BOARD_GEOMETRY.getAllHexes();
            expect(allHexes.length).toBe(113);
        });

        it("Accepts valid hexes on the board", () => {
            // Test center of board
            expect(BOARD_GEOMETRY.contains({ q: 0, r: 0 })).toBe(true);
            expect(BOARD_GEOMETRY.contains({ q: 6, r: 0 })).toBe(true);

            // Test corners
            expect(BOARD_GEOMETRY.contains({ q: -4, r: 8 })).toBe(true);
            expect(BOARD_GEOMETRY.contains({ q: 8, r: 8 })).toBe(true);

            // Test edges (Row 0: q=0 to 12, Row 8: q=-4 to 8)
            expect(BOARD_GEOMETRY.contains({ q: 0, r: 0 })).toBe(true);
            expect(BOARD_GEOMETRY.contains({ q: 12, r: 0 })).toBe(true);
        });

        it("Rejects hexes outside board boundaries", () => {
            // Too far left on row 0
            expect(BOARD_GEOMETRY.contains({ q: -1, r: 0 })).toBe(false);

            // Too far right on row 0
            expect(BOARD_GEOMETRY.contains({ q: 13, r: 0 })).toBe(false);

            // Too far top
            expect(BOARD_GEOMETRY.contains({ q: 0, r: -1 })).toBe(false);

            // Too far bottom
            expect(BOARD_GEOMETRY.contains({ q: 0, r: 9 })).toBe(false);

            // Off the edge on an odd row (Row 1: q=0 to 11)
            expect(BOARD_GEOMETRY.contains({ q: 12, r: 1 })).toBe(false);
            expect(BOARD_GEOMETRY.contains({ q: -1, r: 1 })).toBe(false);
        });

        it("Generates correct number of hexes per row", () => {
            const hexesByRow = new Map<number, number>();
            for (const hex of BOARD_GEOMETRY.getAllHexes()) {
                hexesByRow.set(hex.r, (hexesByRow.get(hex.r) || 0) + 1);
            }

            // Even rows (0, 2, 4, 6, 8) have 13 hexes
            expect(hexesByRow.get(0)).toBe(13);
            expect(hexesByRow.get(2)).toBe(13);
            expect(hexesByRow.get(4)).toBe(13);
            expect(hexesByRow.get(6)).toBe(13);
            expect(hexesByRow.get(8)).toBe(13);

            // Odd rows (1, 3, 5, 7) have 12 hexes
            expect(hexesByRow.get(1)).toBe(12);
            expect(hexesByRow.get(3)).toBe(12);
            expect(hexesByRow.get(5)).toBe(12);
            expect(hexesByRow.get(7)).toBe(12);
        });
    });

    describe("Section assignments for BOTTOM player", () => {
        it("Assigns LEFT section hexes correctly", () => {
            // From board.test.js: MAP_WEST examples
            expect(BOARD_GEOMETRY.isHexInSection({ q: 0, r: 0 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 4, r: 0 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 3, r: 1 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 3, r: 2 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 2, r: 3 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 2, r: 4 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 1, r: 5 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 1, r: 6 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 0, r: 7 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 0, r: 8 }, Section.LEFT, Position.BOTTOM)).toBe(true);

            // Should NOT be in LEFT
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 0 }, Section.LEFT, Position.BOTTOM)).toBe(false);
        });

        it("Assigns CENTER section hexes correctly", () => {
            // CENTER hexes should NOT be in LEFT or RIGHT
            // Row 0: center is q=5,6,7
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 0 }, Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 6, r: 0 }, Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 7, r: 0 }, Section.CENTER, Position.BOTTOM)).toBe(true);

            // Row 1: center is q=4,5,6,7
            expect(BOARD_GEOMETRY.isHexInSection({ q: 4, r: 1 }, Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 1 }, Section.CENTER, Position.BOTTOM)).toBe(true);

            // Verify these are NOT in LEFT or RIGHT
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 0 }, Section.LEFT, Position.BOTTOM)).toBe(false);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 0 }, Section.RIGHT, Position.BOTTOM)).toBe(false);
        });

        it("Assigns RIGHT section hexes correctly", () => {
            // From board.test.js: MAP_EAST examples
            expect(BOARD_GEOMETRY.isHexInSection({ q: 12, r: 0 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 8, r: 0 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 8, r: 1 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 7, r: 2 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 7, r: 3 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 6, r: 4 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 6, r: 5 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 6 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 5, r: 7 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 4, r: 8 }, Section.RIGHT, Position.BOTTOM)).toBe(true);

            // Should NOT be in RIGHT
            expect(BOARD_GEOMETRY.isHexInSection({ q: 7, r: 0 }, Section.RIGHT, Position.BOTTOM)).toBe(false);
        });
    });

    describe("Section assignments for TOP player (flipped perspective)", () => {
        it("Flips LEFT and RIGHT sections for TOP player", () => {
            // What is LEFT for BOTTOM is RIGHT for TOP
            expect(BOARD_GEOMETRY.isHexInSection({ q: 0, r: 0 }, Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 0, r: 0 }, Section.RIGHT, Position.TOP)).toBe(true);

            // What is RIGHT for BOTTOM is LEFT for TOP
            expect(BOARD_GEOMETRY.isHexInSection({ q: 12, r: 0 }, Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 12, r: 0 }, Section.LEFT, Position.TOP)).toBe(true);
        });

        it("Keeps CENTER section the same for both players", () => {
            expect(BOARD_GEOMETRY.isHexInSection({ q: 6, r: 0 }, Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection({ q: 6, r: 0 }, Section.CENTER, Position.TOP)).toBe(true);
        });
    });

    describe("Valid neighbors", () => {
        it("Returns all 6 neighbors for a hex in the middle of the board", () => {
            const neighbors = BOARD_GEOMETRY.getValidNeighbors({ q: 0, r: 4 });
            expect(neighbors.length).toBe(6);

            // Check that all 6 directions are present
            const neighborSet = new Set(neighbors.map(n => `${n.q},${n.r}`));
            expect(neighborSet.has("1,4")).toBe(true);   // East
            expect(neighborSet.has("1,3")).toBe(true);   // Northeast
            expect(neighborSet.has("0,3")).toBe(true);   // Northwest
            expect(neighborSet.has("-1,4")).toBe(true);  // West
            expect(neighborSet.has("-1,5")).toBe(true);  // Southwest
            expect(neighborSet.has("0,5")).toBe(true);   // Southeast
        });

        it("Returns only on-board neighbors for edge hexes", () => {
            // Bottom-left corner (q=-4, r=8)
            const bottomLeftNeighbors = BOARD_GEOMETRY.getValidNeighbors({ q: -4, r: 8 });
            expect(bottomLeftNeighbors.length).toBe(2);
            expect(bottomLeftNeighbors.some(n => n.q === -3 && n.r === 8)).toBe(true); // East
            expect(bottomLeftNeighbors.some(n => n.q === -3 && n.r === 7)).toBe(true); // Northeast

            // Top-right corner (q=12, r=0)
            const topRightNeighbors = BOARD_GEOMETRY.getValidNeighbors({ q: 12, r: 0 });
            expect(topRightNeighbors.length).toBe(2);

            // Bottom edge hex
            const bottomEdgeNeighbors = BOARD_GEOMETRY.getValidNeighbors({ q: 0, r: 8 });
            expect(bottomEdgeNeighbors.length).toBeLessThan(6);
            // Should not include any neighbors with r > 8
            expect(bottomEdgeNeighbors.every(n => n.r <= 8)).toBe(true);
        });

        it("Returns empty array for off-board hex", () => {
            const neighbors = BOARD_GEOMETRY.getValidNeighbors({ q: -10, r: 0 });
            expect(neighbors.length).toBe(0);
        });
    });
});
