// ABOUTME: Acceptance tests for moving units during the movement phase
// ABOUTME: Tests infantry movement (1-2 hexes) with pathfinding and auto-advance

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/cards/CommandCard";
import {ConfirmOrdersMove, PlayCardMove, OrderUnitMove} from "../../src/domain/moves/Move";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {hexOf} from "../../src/utils/hex";
import {MovePhase} from "../../src/domain/phases/MovePhase";
import {woodsTerrain, hedgerowsTerrain, hillTerrain, TownTerrain} from "../../src/domain/terrain/Terrain";
import {MoveUnitMove} from "../../src/domain/moves/MoveUnitMove";

describe("Moving units", () => {
    test("Infantry can move 1 or 2 hexes", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const startPos = hexOf(5, 5);
        gameState.placeUnit(startPos, unit);

        // Play card and order the unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        // Assert: Should be in MovePhase
        expect(gameState.activePhase.name).toBe("Move Units");

        // Assert: Can move 1 hex east
        const oneHexEast = hexOf(6, 5);
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, oneHexEast));

        // Assert: Can move 2 hexes east
        const twoHexesEast = hexOf(7, 5);
        expect(gameState.legalMoves()).toContainEqual(new MoveUnitMove(startPos, twoHexesEast));
    });

    test("Phase auto-advances when all ordered units have moved", () => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        const startPos = hexOf(5, 5);
        const endPos = hexOf(6, 5);
        gameState.placeUnit(startPos, unit);

        // Play card and order the unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit));
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
        const startPos = hexOf(5, 5);
        const blockingPos = hexOf(6, 5); // Adjacent to unit1
        const beyondBlocker = hexOf(7, 5); // 2 hexes away, blocked by unit2

        gameState.placeUnit(startPos, unit1);
        gameState.placeUnit(blockingPos, unit2);

        // Play card and order unit1
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit1));
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
        const pos1 = hexOf(5, 5);
        const pos2 = hexOf(8, 8);
        const newPos = hexOf(6, 5);

        gameState.placeUnit(pos1, unit1);
        gameState.placeUnit(pos2, unit2);

        // Play card and order both units
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit1));
        gameState.executeMove(new OrderUnitMove(unit2));
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
        const newPos2 = hexOf(7, 8);
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
        const startPos1 = hexOf(1, 4);
        const startPos2 = hexOf(1, 6);
        gameState.placeUnit(startPos1, unit1);
        gameState.placeUnit(startPos2, unit2);

        // Play card and order both units
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit1));
        gameState.executeMove(new OrderUnitMove(unit2));
        gameState.executeMove(new ConfirmOrdersMove());

        // Act: Move unit1 2 hexes
        const endPos1 = hexOf(3, 4); // 2 hexes away
        gameState.executeMove(new MoveUnitMove(startPos1, endPos1));

        // Assert: After moving 2 hexes, unit1 should be marked to skip battle
        expect(gameState.unitSkipsBattle(unit1)).toBe(true);

        // Still in MovePhase because unit2 hasn't moved yet
        expect(gameState.activePhase).toBeInstanceOf(MovePhase);

        // Act: Move unit2 1 hex
        const endPos2 = hexOf(2, 6); // 1 hex away
        gameState.executeMove(new MoveUnitMove(startPos2, endPos2));
        expect(gameState.unitSkipsBattle(unit2)).toBe(false);

        // Assert: Phase auto-advanced to next turn after all units moved
        expect(gameState.activePhase.name).toBe("Battle");
    });

    test("Unit can move TO stop-terrain hex (Woods) but movement ends there", () => {
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        // Setup: unit at (5,5), woods at (6,5)
        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(hexOf(5, 5), unit);
        gameState.setTerrain(hexOf(6, 5), woodsTerrain);
        gameState.finishSetup();

        // Play card and order unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        // Should be able to move TO woods
        const moves = gameState.legalMoves();
        const moveToWoods = moves.find(m =>
            m instanceof MoveUnitMove &&
            m.to.q === 6 && m.to.r === 5
        );
        expect(moveToWoods).toBeDefined();

        // Should NOT be able to move THROUGH woods to (7,5)
        const moveThroughWoods = moves.find(m =>
            m instanceof MoveUnitMove &&
            m.to.q === 7 && m.to.r === 5
        );
        expect(moveThroughWoods).toBeUndefined();
    });

    test("Unit cannot move through stop-terrain to reach distant hex", () => {
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        // Setup: unit at (5,5), hedgerows at (6,5) blocking path to (7,5)
        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(hexOf(5, 5), unit);
        gameState.setTerrain(hexOf(6, 5), hedgerowsTerrain);
        gameState.finishSetup();

        // Play card and order unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        const moves = gameState.legalMoves();

        // Can move to hedgerows
        expect(moves.some(m =>
            m instanceof MoveUnitMove && m.to.q === 6 && m.to.r === 5
        )).toBe(true);

        // Cannot reach hex beyond hedgerows via that path
        expect(moves.some(m =>
            m instanceof MoveUnitMove && m.to.q === 7 && m.to.r === 5
        )).toBe(false);
    });

    test("All stop-terrain types (Woods, Hedgerows, Town) block movement", () => {
        const terrainTypes = [
            {name: "Woods", terrain: woodsTerrain},
            {name: "Hedgerows", terrain: hedgerowsTerrain},
            {name: "Town", terrain: new TownTerrain("Town A")},
        ];

        for (const {name, terrain} of terrainTypes) {
            const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
            const gameState = new GameState(deck);
            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(hexOf(5, 5), unit);
            gameState.setTerrain(hexOf(6, 5), terrain);
            gameState.finishSetup();

            // Play card and order unit
            const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
            gameState.executeMove(new PlayCardMove(card));
            gameState.executeMove(new OrderUnitMove(unit));
            gameState.executeMove(new ConfirmOrdersMove());

            const moves = gameState.legalMoves();

            // Should NOT be able to move through stop-terrain
            const moveThroughTerrain = moves.find(m =>
                m instanceof MoveUnitMove && m.to.q === 7 && m.to.r === 5
            );
            expect(moveThroughTerrain, `${name} should block movement`).toBeUndefined();
        }
    });

    test("Non-stop terrain (Hill, Clear) allows movement through", () => {
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);

        const unit = new Infantry(Side.ALLIES);
        gameState.placeUnit(hexOf(5, 5), unit);
        gameState.setTerrain(hexOf(6, 5), hillTerrain);
        gameState.finishSetup();

        // Play card and order unit
        const card = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(card));
        gameState.executeMove(new OrderUnitMove(unit));
        gameState.executeMove(new ConfirmOrdersMove());

        const moves = gameState.legalMoves();

        // SHOULD be able to move through hill to reach (7,5)
        const moveThroughHill = moves.find(m =>
            m instanceof MoveUnitMove && m.to.q === 7 && m.to.r === 5
        );
        expect(moveThroughHill).toBeDefined();
    });
});
