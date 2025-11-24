// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import {describe, it, expect} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Side} from "../../src/domain/Player";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {AssaultLeft} from "../../src/domain/CommandCard";
import {CardLocation} from "../../src/domain/CommandCard";
import {HexCoord} from "../../src/utils/hex";

describe("Ordering Units with Command Cards", () => {
    describe("Assault Left card", () => {
        it("should order all units in the bottom player's left section when Assault Left is played", () => {
            const card = new AssaultLeft();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place units in different sections for bottom player (Allies)
            // Bottom player's left section
            const leftUnit1 = new Infantry(Side.ALLIES);
            const leftUnit2 = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(-2, 7), leftUnit1);
            gameState.placeUnit(new HexCoord(-1, 7), leftUnit2);

            // This hex is both left and right
            const straddlingUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(0, 7), straddlingUnit);

            // Center section
            const centerUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(2, 7), centerUnit);

            // Right section: q = 9-12
            const rightUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(7, 7), rightUnit);

            // Initially, no units should be ordered
            expect(gameState.getOrderedUnits()).toEqual([]);

            // Act: Play the Assault Left card (set it as current card)
            card.onCardPlayed(gameState);

            // Assert: Only left section units should be ordered
            expect(gameState.getOrderedUnits()).toEqual([leftUnit1, leftUnit2, straddlingUnit]);
        });

        it("should order all units in the top player's left section when Assault Left is played", () => {
            const card = new AssaultLeft();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.TOP_PLAYER_HAND);
            gameState.switchActivePlayer(); // Top player active

            // Place units in different sections for top player (Axis)
            // Top player's left section is FLIPPED: screen-right
            const leftUnit1 = new Infantry(Side.AXIS);
            const leftUnit2 = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(9, 1), leftUnit1);
            gameState.placeUnit(new HexCoord(10, 1), leftUnit2);

            // Center section
            const centerUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(6, 1), centerUnit);

            // Right section for top player: screen-left
            const rightUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(2, 1), rightUnit);

            // Initially, no units should be ordered
            expect(gameState.getOrderedUnits()).toEqual([]);

            // Act: Play the Assault Left card
            card.onCardPlayed(gameState);

            // Assert: Only left section units (q: 9-12 for top player) should be ordered
            expect(gameState.getOrderedUnits()).toEqual([leftUnit1, leftUnit2]);
        });

        it("should not order enemy units when Assault Left is played", () => {
            const card = new AssaultLeft();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place friendly unit in left section
            const friendlyUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(-1, 7), friendlyUnit);

            // Place enemy unit in left section (same q range)
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(1, 1), enemyUnit);

            card.onCardPlayed(gameState);

            // Only friendly unit should be ordered
            expect(gameState.isUnitOrdered(friendlyUnit)).toBe(true);
            expect(gameState.isUnitOrdered(enemyUnit)).toBe(false);
        });
    });
});
