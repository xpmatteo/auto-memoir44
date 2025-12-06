// ABOUTME: Acceptance tests for GameState.clone() method
// ABOUTME: Tests AI lookahead simulation without affecting original game state

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {AssaultLeft, CardLocation} from "../../src/domain/CommandCard";
import {PlayCardMove} from "../../src/domain/moves/Move";
import {Infantry} from "../../src/domain/Unit";
import {HexCoord} from "../../src/utils/hex";
import {Side} from "../../src/domain/Player";

describe("GameState cloning for AI simulation", () => {
    it("AI can simulate moves without affecting actual game", () => {
        const gameState = createTestGameState();
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        const cards = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND);

        // Clone for simulation
        const simulation = gameState.clone();

        // Execute moves on simulation
        simulation.executeMove(new PlayCardMove(cards[0]));

        // Original should be unchanged
        expect(gameState.activeCard).toBeNull();
        expect(gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(3);

        // Simulation should have changed
        expect(simulation.activeCard).not.toBeNull();
        expect(simulation.activeCard).toEqual(cards[0]);
    });

    it("Clones all the state", () => {
        const gameState = createTestGameState();
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const clone = gameState.clone();

        expect(clone).toEqual(gameState);
    });

    it("Clone can draw cards independently from original", () => {
        const gameState = createTestGameState();

        const simulation = gameState.clone();

        // Draw cards on simulation
        simulation.drawCards(2, CardLocation.BOTTOM_PLAYER_HAND);

        // Original should be unchanged
        expect(gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(0);
        expect(gameState.getCardsInLocation(CardLocation.DECK).length).toBeGreaterThan(0);

        // Simulation should have cards
        expect(simulation.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(2);
    });

    it("Clone preserves unit positions", () => {
        const gameState = createTestGameState();
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(0, 0);
        gameState.placeUnit(coord, unit);

        const simulation = gameState.clone();

        // Both should have the unit at the same position
        expect(gameState.getUnitAt(coord)).toBe(unit);
        expect(simulation.getUnitAt(coord)).toBe(unit);
    });

    it("Modifying clone unit state doesn't affect original", () => {
        const gameState = createTestGameState();
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(0, 0);
        gameState.placeUnit(coord, unit);

        const simulation = gameState.clone();

        // Modify unit state on simulation
        simulation.toggleUnitOrdered(unit);

        // Original should be unchanged
        expect(gameState.isUnitOrdered(unit)).toBe(false);

        // Simulation should have changed
        expect(simulation.isUnitOrdered(unit)).toBe(true);
    });

    it("Modifying clone unit strength doesn't affect original", () => {
        const gameState = createTestGameState();
        const unit = new Infantry(Side.ALLIES, 4);
        const coord = new HexCoord(0, 0);
        gameState.placeUnit(coord, unit);

        const simulation = gameState.clone();

        // Damage unit on simulation
        simulation.setUnitCurrentStrength(unit, 2);

        // Original should be unchanged
        expect(gameState.getUnitCurrentStrength(unit)).toBe(4);

        // Simulation should have changed
        expect(simulation.getUnitCurrentStrength(unit)).toBe(2);
    });

    it("Moving units on clone doesn't affect original", () => {
        const gameState = createTestGameState();
        const unit = new Infantry(Side.ALLIES);
        const from = new HexCoord(0, 0);
        const to = new HexCoord(1, 0);
        gameState.placeUnit(from, unit);

        const simulation = gameState.clone();

        // Move unit on simulation
        simulation.moveUnit(from, to);

        // Original should be unchanged
        expect(gameState.getUnitAt(from)).toBe(unit);
        expect(gameState.getUnitAt(to)).toBeUndefined();

        // Simulation should have changed
        expect(simulation.getUnitAt(from)).toBeUndefined();
        expect(simulation.getUnitAt(to)).toBe(unit);
    });

    it("Adding medals to clone doesn't affect original", () => {
        const gameState = createTestGameState();
        const unit = new Infantry(Side.ALLIES);
        const coord = new HexCoord(0, 0);
        gameState.placeUnit(coord, unit);

        const simulation = gameState.clone();

        // Add medal on simulation
        simulation.addToMedalTable(unit, 1);

        // Original should be unchanged
        expect(gameState.getMedalTable(1)).toHaveLength(0);

        // Simulation should have changed
        expect(simulation.getMedalTable(1)).toHaveLength(1);
        expect(simulation.getMedalTable(1)[0]).toBe(unit);
    });
});

function createTestGameState(): GameState {
    const cards = [
        new AssaultLeft(),
        new AssaultLeft(),
        new AssaultLeft(),
    ];
    const deck = new Deck(cards);
    return new GameState(deck);
}
