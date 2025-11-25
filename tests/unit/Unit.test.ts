// ABOUTME: Unit tests for UnitState class
// ABOUTME: Tests unit state management and turn-based state clearing

import {describe, expect, it} from "vitest";
import {Infantry, UnitState} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";

describe("UnitState", () => {
    describe("clearTurnState", () => {
        it("should reset isOrdered to false", () => {
            const state = new UnitState(4);
            state.isOrdered = true;

            state.clearTurnState();

            expect(state.isOrdered).toBe(false);
        });

        it("should reset hasMoved to false", () => {
            const state = new UnitState(4);
            state.hasMoved = true;

            state.clearTurnState();

            expect(state.hasMoved).toBe(false);
        });

        it("should reset skipsBattle to false", () => {
            const state = new UnitState(4);
            state.skipsBattle = true;

            state.clearTurnState();

            expect(state.skipsBattle).toBe(false);
        });

        it("should reset attacksThisTurn to 0", () => {
            const state = new UnitState(4);
            state.battlesThisTurn = 3;

            state.clearTurnState();

            expect(state.battlesThisTurn).toBe(0);
        });

        it("should reset all turn state flags together", () => {
            const state = new UnitState(4);
            state.isOrdered = true;
            state.hasMoved = true;
            state.skipsBattle = true;
            state.battlesThisTurn = 2;

            state.clearTurnState();

            expect(state.isOrdered).toBe(false);
            expect(state.hasMoved).toBe(false);
            expect(state.skipsBattle).toBe(false);
            expect(state.battlesThisTurn).toBe(0);
        });
    });

    describe("initialization", () => {
        it("should initialize attacksThisTurn to 0", () => {
            const state = new UnitState(4);

            expect(state.battlesThisTurn).toBe(0);
        });

        it("should initialize all turn state flags to false/0", () => {
            const state = new UnitState(4);

            expect(state.isOrdered).toBe(false);
            expect(state.hasMoved).toBe(false);
            expect(state.skipsBattle).toBe(false);
            expect(state.battlesThisTurn).toBe(0);
        });

        it("should initialize strength from constructor", () => {
            const state = new UnitState(4);

            expect(state.strength).toBe(4);
        });
    });
});

describe("Unit", () => {
    describe("immutable properties", () => {
        it("should have an id", () => {
            const unit = new Infantry(Side.ALLIES, 4);

            expect(unit.id).toBeDefined();
            expect(unit.id).toMatch(/^unit-\d+$/);
        });

        it("should have initialStrength", () => {
            const unit = new Infantry(Side.ALLIES, 3);

            expect(unit.initialStrength).toBe(3);
        });

        it("should have side", () => {
            const unit = new Infantry(Side.ALLIES, 4);

            expect(unit.side).toBe(Side.ALLIES);
        });
    });
});
