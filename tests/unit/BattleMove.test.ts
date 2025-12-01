// ABOUTME: Unit tests for BattleMove class
// ABOUTME: Tests combat resolution, unit elimination, and medal table updates

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";
import {BattleMove} from "../../src/domain/Move";
import {diceReturningAlways, RESULT_INFANTRY, RESULT_GRENADE, RESULT_FLAG, RESULT_ARMOR} from "../../src/domain/Dice";

describe("BattleMove", () => {
    describe("unit damage", () => {
        it("should reduce target unit strength by number of hits", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            // Execute battle with 3 dice
            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            // Target should have 2 less strength (4 - 2 hits = 2)
            expect(gameState.getUnitCurrentStrength(target)).toBe(2);
        });

        it("should handle grenade hits on infantry", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_GRENADE, RESULT_GRENADE, RESULT_ARMOR]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            // Target should have 2 less strength (4 - 2 grenade hits = 2)
            expect(gameState.getUnitCurrentStrength(target)).toBe(2);
        });

        it("should handle mixed infantry and grenade hits", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 3);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            expect(gameState.getUnitCurrentStrength(target)).toBe(1);
        });

        it("should not apply damage when no hits are scored", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_ARMOR, RESULT_FLAG, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            // Target strength should remain unchanged
            expect(gameState.getUnitCurrentStrength(target)).toBe(4);
        });
    });

    describe("unit elimination", () => {
        it("should remove unit from board when strength drops to zero", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([
                RESULT_INFANTRY,
                RESULT_INFANTRY,
                RESULT_GRENADE,
                RESULT_GRENADE
            ]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 4);
            move.execute(gameState);

            // Target should be removed from board
            expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        });

        it("should remove unit from board when strength drops below zero", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([
                RESULT_INFANTRY,
                RESULT_INFANTRY,
                RESULT_GRENADE
            ]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            // Target should be removed despite overkill damage
            expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        });
    });

    describe("medal table updates", () => {
        it("should add eliminated unit to active player medal table", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            // Default active player is BOTTOM (index 0)
            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Target should be in bottom player's medal table (index 0)
            const bottomMedals = gameState.getMedalTable(0);
            const topMedals = gameState.getMedalTable(1);
            expect(bottomMedals).toContain(target);
            expect(topMedals).not.toContain(target);
        });

        it("should not add surviving units to medal table", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Target should not be in any medal table
            const bottomMedals = gameState.getMedalTable(0);
            const topMedals = gameState.getMedalTable(1);
            expect(bottomMedals).not.toContain(target);
            expect(topMedals).not.toContain(target);
        });

        it("should correctly track multiple eliminated units", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target1 = new Infantry(Side.AXIS, 2);
            const target2 = new Infantry(Side.AXIS, 2);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target1);
            gameState.placeUnit(new HexCoord(2, 0), target2);

            // Eliminate first target
            const move1 = new BattleMove(attacker, target1, 2);
            move1.execute(gameState);

            // Eliminate second target
            const move2 = new BattleMove(attacker, target2, 2);
            move2.execute(gameState);

            // Both targets should be in the medal table
            const bottomMedals = gameState.getMedalTable(0);
            expect(bottomMedals).toContain(target1);
            expect(bottomMedals).toContain(target2);
            expect(bottomMedals.length).toBe(2);
        });
    });

    describe("dice rolling", () => {
        it("should roll specified number of dice", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            // Battle with 3 dice
            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            // Should use all 3 results (2 hits from infantry + grenade)
            expect(gameState.getUnitCurrentStrength(target)).toBe(2); // 4 - 2 = 2
        });

        it("should work with single die", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            const move = new BattleMove(attacker, target, 1);
            move.execute(gameState);

            expect(gameState.getUnitCurrentStrength(target)).toBe(3); // 4 - 1 = 3
        });
    });

    describe("attack tracking", () => {
        it("should increment attacksThisTurn for attacking unit", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(0);

            const move = new BattleMove(attacker, target, 3);
            move.execute(gameState);

            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
        });

        it("should increment attacksThisTurn even when target is eliminated", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(0);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Attacker should still have attacksThisTurn incremented
            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
            // Target should be eliminated
            expect(gameState.getUnitAt(new HexCoord(1, 0))).toBeUndefined();
        });

        it("should increment attacksThisTurn even when no damage is dealt", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_FLAG, RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(0);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Attacker should still have attacksThisTurn incremented even with no hits
            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
        });

        it("should track multiple attacks from same unit", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target1 = new Infantry(Side.AXIS, 4);
            const target2 = new Infantry(Side.AXIS, 4);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target1);
            gameState.placeUnit(new HexCoord(2, 0), target2);

            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(0);

            // First attack
            const move1 = new BattleMove(attacker, target1, 1);
            move1.execute(gameState);
            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);

            // Second attack
            const move2 = new BattleMove(attacker, target2, 1);
            move2.execute(gameState);
            expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(2);
        });
    });
});
