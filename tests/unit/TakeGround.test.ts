// ABOUTME: Unit tests for Take Ground feature
// ABOUTME: Tests that attacking units can advance into vacated hexes after close combat

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";
import {BattleMove, TakeGroundMove, DoNotTakeGroundMove} from "../../src/domain/Move";
import {diceReturningAlways, RESULT_INFANTRY, RESULT_GRENADE, RESULT_FLAG} from "../../src/domain/Dice";
import {TakeGroundPhase} from "../../src/domain/phases/TakeGroundPhase";
import {PhaseType} from "../../src/domain/phases/Phase";

describe("Take Ground", () => {
    describe("TakeGroundPhase activation", () => {
        it("should push TakeGroundPhase when enemy unit is eliminated in close combat", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Should push TakeGroundPhase
            const activePhase = gameState.activePhase;
            expect(activePhase.type).toBe(PhaseType.TAKE_GROUND);
            expect(activePhase).toBeInstanceOf(TakeGroundPhase);
        });

        it("should push TakeGroundPhase after retreat completes in close combat", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_FLAG]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);
            const attackerCoord = new HexCoord(5, 4);
            const targetCoord = new HexCoord(6, 4);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const battleMove = new BattleMove(attacker, target, 1);
            battleMove.execute(gameState);

            // First, RetreatPhase should be active (for choosing retreat direction)
            expect(gameState.activePhase.type).toBe(PhaseType.RETREAT);

            // Execute the retreat move
            const legalMoves = gameState.legalMoves();
            const retreatMove = legalMoves[0];
            retreatMove.execute(gameState);

            // After retreat completes, TakeGroundPhase should be active
            expect(gameState.activePhase.type).toBe(PhaseType.TAKE_GROUND);
        });

        it("should NOT push TakeGroundPhase when battle is at range 2", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(2, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Should NOT push TakeGroundPhase since battle was not at distance 1
            const activePhase = gameState.activePhase;
            expect(activePhase.type).not.toBe(PhaseType.TAKE_GROUND);
        });

        it("should NOT push TakeGroundPhase when battle is at range 3", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(3, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Should NOT push TakeGroundPhase since battle was not at distance 1
            const activePhase = gameState.activePhase;
            expect(activePhase.type).not.toBe(PhaseType.TAKE_GROUND);
        });

        it("should NOT push TakeGroundPhase when enemy survives without retreating", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 4);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 1);
            move.execute(gameState);

            // Should NOT push TakeGroundPhase since target hex was not vacated
            const activePhase = gameState.activePhase;
            expect(activePhase.type).not.toBe(PhaseType.TAKE_GROUND);
        });
    });

    describe("TakeGroundPhase legal moves", () => {
        it("should offer TakeGroundMove and DoNotTakeGroundMove", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            const legalMoves = gameState.legalMoves();
            expect(legalMoves.length).toBe(2);

            const hasTakeGroundMove = legalMoves.some(m => m instanceof TakeGroundMove);
            const hasDoNotTakeGroundMove = legalMoves.some(m => m instanceof DoNotTakeGroundMove);

            expect(hasTakeGroundMove).toBe(true);
            expect(hasDoNotTakeGroundMove).toBe(true);
        });
    });

    describe("TakeGroundMove execution", () => {
        it("should move attacker to vacated hex", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const battleMove = new BattleMove(attacker, target, 2);
            battleMove.execute(gameState);

            // Find and execute TakeGroundMove
            const legalMoves = gameState.legalMoves();
            const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove) as TakeGroundMove;
            expect(takeGroundMove).toBeDefined();

            takeGroundMove!.execute(gameState);

            // Attacker should now be at target's old position
            expect(gameState.getUnitAt(targetCoord)).toBe(attacker);
            expect(gameState.getUnitAt(attackerCoord)).toBeUndefined();
        });

        it("should pop TakeGroundPhase from phase stack", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const battleMove = new BattleMove(attacker, target, 2);
            battleMove.execute(gameState);

            expect(gameState.activePhase.type).toBe(PhaseType.TAKE_GROUND);

            // Execute TakeGroundMove
            const legalMoves = gameState.legalMoves();
            const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove) as TakeGroundMove;
            takeGroundMove!.execute(gameState);

            // Phase should be popped
            expect(gameState.activePhase.type).not.toBe(PhaseType.TAKE_GROUND);
        });
    });

    describe("DoNotTakeGroundMove execution", () => {
        it("should keep attacker in original position", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const battleMove = new BattleMove(attacker, target, 2);
            battleMove.execute(gameState);

            // Find and execute DoNotTakeGroundMove
            const legalMoves = gameState.legalMoves();
            const doNotTakeGroundMove = legalMoves.find(m => m instanceof DoNotTakeGroundMove) as DoNotTakeGroundMove;
            expect(doNotTakeGroundMove).toBeDefined();

            doNotTakeGroundMove!.execute(gameState);

            // Attacker should still be at original position
            expect(gameState.getUnitAt(attackerCoord)).toBe(attacker);
            expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        });

        it("should pop TakeGroundPhase from phase stack", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);
            const attackerCoord = new HexCoord(0, 0);
            const targetCoord = new HexCoord(1, 0);

            gameState.placeUnit(attackerCoord, attacker);
            gameState.placeUnit(targetCoord, target);

            const battleMove = new BattleMove(attacker, target, 2);
            battleMove.execute(gameState);

            expect(gameState.activePhase.type).toBe(PhaseType.TAKE_GROUND);

            // Execute DoNotTakeGroundMove
            const legalMoves = gameState.legalMoves();
            const doNotTakeGroundMove = legalMoves.find(m => m instanceof DoNotTakeGroundMove) as DoNotTakeGroundMove;
            doNotTakeGroundMove!.execute(gameState);

            // Phase should be popped
            expect(gameState.activePhase.type).not.toBe(PhaseType.TAKE_GROUND);
        });
    });
});
