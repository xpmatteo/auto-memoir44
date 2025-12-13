// ABOUTME: Acceptance tests for canvas click interactions
// ABOUTME: Tests user clicking on units to order/unorder them

import {describe, it, expect, beforeEach} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {ProbeLeft, CardLocation} from "../../src/domain/cards/CommandCard";
import {Move, PlayCardMove, OrderUnitMove, UnOrderMove} from "../../src/domain/moves/Move";
import {HexCoord} from "../../src/utils/hex";

describe("Canvas Interactions", () => {
    describe("Clicking units to toggle orders", () => {

        const card = new ProbeLeft();
        const unit = new Infantry(Side.ALLIES);
        const unitCoord = new HexCoord(-4, 8); // Left section

        let gameState: GameState;
        let orderMove: Move;

        beforeEach(() => {
            const deck = new Deck([card]);
            gameState = new GameState(deck);
            // Arrange: Set up game with ProbeLeft card played
            gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            gameState.placeUnit(unitCoord, unit);
            // Play the card to enter OrderUnitsPhase
            gameState.executeMove(new PlayCardMove(card));

            // Verify unit can be ordered
            const legalMoves = gameState.legalMoves();
            orderMove = legalMoves.find(
                move => move instanceof OrderUnitMove &&
                    move.unit === unit
            ) as OrderUnitMove;

            expect(orderMove).toBeDefined();
        })

        it("should order unit when clicking on a unit that can be ordered", () => {
            // Act: Execute the order move (simulating what click handler would do)
            gameState.executeMove(orderMove);

            // Assert: Unit should now be ordered
            expect(gameState.getOrderedUnits()).toContain(unit);
        });

        it("should unorder a unit when clicking an already ordered unit", () => {
            gameState.orderUnit(unit);

            expect(gameState.getOrderedUnits()).toContain(unit);

            // Act: Click the unit again to unorder it
            const legalMoves2 = gameState.legalMoves();
            const unorderMove = legalMoves2.find(
                move => move instanceof UnOrderMove &&
                    move.unit === unit
            ) as UnOrderMove;
            gameState.executeMove(unorderMove);

            // Assert: Unit should no longer be ordered
            expect(gameState.getOrderedUnits()).not.toContain(unit);
        });
    });
});
