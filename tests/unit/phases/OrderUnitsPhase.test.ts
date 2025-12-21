// ABOUTME: Unit tests for OrderUnitsPhase
// ABOUTME: Tests that section-based ordering correctly delegates to GeneralOrderUnitsPhase

import {describe, expect, test, beforeEach} from "vitest";
import {Section} from "../../../src/domain/Section";
import {ConfirmOrdersMove, OrderUnitMove, UnOrderMove} from "../../../src/domain/moves/Move";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {OrderUnitsPhase} from "../../../src/domain/phases/OrderUnitsPhase";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {hexOf} from "../../../src/utils/hex";
import {resetUnitIdCounter} from "../../../src/domain/Unit";

describe("OrderUnitsPhase", () => {
    let gameState: GameState;

    beforeEach(() => {
        resetUnitIdCounter();
        gameState = new GameState(new Deck([]));
    });

    describe("section filtering", () => {
        test("only units in the specified section can be ordered", () => {
            // Place unit in left section (bottom player perspective)
            const leftUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(-2, 7), leftUnit);

            // Place unit in center section
            const centerUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(4, 4), centerUnit);

            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Only the left unit should be orderable
            expect(orderMoves.length).toBe(1);
            expect(orderMoves[0].unit).toBe(leftUnit);
        });

        test("multiple sections allow ordering from any of them", () => {
            // Place unit in left section
            const leftUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(-2, 7), leftUnit);

            // Place unit in right section
            const rightUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(8, 7), rightUnit);

            // Place unit in center section (should not be orderable)
            const centerUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(4, 4), centerUnit);

            const phase = new OrderUnitsPhase([Section.LEFT, Section.RIGHT], 2);
            const moves = phase.legalMoves(gameState);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Left and right units should be orderable, but not center
            expect(orderMoves.length).toBe(2);
            expect(orderMoves.some(m => m.unit === leftUnit)).toBe(true);
            expect(orderMoves.some(m => m.unit === rightUnit)).toBe(true);
            expect(orderMoves.some(m => m.unit === centerUnit)).toBe(false);
        });
    });

    describe("ordering limits", () => {
        test("cannot order more units than howManyUnits allows per section", () => {
            // Place 3 units in left section
            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.ALLIES);
            const unit3 = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(-2, 7), unit1);
            gameState.placeUnit(hexOf(-1, 7), unit2);
            gameState.placeUnit(hexOf(-2, 5), unit3);

            // Order 2 of them
            gameState.orderUnit(unit1);
            gameState.orderUnit(unit2);

            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            // Should have unorder moves for ordered units, but no order moves (at limit)
            const orderMoves = moves.filter(m => m instanceof OrderUnitMove);
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove);

            expect(orderMoves.length).toBe(0);
            expect(unorderMoves.length).toBe(2);
        });

        test("can unorder and order different units when at limit", () => {
            // Place 2 units in left section
            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(-2, 7), unit1);
            gameState.placeUnit(hexOf(-1, 7), unit2);

            // Order one of them
            gameState.orderUnit(unit1);

            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove);
            const unorderMoves = moves.filter(m => m instanceof UnOrderMove);

            // Should be able to order unit2 (under limit) and unorder unit1
            expect(orderMoves.length).toBe(1);
            expect(orderMoves[0]).toEqual(new OrderUnitMove(unit2));
            expect(unorderMoves.length).toBe(1);
            expect(unorderMoves[0]).toEqual(new UnOrderMove(unit1));
        });
    });

    describe("confirm orders move", () => {
        test("always includes confirm orders move", () => {
            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);
        });

        test("confirm orders move is present even with no units", () => {
            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            expect(moves.length).toBe(1);
            expect(moves[0]).toBeInstanceOf(ConfirmOrdersMove);
        });
    });

    describe("enemy units", () => {
        test("enemy units are not included in moves", () => {
            // Place friendly unit
            const friendlyUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(-2, 7), friendlyUnit);

            // Place enemy unit in same section
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(hexOf(-1, 7), enemyUnit);

            const phase = new OrderUnitsPhase([Section.LEFT], 2);
            const moves = phase.legalMoves(gameState);

            const orderMoves = moves.filter(m => m instanceof OrderUnitMove) as OrderUnitMove[];

            // Only friendly unit should be orderable
            expect(orderMoves.length).toBe(1);
            expect(orderMoves[0].unit).toBe(friendlyUnit);
        });
    });
});
