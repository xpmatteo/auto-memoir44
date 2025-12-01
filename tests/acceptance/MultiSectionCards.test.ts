// ABOUTME: Acceptance tests for multi-section command cards
// ABOUTME: Tests ordering units from multiple sections with cards like Pincer Move and Recon In Force

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Side} from "../../src/domain/Player";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {CardLocation, PincerMove, ReconInForce} from "../../src/domain/CommandCard";
import {HexCoord} from "../../src/utils/hex";
import {ConfirmOrdersMove, Move, OrderUnitMove, PlayCardMove, UnOrderMove} from "../../src/domain/Move";

function sortMoves(moves: Move[]): string[] {
    return moves.map(move => move.toString()).sort();
}

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
        gameState.placeUnit(new HexCoord(1, 1), leftUnit1);
        gameState.placeUnit(new HexCoord(2, 1), leftUnit2);
        gameState.placeUnit(new HexCoord(3, 1), leftCenterUnit);
        gameState.placeUnit(new HexCoord(0, 0), leftEnemyUnit);

        gameState.placeUnit(new HexCoord(4, 1), centerUnit1);
        gameState.placeUnit(new HexCoord(5, 1), centerUnit2);
        gameState.placeUnit(new HexCoord(6, 1), centerUnit3);
        gameState.placeUnit(new HexCoord(5, 0), centerEnemyUnit);

        gameState.placeUnit(new HexCoord(8, 1), centerRightUnit);
        gameState.placeUnit(new HexCoord(9, 1), rightUnit2);
        gameState.placeUnit(new HexCoord(10, 1), rightUnit3);
        gameState.placeUnit(new HexCoord(12, 0), rightEnemyUnit);
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

            expect(sortMoves(gameState.legalMoves())).toEqual(sortMoves([
                new ConfirmOrdersMove(),
                new OrderUnitMove(leftUnit1),
                new OrderUnitMove(leftUnit2),
                new OrderUnitMove(leftCenterUnit),
                new OrderUnitMove(centerRightUnit),
                new OrderUnitMove(rightUnit2),
                new OrderUnitMove(rightUnit3),
            ]));
        });

        it("should enforce limit of 2 units total across both sections", () => {
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            placeUnits(gameState);
            gameState.executeMove(new PlayCardMove(card));

            // Order 1 unit from LEFT
            gameState.executeMove(new OrderUnitMove(leftUnit1));

            expect(sortMoves(gameState.legalMoves())).toEqual(sortMoves([
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
            expect(sortMoves(gameState.legalMoves())).toEqual(sortMoves([
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

            expect(sortMoves(gameState.legalMoves())).toEqual(sortMoves([
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

        it.skip("should enforce limit of 1 unit total across all sections", () => {
            const card = new ReconInForce();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Place units in all sections
            const leftUnit = new Infantry(Side.ALLIES);
            const centerUnit = new Infantry(Side.ALLIES);
            const rightUnit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(1, 7), leftUnit);
            gameState.placeUnit(new HexCoord(6, 7), centerUnit);
            gameState.placeUnit(new HexCoord(9, 7), rightUnit);

            // Play the card
            const playCardMove = gameState.legalMoves().find(
                move => move.toString().includes("Play Card: Recon In Force")
            );
            gameState.executeMove(playCardMove!);

            // Order 1 unit from center
            const orderCenter = gameState.legalMoves().find(
                move => move instanceof OrderUnitMove && move.unit === centerUnit
            ) as OrderUnitMove;
            gameState.executeMove(orderCenter);

            // Should NOT be able to order any more units
            const legalMoves = gameState.legalMoves();
            const canOrderMore = legalMoves.some(move => move instanceof OrderUnitMove);
            expect(canOrderMore).toBe(false);

            // Should have ConfirmOrdersMove and UnOrderMove
            const confirmMove = legalMoves.find(move => move instanceof ConfirmOrdersMove);
            const unorderMove = legalMoves.find(
                move => move instanceof UnOrderMove && move.unit === centerUnit
            );
            expect(confirmMove).toBeDefined();
            expect(unorderMove).toBeDefined();
        });

        it.skip("should work correctly for top player with flipped perspective", () => {
            const card = new ReconInForce();
            const deck = new Deck([card]);
            const gameState = new GameState(deck);
            gameState.drawCards(1, CardLocation.TOP_PLAYER_HAND);
            gameState.switchActivePlayer(); // Top player active

            // Place units in all three sections for top player
            // Top player's LEFT is screen-right (q: 9-12)
            const leftUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(10, 1), leftUnit);

            // CENTER (q: 5-8)
            const centerUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(6, 1), centerUnit);

            // RIGHT is screen-left (q: 0-4)
            const rightUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(2, 1), rightUnit);

            // Play the card
            const playCardMove = gameState.legalMoves().find(
                move => move.toString().includes("Play Card: Recon In Force")
            );
            gameState.executeMove(playCardMove!);

            // Should be able to order any of the three units
            const legalMoves = gameState.legalMoves();
            const canOrderLeft = legalMoves.some(
                move => move instanceof OrderUnitMove && move.unit === leftUnit
            );
            const canOrderCenter = legalMoves.some(
                move => move instanceof OrderUnitMove && move.unit === centerUnit
            );
            const canOrderRight = legalMoves.some(
                move => move instanceof OrderUnitMove && move.unit === rightUnit
            );

            expect(canOrderLeft).toBe(true);
            expect(canOrderCenter).toBe(true);
            expect(canOrderRight).toBe(true);
        });
    });
});
