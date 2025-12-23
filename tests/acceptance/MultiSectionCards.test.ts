// ABOUTME: Acceptance tests for multi-section command cards
// ABOUTME: Tests ordering units from multiple sections with cards like Pincer Move and Recon In Force

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Side} from "../../src/domain/Player";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {CardLocation} from "../../src/domain/cards/CommandCard";
import {PincerMove, ReconInForce} from "../../src/domain/cards/SectionCards";
import {hexOf} from "../../src/utils/hex";
import {ConfirmOrdersMove, OrderUnitMove, PlayCardMove, UnOrderMove} from "../../src/domain/moves/Move";
import {toStringAndSort} from "../helpers/testHelpers";

describe("Multi-Section Command Cards", () => {
    const leftUnit1 = new Infantry(Side.ALLIES);
    const leftUnit2 = new Infantry(Side.ALLIES);
    const leftCenterUnit = new Infantry(Side.ALLIES);
    const leftEnemyUnit = new Infantry(Side.AXIS);

    const centerUnit1 = new Infantry(Side.ALLIES);
    const centerUnit2 = new Infantry(Side.ALLIES);
    const centerUnit3 = new Infantry(Side.ALLIES);
    const centerEnemyUnit = new Infantry(Side.AXIS);

    const centerRightUnit = new Infantry(Side.ALLIES);
    const rightUnit2 = new Infantry(Side.ALLIES);
    const rightUnit3 = new Infantry(Side.ALLIES);
    const rightEnemyUnit = new Infantry(Side.AXIS);

    function placeUnits(gameState: GameState) {
        gameState.placeUnit(hexOf(1, 1), leftUnit1);
        gameState.placeUnit(hexOf(2, 1), leftUnit2);
        gameState.placeUnit(hexOf(3, 1), leftCenterUnit);
        gameState.placeUnit(hexOf(0, 0), leftEnemyUnit);

        gameState.placeUnit(hexOf(4, 1), centerUnit1);
        gameState.placeUnit(hexOf(5, 1), centerUnit2);
        gameState.placeUnit(hexOf(6, 1), centerUnit3);
        gameState.placeUnit(hexOf(5, 0), centerEnemyUnit);

        gameState.placeUnit(hexOf(8, 1), centerRightUnit);
        gameState.placeUnit(hexOf(9, 1), rightUnit2);
        gameState.placeUnit(hexOf(10, 1), rightUnit3);
        gameState.placeUnit(hexOf(12, 0), rightEnemyUnit);
    }

    describe("Pincer Move card", () => {
        const card = new PincerMove();

        it("should allow ordering 2 units total from LEFT and RIGHT sections", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);

            // Play the card
            gameState.executeMove(new PlayCardMove(card));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftUnit1),
                new OrderUnitMove(leftUnit2),
                new OrderUnitMove(leftCenterUnit),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));
        });

        it("should enforce limit of 2 units for each section", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 1 unit from LEFT
            gameState.executeMove(new OrderUnitMove(leftUnit1));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftUnit1),
                new OrderUnitMove(leftUnit2),
                new OrderUnitMove(leftCenterUnit),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));

            // Order 2 units from LEFT
            gameState.executeMove(new OrderUnitMove(leftUnit2));

            // can no longer order the third unit in the left
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftUnit1),
                new UnOrderMove(leftUnit2),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));
        });
    });

    describe("Recon In Force card", () => {
        const card = new ReconInForce();

        it("should allow ordering 1 unit total from any of the three sections", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);

            gameState.executeMove(new PlayCardMove(card));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftUnit1),
                new OrderUnitMove(leftUnit2),
                new OrderUnitMove(leftCenterUnit),
                new OrderUnitMove(centerUnit1),
                new OrderUnitMove(centerUnit2),
                new OrderUnitMove(centerUnit3),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));
        });

        it("should enforce limit of 1 units for each section", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 1 unit from LEFT
            gameState.executeMove(new OrderUnitMove(leftUnit1));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftUnit1),
                new OrderUnitMove(leftCenterUnit), // still orderable because it straddles left and center sections
                new OrderUnitMove(centerUnit1),
                new OrderUnitMove(centerUnit2),
                new OrderUnitMove(centerUnit3),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));

            // Order 1 units from CENTER
            gameState.executeMove(new OrderUnitMove(leftCenterUnit));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftUnit1),
                new UnOrderMove(leftCenterUnit),
                new OrderUnitMove(centerRightUnit), // still orderable because it straddles center and right sections
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));

            // Order 1 units from RIGHT
            gameState.executeMove(new OrderUnitMove(rightUnit2));

            // At limit in all sections; we can only unorder now
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftUnit1),
                new UnOrderMove(leftCenterUnit),
                new UnOrderMove(rightUnit2),
            ]));
        });

        it("order straddling unit first", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 1 unit from LEFT CENTER
            gameState.executeMove(new OrderUnitMove(leftCenterUnit));

            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftUnit1),
                new OrderUnitMove(leftUnit2),
                new UnOrderMove(leftCenterUnit),
                new OrderUnitMove(centerUnit1),
                new OrderUnitMove(centerUnit2),
                new OrderUnitMove(centerUnit3),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));

            // Order 1 units from CENTER
            gameState.executeMove(new OrderUnitMove(centerUnit1));

            // Now we can only order units on the right
            expect(toStringAndSort(gameState.legalMoves())).toEqual(toStringAndSort([
                new ConfirmOrdersMove(),
                new UnOrderMove(leftCenterUnit),
                new UnOrderMove(centerUnit1),
                new OrderUnitMove(centerRightUnit), // still orderable because it straddles center and right sections
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));
        });

    });
});
