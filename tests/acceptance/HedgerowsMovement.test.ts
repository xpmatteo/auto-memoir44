// ABOUTME: Acceptance tests for hedgerows movement restrictions
// ABOUTME: Tests that units can only move to/from hedgerows via adjacent hexes

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/cards/CommandCard";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove} from "../../src/domain/moves/Move";
import {Infantry, Armor} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";
import {hedgerowsTerrain} from "../../src/domain/terrain/Terrain";
import {MoveUnitMove} from "../../src/domain/moves/MoveUnitMove";

describe("Hedgerows movement restrictions", () => {
    test("Infantry in hedgerows can only move 1 hex (not their normal 2)", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const startPos = new HexCoord(5, 5);

        // Place infantry on hedgerows terrain
        gameState.placeUnit(startPos, infantry);
        gameState.setTerrain(startPos, hedgerowsTerrain);

        // Play card and order the infantry unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: CAN move 1 hex east (adjacent)
        const oneHexEast = new HexCoord(6, 5);
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, oneHexEast));

        // Assert: CANNOT move 2 hexes east (distance 2 - normally allowed for infantry)
        const twoHexesEast = new HexCoord(7, 5);
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, twoHexesEast));

        // Assert: No-op move is still allowed
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, startPos));
    });

    test("Armor in hedgerows can only move 1 hex (not their normal 3)", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const armor = new Armor(Side.ALLIES);
        const startPos = new HexCoord(5, 5);

        // Place armor on hedgerows terrain
        gameState.placeUnit(startPos, armor);
        gameState.setTerrain(startPos, hedgerowsTerrain);

        // Play card and order the armor unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(armor));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: CAN move 1 hex east (adjacent)
        const oneHexEast = new HexCoord(6, 5);
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, oneHexEast));

        // Assert: CANNOT move 2 hexes east (normally allowed for armor)
        const twoHexesEast = new HexCoord(7, 5);
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, twoHexesEast));

        // Assert: CANNOT move 3 hexes east (normally allowed for armor)
        const threeHexesEast = new HexCoord(8, 5);
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, threeHexesEast));

        // Assert: No-op move is still allowed
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, startPos));
    });

    test("Cannot move TO hedgerows from distance 2", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const startPos = new HexCoord(5, 5);
        const hedgerowsPos = new HexCoord(7, 5); // Distance 2 from start

        // Place infantry on clear terrain, hedgerows at distance 2
        gameState.placeUnit(startPos, infantry);
        gameState.setTerrain(hedgerowsPos, hedgerowsTerrain);

        // Play card and order the infantry unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: CANNOT move to hedgerows at distance 2 (even though infantry normally moves 2)
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, hedgerowsPos));
    });

    test("CAN move TO hedgerows from adjacent hex", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const startPos = new HexCoord(5, 5);
        const hedgerowsPos = new HexCoord(6, 5); // Adjacent to start

        // Place infantry on clear terrain, hedgerows at adjacent hex
        gameState.placeUnit(startPos, infantry);
        gameState.setTerrain(hedgerowsPos, hedgerowsTerrain);

        // Play card and order the infantry unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: CAN move to adjacent hedgerows
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, hedgerowsPos));
    });

    test("No-op move always allowed even in hedgerows", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const startPos = new HexCoord(5, 5);

        // Place infantry on hedgerows terrain
        gameState.placeUnit(startPos, infantry);
        gameState.setTerrain(startPos, hedgerowsTerrain);

        // Play card and order the infantry unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: No-op move (stay in place) is legal
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, startPos));
    });

    test("Can move from hedgerows to adjacent hedgerows", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const infantry = new Infantry(Side.ALLIES);
        const startPos = new HexCoord(5, 5);
        const adjacentHedgerows = new HexCoord(6, 5);

        // Place infantry on hedgerows terrain, adjacent hex is also hedgerows
        gameState.placeUnit(startPos, infantry);
        gameState.setTerrain(startPos, hedgerowsTerrain);
        gameState.setTerrain(adjacentHedgerows, hedgerowsTerrain);

        // Play card and order the infantry unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(infantry));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        const legalMoves = gameState.legalMoves();

        // Assert: CAN move from hedgerows to adjacent hedgerows
        expect(legalMoves).toContainEqual(new MoveUnitMove(startPos, adjacentHedgerows));
    });
});
