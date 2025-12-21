// ABOUTME: Acceptance tests for board geometry validation
// ABOUTME: Tests that board boundaries and sections match the original board.js implementation

import { describe, expect, it } from "vitest";
import { BOARD_GEOMETRY } from "../../src/domain/BoardGeometry";
import { Position } from "../../src/domain/Player";
import { Section } from "../../src/domain/Section";
import {hexOf} from "../../src/utils/hex";

describe("BoardGeometry", () => {
    describe("Board boundaries", () => {
        it("Contains all 113 valid hexes from the 13×9 board (5×13 + 4×12)", () => {
            const allHexes = BOARD_GEOMETRY.getAllHexes();
            expect(allHexes.length).toBe(113);
        });

        it("Accepts valid hexes on the board", () => {
            // Test center of board
            expect(BOARD_GEOMETRY.contains(hexOf(0, 0))).toBe(true);
            expect(BOARD_GEOMETRY.contains(hexOf(6, 0))).toBe(true);

            // Test corners
            expect(BOARD_GEOMETRY.contains(hexOf(-4, 8))).toBe(true);
            expect(BOARD_GEOMETRY.contains(hexOf(8, 8))).toBe(true);

            // Test edges (Row 0: q=0 to 12, Row 8: q=-4 to 8)
            expect(BOARD_GEOMETRY.contains(hexOf(0, 0))).toBe(true);
            expect(BOARD_GEOMETRY.contains(hexOf(12, 0))).toBe(true);
        });

        it("Rejects hexes outside board boundaries", () => {
            // Too far left on row 0
            expect(BOARD_GEOMETRY.contains(hexOf(-1, 0))).toBe(false);

            // Too far right on row 0
            expect(BOARD_GEOMETRY.contains(hexOf(13, 0))).toBe(false);

            // Too far top
            expect(BOARD_GEOMETRY.contains(hexOf(0, -1))).toBe(false);

            // Too far bottom
            expect(BOARD_GEOMETRY.contains(hexOf(0, 9))).toBe(false);

            // Off the edge on an odd row (Row 1: q=0 to 11)
            expect(BOARD_GEOMETRY.contains(hexOf(12, 1))).toBe(false);
            expect(BOARD_GEOMETRY.contains(hexOf(-1, 1))).toBe(false);
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
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(0, 0), Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(3, 1), Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(2, 3), Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(1, 5), Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(0, 7), Section.LEFT, Position.BOTTOM)).toBe(true);

            // Should NOT be in LEFT
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 0), Section.LEFT, Position.BOTTOM)).toBe(false);
        });

        it("Assigns CENTER section hexes correctly", () => {
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(4, 0), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(3, 2), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(2, 4), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(1, 6), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(0, 8), Section.CENTER, Position.BOTTOM)).toBe(true);

            expect(BOARD_GEOMETRY.isHexInSection(hexOf(8, 0), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(7, 2), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(6, 4), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 6), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(4, 8), Section.CENTER, Position.BOTTOM)).toBe(true);

            // CENTER hexes should NOT be in LEFT or RIGHT
            // Row 0: center is q=5,6,7
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 0), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(6, 0), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(7, 0), Section.CENTER, Position.BOTTOM)).toBe(true);

            // Row 1: center is q=4,5,6,7
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(4, 1), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 1), Section.CENTER, Position.BOTTOM)).toBe(true);

            // Verify these are NOT in LEFT or RIGHT
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 0), Section.LEFT, Position.BOTTOM)).toBe(false);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 0), Section.RIGHT, Position.BOTTOM)).toBe(false);
        });

        it("Assigns RIGHT section hexes correctly", () => {
            // From board.test.js: MAP_EAST examples
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(12, 0), Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(8, 1), Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(7, 3), Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(6, 5), Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(5, 7), Section.RIGHT, Position.BOTTOM)).toBe(true);

            // Should NOT be in RIGHT
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(7, 0), Section.RIGHT, Position.BOTTOM)).toBe(false);
        });
    });

    describe("Section assignments for TOP player (flipped perspective)", () => {
        it("Flips LEFT and RIGHT sections for TOP player", () => {
            // What is LEFT for BOTTOM is RIGHT for TOP
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(0, 0), Section.LEFT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(0, 0), Section.RIGHT, Position.TOP)).toBe(true);

            // What is RIGHT for BOTTOM is LEFT for TOP
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(12, 0), Section.RIGHT, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(12, 0), Section.LEFT, Position.TOP)).toBe(true);
        });

        it("Keeps CENTER section the same for both players", () => {
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(6, 0), Section.CENTER, Position.BOTTOM)).toBe(true);
            expect(BOARD_GEOMETRY.isHexInSection(hexOf(6, 0), Section.CENTER, Position.TOP)).toBe(true);
        });
    });

    describe("Valid neighbors", () => {
        it("Returns all 6 neighbors for a hex in the middle of the board", () => {
            const neighbors = BOARD_GEOMETRY.getValidNeighbors(hexOf(0, 4));
            expect(neighbors.length).toBe(6);

            // Check that all 6 directions are present
            const expectedNeighbors = [
                hexOf(1, 4),   // East
                hexOf(1, 3),   // Northeast
                hexOf(0, 3),   // Northwest
                hexOf(-1, 4),  // West
                hexOf(-1, 5),  // Southwest
                hexOf(0, 5),   // Southeast
            ];
            for (const expected of expectedNeighbors) {
                expect(neighbors).toContain(expected);
            }
        });

        it("Returns only on-board neighbors for edge hexes", () => {
            // Bottom-left corner (q=-4, r=8)
            const bottomLeftNeighbors = BOARD_GEOMETRY.getValidNeighbors(hexOf(-4, 8));
            expect(bottomLeftNeighbors.length).toBe(2);
            expect(bottomLeftNeighbors).toContain(hexOf(-3, 8)); // East
            expect(bottomLeftNeighbors).toContain(hexOf(-3, 7)); // Northeast

            // Top-right corner (q=12, r=0)
            const topRightNeighbors = BOARD_GEOMETRY.getValidNeighbors(hexOf(12, 0));
            expect(topRightNeighbors.length).toBe(2);

            // Bottom edge hex
            const bottomEdgeNeighbors = BOARD_GEOMETRY.getValidNeighbors(hexOf(0, 8));
            expect(bottomEdgeNeighbors.length).toBeLessThan(6);
            // Should not include any neighbors with r > 8
            expect(bottomEdgeNeighbors.every(n => n.r <= 8)).toBe(true);
        });

        it("Returns empty array for off-board hex", () => {
            const neighbors = BOARD_GEOMETRY.getValidNeighbors(hexOf(-10, 0));
            expect(neighbors.length).toBe(0);
        });
    });
});
