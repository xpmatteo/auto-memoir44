// ABOUTME: Unit tests for Unit class
// ABOUTME: Tests unit state management and turn-based state clearing

import {describe, expect, it} from "vitest";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";

describe("Unit", () => {
    describe("clearTurnState", () => {
        it("should reset isOrdered to false", () => {
            const unit = new Infantry(Side.ALLIES, 4);
            unit.isOrdered = true;

            unit.clearTurnState();

            expect(unit.isOrdered).toBe(false);
        });

        it("should reset hasMoved to false", () => {
            const unit = new Infantry(Side.ALLIES, 4);
            unit.hasMoved = true;

            unit.clearTurnState();

            expect(unit.hasMoved).toBe(false);
        });

        it("should reset skipsBattle to false", () => {
            const unit = new Infantry(Side.ALLIES, 4);
            unit.skipsBattle = true;

            unit.clearTurnState();

            expect(unit.skipsBattle).toBe(false);
        });

        it("should reset attacksThisTurn to 0", () => {
            const unit = new Infantry(Side.ALLIES, 4);
            unit.battlesThisTurn = 3;

            unit.clearTurnState();

            expect(unit.battlesThisTurn).toBe(0);
        });

        it("should reset all turn state flags together", () => {
            const unit = new Infantry(Side.ALLIES, 4);
            unit.isOrdered = true;
            unit.hasMoved = true;
            unit.skipsBattle = true;
            unit.battlesThisTurn = 2;

            unit.clearTurnState();

            expect(unit.isOrdered).toBe(false);
            expect(unit.hasMoved).toBe(false);
            expect(unit.skipsBattle).toBe(false);
            expect(unit.battlesThisTurn).toBe(0);
        });
    });

    describe("initialization", () => {
        it("should initialize attacksThisTurn to 0", () => {
            const unit = new Infantry(Side.ALLIES, 4);

            expect(unit.battlesThisTurn).toBe(0);
        });

        it("should initialize all turn state flags to false/0", () => {
            const unit = new Infantry(Side.ALLIES, 4);

            expect(unit.isOrdered).toBe(false);
            expect(unit.hasMoved).toBe(false);
            expect(unit.skipsBattle).toBe(false);
            expect(unit.battlesThisTurn).toBe(0);
        });
    });
});
