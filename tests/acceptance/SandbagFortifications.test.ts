// ABOUTME: Acceptance tests for sandbag fortifications
// ABOUTME: Tests fortification effects on combat and removal on unit movement/retreat

import {describe, expect, test} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {HexCoord} from "../../src/utils/hex";
import {Infantry, Armor} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {clearTerrain, woodsTerrain, Terrain} from "../../src/domain/terrain/Terrain";
import {calculateDiceCount} from "../../src/rules/combat";
import {sandbagsFortification, Fortification, noFortification} from "../../src/domain/fortification/Fortification";

describe("Sandbag Fortifications", () => {
    describe("Fortification data structure", () => {
        test("stores fortification at specific hex coordinates", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            gameState.setFortification(new HexCoord(3, 4), sandbagsFortification);
            gameState.setFortification(new HexCoord(-2, 5), sandbagsFortification);

            expect(gameState.getFortification(new HexCoord(3, 4))).toBe(sandbagsFortification);
            expect(gameState.getFortification(new HexCoord(-2, 5))).toBe(sandbagsFortification);
        });

        test("returns noFortification for hexes without fortification", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            expect(gameState.getFortification(new HexCoord(0, 0))).toBe(noFortification);
        });
    });

    describe("Combat with sandbags", () => {
        const infantry = new Infantry(Side.ALLIES);
        const armor = new Armor(Side.ALLIES);

        interface CombatTestCase {
            name: string;
            attacker: Infantry | Armor;
            distance: number;
            defenderTerrain: Terrain;
            defenderFortification: Fortification;
            expectedDice: number;
        }

        const testCases: CombatTestCase[] = [
            // Infantry attacking sandbags on clear terrain
            {
                name: "infantry at distance 1 vs sandbags on clear",
                attacker: infantry,
                distance: 1,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 2, // 3 - 1 (sandbags)
            },
            {
                name: "infantry at distance 2 vs sandbags on clear",
                attacker: infantry,
                distance: 2,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 1, // 2 - 1 (sandbags)
            },
            {
                name: "infantry at distance 3 vs sandbags on clear",
                attacker: infantry,
                distance: 3,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 0, // 1 - 1 (sandbags)
            },

            // Armor attacking sandbags on clear terrain
            {
                name: "armor at distance 1 vs sandbags on clear",
                attacker: armor,
                distance: 1,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 2, // 3 - 1 (sandbags)
            },
            {
                name: "armor at distance 2 vs sandbags on clear",
                attacker: armor,
                distance: 2,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 2, // 3 - 1 (sandbags)
            },
            {
                name: "armor at distance 3 vs sandbags on clear",
                attacker: armor,
                distance: 3,
                defenderTerrain: clearTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 2, // 3 - 1 (sandbags)
            },

            // Non-cumulative with terrain: max(terrain, fortification) reduction
            // Infantry attacking woods with sandbags
            {
                name: "infantry at distance 1 vs woods with sandbags - max reduction",
                attacker: infantry,
                distance: 1,
                defenderTerrain: woodsTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 2, // 3 - 1 (max of woods:-1, sandbags:-1)
            },

            // Armor attacking woods with sandbags
            {
                name: "armor at distance 1 vs woods with sandbags - terrain wins",
                attacker: armor,
                distance: 1,
                defenderTerrain: woodsTerrain,
                defenderFortification: sandbagsFortification,
                expectedDice: 1, // 3 - 2 (max of woods:-2, sandbags:-1)
            },
        ];

        test.each(testCases)('$name', ({attacker, distance, defenderTerrain, defenderFortification, expectedDice}) => {
            const dice = calculateDiceCount(attacker, clearTerrain, distance, defenderTerrain, defenderFortification);
            expect(dice).toBe(expectedDice);
        });
    });

    describe("Fortification removal on unit movement", () => {
        test("sandbags are removed when unit moves away", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const from = new HexCoord(5, 4);
            const to = new HexCoord(6, 4);
            const unit = new Infantry(Side.ALLIES);

            // Setup: place unit with sandbags
            gameState.setFortification(from, sandbagsFortification);
            gameState.placeUnit(from, unit);
            gameState.finishSetup();

            // Verify sandbags are present before move
            expect(gameState.getFortification(from)).toBe(sandbagsFortification);

            // Execute move
            gameState.moveUnit(from, to);

            // Verify sandbags are removed from original hex
            expect(gameState.getFortification(from)).toBe(noFortification);
            // Verify sandbags are not at destination
            expect(gameState.getFortification(to)).toBe(noFortification);
        });

        test("sandbags remain when unit doesn't move (stays in place)", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const hex = new HexCoord(5, 4);
            const unit = new Infantry(Side.ALLIES);

            // Setup: place unit with sandbags
            gameState.setFortification(hex, sandbagsFortification);
            gameState.placeUnit(hex, unit);
            gameState.finishSetup();

            // Verify sandbags are present
            expect(gameState.getFortification(hex)).toBe(sandbagsFortification);

            // Unit stays in place (no-op move)
            // (This doesn't actually call moveUnit since distance is 0)

            // Sandbags should still be present
            expect(gameState.getFortification(hex)).toBe(sandbagsFortification);
        });
    });

    describe("Fortification removal on unit retreat", () => {
        test("sandbags are removed when unit retreats", () => {
            const deck = Deck.createStandardDeck();
            const gameState = new GameState(deck);

            const from = new HexCoord(5, 4);
            const to = new HexCoord(6, 5);
            const unit = new Infantry(Side.ALLIES);

            // Setup: place unit with sandbags
            gameState.setFortification(from, sandbagsFortification);
            gameState.placeUnit(from, unit);
            gameState.finishSetup();

            // Verify sandbags are present before retreat
            expect(gameState.getFortification(from)).toBe(sandbagsFortification);

            // Execute retreat (uses moveUnit internally)
            gameState.moveUnit(from, to);

            // Verify sandbags are removed from original hex
            expect(gameState.getFortification(from)).toBe(noFortification);
            // Verify sandbags are not at destination
            expect(gameState.getFortification(to)).toBe(noFortification);
        });
    });
});
