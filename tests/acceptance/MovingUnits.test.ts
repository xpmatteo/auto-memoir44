// ABOUTME: Acceptance tests for moving units during the movement phase
// ABOUTME: Tests infantry movement (1-2 hexes) with pathfinding and auto-advance

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/CommandCard";
import {ConfirmOrdersMove, MoveUnitMove, PlayCardMove, ToggleUnitOrderedMove} from "../../src/domain/Move";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import type {HexCoord} from "../../src/utils/hex";
import {MovePhase} from "../../src/domain/phases/MovePhase";

describe("Moving units", () => {
    test("Infantry can move 1 or 2 hexes", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const startPos: HexCoord = {q: 5, r: 5};
        gameState.placeUnit(startPos, unit);

        // Play card and order the unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new ToggleUnitOrderedMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        // Assert: Can move 1 hex east
        const oneHexEast: HexCoord = {q: 6, r: 5};
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, oneHexEast));

        // Assert: Can move 2 hexes east
        const twoHexesEast: HexCoord = {q: 7, r: 5};
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, twoHexesEast));
    });

    test("Phase auto-advances when all ordered units have moved", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const startPos: HexCoord = {q: 5, r: 5};
        const endPos: HexCoord = {q: 6, r: 5};
        gameState.placeUnit(startPos, unit);

        // Play card and order the unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new ToggleUnitOrderedMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        // Act: Move the unit
        gameState.executeMove(new MoveUnitMove(startPos, endPos));

        // Assert: Phase auto-advances to end of turn (no more phases, next player)
        expect(gameState.activePhase.name).toBe("Battle");
        expect(gameState.getUnitAt(endPos)).toBe(unit);
        expect(gameState.getUnitAt(startPos)).toBeUndefined();
    });

    test("Units cannot move through friendly units", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const startPos: HexCoord = {q: 5, r: 5};
        const blockingPos: HexCoord = {q: 6, r: 5}; // Adjacent to unit1
        const beyondBlocker: HexCoord = {q: 7, r: 5}; // 2 hexes away, blocked by unit2

        gameState.placeUnit(startPos, unit1);
        gameState.placeUnit(blockingPos, unit2);

        // Play card and order unit1
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new ToggleUnitOrderedMove(unit1));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        // Assert: Cannot move to or through the blocking unit
        const legalMoves = gameState.legalMoves();
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, blockingPos));
        expect(legalMoves).not.toContainEqual(new MoveUnitMove(startPos, beyondBlocker));
    });

    test("Movement is optional - can skip units", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const pos1: HexCoord = {q: 5, r: 5};
        const pos2: HexCoord = {q: 8, r: 8};
        const newPos: HexCoord = {q: 6, r: 5};

        gameState.placeUnit(pos1, unit1);
        gameState.placeUnit(pos2, unit2);

        // Play card and order both units
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new ToggleUnitOrderedMove(unit1));
        gameState.executeMove(new ToggleUnitOrderedMove(unit2));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move only unit1, leave unit2 in place
        gameState.executeMove(new MoveUnitMove(pos1, newPos));

        // Assert: unit1 moved, unit2 did not move
        expect(gameState.getUnitAt(newPos)).toBe(unit1);
        expect(gameState.getUnitAt(pos2)).toBe(unit2);

        // Assert: unit1 is marked as moved, unit2 is not
        expect(gameState.isUnitMoved(unit1)).toBe(true);
        expect(gameState.isUnitMoved(unit2)).toBe(false);

        // Assert: Still in MovePhase because unit2 hasn't moved yet
        expect(gameState.activePhase.name).toBe("Move Units");

        // Act: Now move unit2
        const newPos2: HexCoord = {q: 7, r: 8};
        gameState.executeMove(new MoveUnitMove(pos2, newPos2));

        // Assert: Phase auto-advances
        expect(gameState.activePhase.name).toBe("Battle");
    });

    test("Units that move 2 hexes cannot battle", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const startPos1: HexCoord = {q: 1, r: 4};
        const startPos2: HexCoord = {q: 1, r: 6};
        gameState.placeUnit(startPos1, unit1);
        gameState.placeUnit(startPos2, unit2);

        // Play card and order both units
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new ToggleUnitOrderedMove(unit1));
        gameState.executeMove(new ToggleUnitOrderedMove(unit2));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move unit1 2 hexes
        const endPos1: HexCoord = {q: 3, r: 4}; // 2 hexes away
        gameState.executeMove(new MoveUnitMove(startPos1, endPos1));

        // Assert: After moving 2 hexes, unit1 should be marked to skip battle
        expect(gameState.unitSkipsBattle(unit1)).toBe(true);

        // Still in MovePhase because unit2 hasn't moved yet
        expect(gameState.activePhase).toBeInstanceOf(MovePhase);

        // Act: Move unit2 1 hex
        const endPos2: HexCoord = {q: 2, r: 6}; // 1 hex away
        gameState.executeMove(new MoveUnitMove(startPos2, endPos2));
        expect(gameState.unitSkipsBattle(unit2)).toBe(false);

        // Assert: Phase auto-advanced to next turn after all units moved
        expect(gameState.activePhase.name).toBe("Battle");
    });
});
