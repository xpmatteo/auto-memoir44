// ABOUTME: Acceptance tests for flexible ordering command cards (Direct from HQ, Move Out!, Firefight)
// ABOUTME: Tests ordering units by predicate rather than section-based restrictions

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Side} from "../../src/domain/Player";
import {Deck} from "../../src/domain/Deck";
import {Armor, Infantry} from "../../src/domain/Unit";
import {CardLocation, DirectFromHQ, MoveOut, Firefight} from "../../src/domain/CommandCard";
import {HexCoord} from "../../src/utils/hex";
import {ConfirmOrdersMove, OrderUnitMove, PlayCardMove, UnOrderMove} from "../../src/domain/moves/Move";
import {toStringAndSort} from "../helpers/testHelpers";

describe("Flexible Ordering Command Cards", () => {
    const leftInf1 = new Infantry(Side.ALLIES);
    const leftInf2 = new Infantry(Side.ALLIES);
    const centerInf1 = new Infantry(Side.ALLIES);
    const centerInf2 = new Infantry(Side.ALLIES);
    const centerArmor = new Armor(Side.ALLIES);
    const rightInf1 = new Infantry(Side.ALLIES);
    const rightInf2 = new Infantry(Side.ALLIES);
    const rightArmor = new Armor(Side.ALLIES);

    const enemyInf = new Infantry(Side.AXIS);
    const enemyArmor = new Armor(Side.AXIS);

    function placeUnitsAcrossBoard(gameState: GameState) {
        // Left section
        gameState.placeUnit(new HexCoord(1, 1), leftInf1);
        gameState.placeUnit(new HexCoord(2, 1), leftInf2);

        // Center section
        gameState.placeUnit(new HexCoord(5, 1), centerInf1);
        gameState.placeUnit(new HexCoord(6, 1), centerInf2);
        gameState.placeUnit(new HexCoord(4, 1), centerArmor);

        // Right section
        gameState.placeUnit(new HexCoord(9, 1), rightInf1);
        gameState.placeUnit(new HexCoord(10, 1), rightInf2);
        gameState.placeUnit(new HexCoord(11, 1), rightArmor);

        // Enemy units
        gameState.placeUnit(new HexCoord(5, 0), enemyInf);
        gameState.placeUnit(new HexCoord(6, 0), enemyArmor);
    }

    describe("Direct from HQ card", () => {
        const card = new DirectFromHQ();

        it("should allow ordering any 4 units from anywhere on the board", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitsAcrossBoard(gameState);

            // Play the card
            gameState.executeMove(new PlayCardMove(card));

            // Should be able to order any of the 8 friendly units
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                new OrderUnitMove(leftInf2),
                new OrderUnitMove(centerInf1),
                new OrderUnitMove(centerInf2),
                new OrderUnitMove(centerArmor),
                new OrderUnitMove(rightInf1),
                new OrderUnitMove(rightInf2),
                new OrderUnitMove(rightArmor),
            ]));
        });

        it("should enforce a total limit of 4 units across all sections", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitsAcrossBoard(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 1 unit from left
            gameState.executeMove(new OrderUnitMove(leftInf1));

            // Still able to order any remaining units
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftInf1),
                new OrderUnitMove(leftInf2),
                new OrderUnitMove(centerInf1),
                new OrderUnitMove(centerInf2),
                new OrderUnitMove(centerArmor),
                new OrderUnitMove(rightInf1),
                new OrderUnitMove(rightInf2),
                new OrderUnitMove(rightArmor),
            ]));

            // Order 3 more units from different sections
            gameState.executeMove(new OrderUnitMove(centerInf1));
            gameState.executeMove(new OrderUnitMove(centerArmor));
            gameState.executeMove(new OrderUnitMove(rightInf1));

            // At limit - can only unorder or confirm
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftInf1),
                new UnOrderMove(centerInf1),
                new UnOrderMove(centerArmor),
                new UnOrderMove(rightInf1),
            ]));
        });

        it("should allow mixing infantry and armor freely", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitsAcrossBoard(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 2 infantry and 2 armor
            gameState.executeMove(new OrderUnitMove(leftInf1));
            gameState.executeMove(new OrderUnitMove(centerArmor));
            gameState.executeMove(new OrderUnitMove(rightInf2));
            gameState.executeMove(new OrderUnitMove(rightArmor));

            // At limit - should have 2 infantry and 2 armor ordered
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftInf1),
                new UnOrderMove(centerArmor),
                new UnOrderMove(rightInf2),
                new UnOrderMove(rightArmor),
            ]));
        });
    });

    describe("Move Out! card", () => {
        const card = new MoveOut();

        it("should allow ordering only infantry units, up to 4 total", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitsAcrossBoard(gameState);

            // Play the card
            gameState.executeMove(new PlayCardMove(card));

            // Should only be able to order infantry units (6 total), not armor
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                new OrderUnitMove(leftInf2),
                new OrderUnitMove(centerInf1),
                new OrderUnitMove(centerInf2),
                new OrderUnitMove(rightInf1),
                new OrderUnitMove(rightInf2),
                // centerArmor and rightArmor should NOT be in the list
            ]));
        });

        it("should enforce a total limit of 4 infantry units", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnitsAcrossBoard(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 4 infantry units
            gameState.executeMove(new OrderUnitMove(leftInf1));
            gameState.executeMove(new OrderUnitMove(leftInf2));
            gameState.executeMove(new OrderUnitMove(centerInf1));
            gameState.executeMove(new OrderUnitMove(rightInf1));

            // At limit - can only unorder or confirm
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftInf1),
                new UnOrderMove(leftInf2),
                new UnOrderMove(centerInf1),
                new UnOrderMove(rightInf1),
            ]));
        });

        it("should work correctly when there are fewer than 4 infantry units", () => {
            const card = new MoveOut();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Only place 2 infantry units
            gameState.placeUnit(new HexCoord(1, 1), leftInf1);
            gameState.placeUnit(new HexCoord(5, 1), centerArmor);

            gameState.executeMove(new PlayCardMove(card));

            // Should only see the one infantry unit as orderable
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                // centerArmor should NOT be orderable
            ]));
        });
    });

    describe("Firefight card", () => {
        const card = new Firefight();

        it("should allow ordering units not adjacent to enemies", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place friendly units in back row (not adjacent to enemies)
            gameState.placeUnit(new HexCoord(1, 2), leftInf1);
            gameState.placeUnit(new HexCoord(5, 2), centerInf1);
            gameState.placeUnit(new HexCoord(9, 2), rightInf1);

            // Place friendly unit in close combat with enemy
            gameState.placeUnit(new HexCoord(3, 1), leftInf2);

            // Place enemy unit adjacent to leftInf2
            gameState.placeUnit(new HexCoord(4, 1), enemyInf);

            // Play the card
            gameState.executeMove(new PlayCardMove(card));

            // Only units NOT adjacent to enemies should be orderable
            // leftInf2 is adjacent to enemyInf, so it should NOT be orderable
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                new OrderUnitMove(centerInf1),
                new OrderUnitMove(rightInf1),
                // leftInf2 should NOT be orderable (adjacent to enemy)
            ]));
        });

        it("should exclude units in close combat from ordering", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place friendly units adjacent to enemies (close combat)
            gameState.placeUnit(new HexCoord(5, 2), centerInf1);
            gameState.placeUnit(new HexCoord(6, 2), centerInf2);

            // Place enemy units adjacent to friendlies
            gameState.placeUnit(new HexCoord(5, 1), enemyInf);  // Adjacent to centerInf1
            gameState.placeUnit(new HexCoord(6, 3), enemyArmor); // Adjacent to centerInf2

            // Place one friendly unit far from enemies
            gameState.placeUnit(new HexCoord(9, 5), rightInf1);

            gameState.executeMove(new PlayCardMove(card));

            // Only the unit far from enemies should be orderable
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(rightInf1),
                // centerInf1 and centerInf2 should NOT be orderable
            ]));
        });

        it("should enforce a total limit of 4 units", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place 5 friendly units, all far from enemies
            const inf3 = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(1, 5), leftInf1);
            gameState.placeUnit(new HexCoord(2, 5), leftInf2);
            gameState.placeUnit(new HexCoord(5, 5), centerInf1);
            gameState.placeUnit(new HexCoord(6, 5), centerInf2);
            gameState.placeUnit(new HexCoord(9, 5), inf3);

            // Place enemy far away (not adjacent to any friendly)
            gameState.placeUnit(new HexCoord(5, 0), enemyInf);

            gameState.executeMove(new PlayCardMove(card));

            // All 5 units should be eligible initially
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                new OrderUnitMove(leftInf2),
                new OrderUnitMove(centerInf1),
                new OrderUnitMove(centerInf2),
                new OrderUnitMove(inf3),
            ]));

            // Order 4 units
            gameState.executeMove(new OrderUnitMove(leftInf1));
            gameState.executeMove(new OrderUnitMove(leftInf2));
            gameState.executeMove(new OrderUnitMove(centerInf1));
            gameState.executeMove(new OrderUnitMove(centerInf2));

            // At limit - can only unorder or confirm
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftInf1),
                new UnOrderMove(leftInf2),
                new UnOrderMove(centerInf1),
                new UnOrderMove(centerInf2),
            ]));
        });

        it("should work with both infantry and armor units", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place mixed unit types, all far from enemies
            gameState.placeUnit(new HexCoord(1, 5), leftInf1);
            gameState.placeUnit(new HexCoord(5, 5), centerArmor);
            gameState.placeUnit(new HexCoord(9, 5), rightInf1);

            // Place enemy far away
            gameState.placeUnit(new HexCoord(5, 0), enemyInf);

            gameState.executeMove(new PlayCardMove(card));

            // All units should be orderable regardless of type
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftInf1),
                new OrderUnitMove(centerArmor),
                new OrderUnitMove(rightInf1),
            ]));
        });

        it("should handle edge case when all units are in close combat", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place all friendly units adjacent to enemies
            gameState.placeUnit(new HexCoord(5, 2), centerInf1);
            gameState.placeUnit(new HexCoord(6, 2), centerInf2);

            // Place enemy units adjacent to all friendlies
            gameState.placeUnit(new HexCoord(5, 1), enemyInf);
            gameState.placeUnit(new HexCoord(6, 3), enemyArmor);

            gameState.executeMove(new PlayCardMove(card));

            // No units should be orderable (only ConfirmOrders available)
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
            ]));
        });

        it("should check all six hex directions for adjacency", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place friendly unit in center
            gameState.placeUnit(new HexCoord(5, 4), centerInf1);

            // Place enemy in one of the six adjacent hexes (northeast)
            gameState.placeUnit(new HexCoord(6, 3), enemyInf);

            // Place friendly unit far away
            gameState.placeUnit(new HexCoord(9, 5), rightInf1);

            gameState.executeMove(new PlayCardMove(card));

            // centerInf1 should NOT be orderable (enemy is adjacent)
            // rightInf1 should be orderable
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(rightInf1),
            ]));
        });
    });
});
