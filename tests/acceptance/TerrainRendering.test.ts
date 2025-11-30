// ABOUTME: Acceptance tests for rendering terrain features on the game board
// ABOUTME: Tests that terrain images appear at correct hex coordinates

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {HexCoord} from "../../src/utils/hex";
import {hillTerrain, woodsTerrain, town1Terrain, clearTerrain} from "../../src/domain/terrain/Terrain";
import {ST02Scenario} from "../../src/scenarios/ST02";

describe("Terrain Rendering", () => {
    describe("Terrain data structure", () => {
        it("stores terrain at specific hex coordinates", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            gameState.setTerrain(new HexCoord(3, 4), hillTerrain);
            gameState.setTerrain(new HexCoord(-2, 5), woodsTerrain);

            expect(gameState.getTerrain(new HexCoord(3, 4))).toBe(hillTerrain);
            expect(gameState.getTerrain(new HexCoord(-2, 5))).toBe(woodsTerrain);
        });

        it("returns clearTerrain for hexes without terrain", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.getTerrain(new HexCoord(0, 0))).toBe(clearTerrain);
        });

        it("iterates through all terrain using forAllTerrain", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            gameState.setTerrain(new HexCoord(1, 2), hillTerrain);
            gameState.setTerrain(new HexCoord(3, 4), woodsTerrain);
            gameState.setTerrain(new HexCoord(5, 6), town1Terrain);

            const foundTerrain: Array<{hex: HexCoord; terrain: any}> = [];
            gameState.forAllTerrain((terrain, hex) => {
                foundTerrain.push({hex, terrain});
            });

            expect(foundTerrain.length).toBe(3);
            expect(foundTerrain.some(t => t.hex.q === 1 && t.hex.r === 2)).toBe(true);
            expect(foundTerrain.some(t => t.hex.q === 3 && t.hex.r === 4)).toBe(true);
            expect(foundTerrain.some(t => t.hex.q === 5 && t.hex.r === 6)).toBe(true);
        });
    });

    describe("Terrain image paths", () => {
        it("hillTerrain has correct image path", () => {
            expect(hillTerrain.imagePath).toBe("images/terrain/hill.png");
        });

        it("woodsTerrain has correct image path", () => {
            expect(woodsTerrain.imagePath).toBe("images/terrain/woods.png");
        });

        it("town variants have correct image paths", () => {
            expect(town1Terrain.imagePath).toBe("images/terrain/town.png");
        });

        it("clearTerrain has no image path", () => {
            expect(clearTerrain.imagePath).toBeUndefined();
        });
    });

    describe("ST02 scenario terrain setup", () => {
        it("places hillTerrain at HexCoord(-1, 5)", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const scenario = new ST02Scenario();
            scenario.setup(gameState);

            expect(gameState.getTerrain(new HexCoord(-1, 5))).toBe(hillTerrain);
        });

        it("places woodsTerrain at HexCoord(3, 0)", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const scenario = new ST02Scenario();
            scenario.setup(gameState);

            expect(gameState.getTerrain(new HexCoord(3, 0))).toBe(woodsTerrain);
        });
    });
});
