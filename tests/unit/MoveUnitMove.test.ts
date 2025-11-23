// ABOUTME: Unit tests for MoveUnitMove
// ABOUTME: Tests that units moving 2 hexes are marked to skip battle

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import type {HexCoord} from "../../src/utils/hex";
import {MoveUnitMove} from "../../src/domain/Move";

describe("MoveUnitMove battle restrictions", () => {
    it("should mark unit to skip battle when moving 2 hexes", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from: HexCoord = {q: 1, r: 4};
        const to: HexCoord = {q: 3, r: 4}; // 2 hexes away

        gameState.placeUnit(from, unit);

        // Unit does not skip battle before moving
        expect(gameState.unitSkipsBattle(unit)).toBe(false);

        // Execute a 2-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should now skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(true);
        expect(gameState.getUnitAt(to)).toBe(unit);
    });

    it("should NOT mark unit to skip battle when moving 1 hex", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from: HexCoord = {q: 1, r: 4};
        const to: HexCoord = {q: 2, r: 4}; // 1 hex away

        gameState.placeUnit(from, unit);

        // Execute a 1-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should not skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(false);
        expect(gameState.getUnitAt(to)).toBe(unit);
    });

    it("should handle vertical 2-hex moves correctly", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from: HexCoord = {q: 0, r: 0};
        const to: HexCoord = {q: 0, r: 2}; // 2 hexes away vertically

        gameState.placeUnit(from, unit);

        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(true);
    });

    it("should handle diagonal 2-hex moves correctly", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from: HexCoord = {q: 0, r: 0};
        const to: HexCoord = {q: 1, r: 1}; // 2 hexes away diagonally

        gameState.placeUnit(from, unit);

        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(true);
    });
});
