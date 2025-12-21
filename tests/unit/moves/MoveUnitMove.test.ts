// ABOUTME: Unit tests for MoveUnitMove
// ABOUTME: Tests unit-specific battle restrictions after movement

import {describe, expect, it} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Infantry, Armor} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {hexOf} from "../../../src/utils/hex";
import {woodsTerrain} from "../../../src/domain/terrain/Terrain";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";

describe("MoveUnitMove battle restrictions", () => {
    it("should mark unit to skip battle when moving 2 hexes", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(3, 4); // 2 hexes away

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

        const from = hexOf(1, 4);
        const to = hexOf(2, 4); // 1 hex away

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

        const from = hexOf(0, 0);
        const to = hexOf(0, 2); // 2 hexes away vertically

        gameState.placeUnit(from, unit);

        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(true);
    });

    it("should mark unit to skip battle when entering woods", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(2, 4); // 1 hex away

        gameState.placeUnit(from, unit);
        gameState.setTerrain(to, woodsTerrain);

        // Execute a 1-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Unit should skip battle
        expect(gameState.unitSkipsBattle(unit)).toBe(true);
        expect(gameState.getUnitAt(to)).toBe(unit);
    });

    // Armor-specific movement tests
    it("should NOT mark armor to skip battle when moving 2 hexes", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const armor = new Armor(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(3, 4); // 2 hexes away

        gameState.placeUnit(from, armor);

        // Unit does not skip battle before moving
        expect(gameState.unitSkipsBattle(armor)).toBe(false);

        // Execute a 2-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Armor should NOT skip battle (unlike infantry)
        expect(gameState.unitSkipsBattle(armor)).toBe(false);
        expect(gameState.getUnitAt(to)).toBe(armor);
    });

    it("should NOT mark armor to skip battle when moving 3 hexes", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const armor = new Armor(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(4, 4); // 3 hexes away

        gameState.placeUnit(from, armor);

        // Execute a 3-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Armor should NOT skip battle
        expect(gameState.unitSkipsBattle(armor)).toBe(false);
        expect(gameState.getUnitAt(to)).toBe(armor);
    });

    it("should mark armor to skip battle when entering woods (terrain rule)", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const armor = new Armor(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(2, 4); // 1 hex away into woods

        gameState.placeUnit(from, armor);
        gameState.setTerrain(to, woodsTerrain);

        // Execute move into woods
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Armor should skip battle (terrain restriction applies to all unit types)
        expect(gameState.unitSkipsBattle(armor)).toBe(true);
        expect(gameState.getUnitAt(to)).toBe(armor);
    });

    it("should still mark infantry to skip battle when moving 2 hexes (regression)", () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const infantry = new Infantry(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(3, 4); // 2 hexes away

        gameState.placeUnit(from, infantry);

        // Execute a 2-hex move
        const move = new MoveUnitMove(from, to);
        move.execute(gameState);

        // Infantry should still skip battle
        expect(gameState.unitSkipsBattle(infantry)).toBe(true);
        expect(gameState.getUnitAt(to)).toBe(infantry);
    });

    it('undoes movement', () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(2, 4); // 1 hexes away

        gameState.placeUnit(from, unit);

        const move = new MoveUnitMove(from, to);
        const clonedState = gameState.clone();

        move.execute(gameState);
        move.undo(gameState);

        // Gamestate should be back as it was
        expect(gameState).toEqual(clonedState);
    });

    it('undoes skip battle', () => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);
        const unit = new Infantry(Side.ALLIES);

        const from = hexOf(1, 4);
        const to = hexOf(3, 4); // 2 hexes away

        gameState.placeUnit(from, unit);

        const move = new MoveUnitMove(from, to);
        const clonedState = gameState.clone();

        move.execute(gameState);
        move.undo(gameState);

        // Gamestate should be back as it was
        expect(gameState).toEqual(clonedState);
    });

});
