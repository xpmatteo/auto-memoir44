// ABOUTME: Unit tests for GameState.clone() method
// ABOUTME: Tests deep cloning of all GameState properties

import {describe, expect, it} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {AssaultLeft, CardLocation} from "../../../src/domain/cards/CommandCard";
import {Infantry} from "../../../src/domain/Unit";
import {HexCoord} from "../../../src/utils/hex";
import {Side} from "../../../src/domain/Player";
import {Dice} from "../../../src/domain/Dice";
import {PlayCardMove} from "../../../src/domain/moves/Move";

describe("GameState.clone()", () => {
    describe("primitive properties", () => {
        it("should copy activePlayerIndex", () => {
            const gameState = createTestGameState();
            gameState.switchActivePlayer(); // Set to player 1

            const cloned = gameState.clone();

            expect(cloned.activePlayer).toEqual(gameState.activePlayer);
        });

        it("should copy activeCardId", () => {
            const cards = [new AssaultLeft()];
            const deck = new Deck(cards);
            const gs = new GameState(deck);
            gs.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
            gs.executeMove(new PlayCardMove(cards[0]));

            const cloned = gs.clone();

            expect(cloned.activeCard).toEqual(gs.activeCard);
        });
    });

    describe("players tuple", () => {
        it("should copy players array", () => {
            const gameState = createTestGameState();

            const cloned = gameState.clone();

            // Players should be the same (they're immutable)
            expect(cloned.activePlayer).toBe(gameState.activePlayer);
        });
    });

    describe("deck cloning", () => {
        it("should clone deck independently", () => {
            const gameState = createTestGameState();

            const cloned = gameState.clone();

            // Draw from clone
            cloned.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

            // Original unchanged
            expect(gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(0);

            // Clone changed
            expect(cloned.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)).toHaveLength(1);
        });
    });

    describe("dice cloning", () => {
        it("should share dice RNG", () => {
            let callCount = 0;
            const rng = () => {
                callCount++;
                return 0.5;
            };
            const dice = new Dice(rng);
            const gameState = new GameState(Deck.createStandardDeck(), dice);

            const cloned = gameState.clone();

            // Roll on original
            gameState.rollDice(1);
            expect(callCount).toBeGreaterThan(0);
            const countAfterFirst = callCount;

            // Roll on clone
            cloned.rollDice(1);
            // Should have incremented the shared counter
            expect(callCount).toBeGreaterThan(countAfterFirst);
        });
    });

    describe("phases array", () => {
        it("should clone phases array independently", () => {
            const gameState = createTestGameState();

            const cloned = gameState.clone();

            // Verify both have the same phase initially
            expect(cloned.activePhase.name).toBe(gameState.activePhase.name);

            // Phase instances should be shared (they're stateless)
            expect(cloned.activePhase).toBe(gameState.activePhase);
        });
    });

    describe("unit maps", () => {
        it("should clone unitPositions map independently", () => {
            const gameState = createTestGameState();
            const unit = new Infantry(Side.ALLIES);
            const coord = new HexCoord(0, 0);
            gameState.placeUnit(coord, unit);

            const cloned = gameState.clone();

            // Move unit on clone
            cloned.moveUnit(coord, new HexCoord(1, 0));

            // Original should be unchanged
            expect(gameState.getUnitAt(coord)).toBe(unit);
            expect(gameState.getUnitAt(new HexCoord(1, 0))).toBeUndefined();

            // Clone should have changed
            expect(cloned.getUnitAt(coord)).toBeUndefined();
            expect(cloned.getUnitAt(new HexCoord(1, 0))).toBe(unit);
        });

        it("should clone units map independently", () => {
            const gameState = createTestGameState();
            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(0, 0), unit);

            const cloned = gameState.clone();

            // Both should have the unit
            expect(gameState.getAllUnitsWithPositions()).toHaveLength(1);
            expect(cloned.getAllUnitsWithPositions()).toHaveLength(1);

            // Unit instances should be shared (they're immutable)
            expect(cloned.getAllUnitsWithPositions()[0].unit).toBe(unit);
        });
    });

    describe("unit states - CRITICAL", () => {
        it("should deep clone unitStates map", () => {
            const gameState = createTestGameState();
            const unit = new Infantry(Side.ALLIES, 4);
            gameState.placeUnit(new HexCoord(0, 0), unit);

            const cloned = gameState.clone();

            // Modify clone unit state
            cloned.toggleUnitOrdered(unit);
            cloned.setUnitCurrentStrength(unit, 2);

            // Original should be unchanged
            expect(gameState.isUnitOrdered(unit)).toBe(false);
            expect(gameState.getUnitCurrentStrength(unit)).toBe(4);

            // Clone should have changed
            expect(cloned.isUnitOrdered(unit)).toBe(true);
            expect(cloned.getUnitCurrentStrength(unit)).toBe(2);
        });

        it("should deep clone all unit state properties", () => {
            const gameState = createTestGameState();
            const unit = new Infantry(Side.ALLIES, 4);
            gameState.placeUnit(new HexCoord(0, 0), unit);

            // Set all properties
            gameState.toggleUnitOrdered(unit);
            gameState.markUnitMoved(unit);
            gameState.markUnitSkipsBattle(unit);
            gameState.incrementUnitBattlesThisTurn(unit);
            gameState.setUnitCurrentStrength(unit, 3);

            const cloned = gameState.clone();

            // Verify all properties copied
            expect(cloned.isUnitOrdered(unit)).toBe(true);
            expect(cloned.isUnitMoved(unit)).toBe(true);
            expect(cloned.unitSkipsBattle(unit)).toBe(true);
            expect(cloned.getUnitBattlesThisTurn(unit)).toBe(1);
            expect(cloned.getUnitCurrentStrength(unit)).toBe(3);
        });
    });

    describe("medal tables", () => {
        it("should clone medal tables independently", () => {
            const gameState = createTestGameState();
            const unit = new Infantry(Side.ALLIES);
            gameState.placeUnit(new HexCoord(0, 0), unit);

            const cloned = gameState.clone();

            // Add medal to clone
            cloned.addToMedalTable(unit, 1);

            // Original should be unchanged
            expect(gameState.getMedalTable(1)).toHaveLength(0);

            // Clone should have changed
            expect(cloned.getMedalTable(1)).toHaveLength(1);
            expect(cloned.getMedalTable(1)[0]).toBe(unit);
        });

        it("should clone both medal tables", () => {
            const gameState = createTestGameState();
            const unit1 = new Infantry(Side.ALLIES);
            const unit2 = new Infantry(Side.AXIS);
            gameState.placeUnit(new HexCoord(0, 0), unit1);
            gameState.placeUnit(new HexCoord(1, 0), unit2);

            gameState.addToMedalTable(unit1, 0);
            gameState.addToMedalTable(unit2, 1);

            const cloned = gameState.clone();

            // Verify both tables cloned
            expect(cloned.getMedalTable(0)).toHaveLength(1);
            expect(cloned.getMedalTable(1)).toHaveLength(1);

            // Add more medals to clone
            cloned.addToMedalTable(unit1, 1);

            // Original table should be unchanged
            expect(gameState.getMedalTable(1)).toHaveLength(1);

            // Clone table should have changed
            expect(cloned.getMedalTable(1)).toHaveLength(2);
        });
    });
});

function createTestGameState(): GameState {
    const cards = [
        new AssaultLeft(),
        new AssaultLeft(),
        new AssaultLeft(),
    ];
    const deck = new Deck(cards);
    return new GameState(deck);
}
