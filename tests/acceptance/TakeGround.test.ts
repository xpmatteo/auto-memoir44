// ABOUTME: Acceptance tests for Take Ground rule in close combat
// ABOUTME: Tests that units can optionally advance into hexes vacated by eliminated or retreating enemies

import {describe, expect, test} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {hexOf} from "../../src/utils/hex";
import {diceReturningAlways, RESULT_INFANTRY, RESULT_FLAG} from "../../src/domain/Dice";
import {BattleMove} from "../../src/domain/moves/BattleMove";
import {PhaseType} from "../../src/domain/phases/Phase";
import {TakeGroundMove} from "../../src/domain/moves/TakeGroundMove";
import {DeclineTakeGroundMove} from "../../src/domain/moves/DeclineTakeGroundMove";

// Test helper: sets up a close combat battle scenario
function setupCloseCombat(diceResults: any[], attackerStrength: number, targetStrength: number) {
    const deck = Deck.createStandardDeck();
    const dice = diceReturningAlways(diceResults);
    const gameState = new GameState(deck, dice);

    const attacker = new Infantry(Side.ALLIES, attackerStrength);
    const target = new Infantry(Side.AXIS, targetStrength);

    // Place units adjacent to each other (close combat)
    const attackerCoord = hexOf(4, 4);
    const targetCoord = hexOf(5, 4); // Adjacent hex

    gameState.placeUnit(attackerCoord, attacker);
    gameState.placeUnit(targetCoord, target);

    return { gameState, attacker, target, attackerCoord, targetCoord };
}

describe("Take Ground", () => {
    test("after close combat elimination, attacker can take ground", () => {
        // Setup: close combat that will eliminate the target
        const { gameState, attacker, target, attackerCoord, targetCoord } = setupCloseCombat(
            [RESULT_INFANTRY, RESULT_INFANTRY], // 2 hits
            4, // attacker strength
            2  // target strength (will be eliminated)
        );

        // Execute the battle
        const battleMove = new BattleMove(attacker, target, 2);
        battleMove.execute(gameState);

        // Assert: target is eliminated
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        expect(gameState.getMedalTable(0)).toContain(target);

        // Assert: TakeGroundPhase is active
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Assert: legal moves include take ground and decline
        const legalMoves = gameState.legalMoves();
        expect(legalMoves).toHaveLength(2);

        const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove);
        const declineMove = legalMoves.find(m => m instanceof DeclineTakeGroundMove);

        expect(takeGroundMove).toBeDefined();
        expect(declineMove).toBeDefined();

        // Execute: take ground
        gameState.executeMove(takeGroundMove!);

        // Assert: attacker has moved to the vacated hex
        expect(gameState.getUnitAt(attackerCoord)).toBeUndefined();
        expect(gameState.getUnitAt(targetCoord)).toBe(attacker);

        // Assert: phase has been popped (back to BattlePhase or wherever we came from)
        expect(gameState.activePhase.type).not.toBe(PhaseType.MOVE);
    });

    test("after close combat elimination, attacker can decline to take ground", () => {
        // Setup: close combat that will eliminate the target
        const { gameState, attacker, target, attackerCoord, targetCoord } = setupCloseCombat(
            [RESULT_INFANTRY, RESULT_INFANTRY],
            4,
            2
        );

        // Execute the battle
        const battleMove = new BattleMove(attacker, target, 2);
        battleMove.execute(gameState);

        // Assert: TakeGroundPhase is active
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Find the decline move
        const legalMoves = gameState.legalMoves();
        const declineMove = legalMoves.find(m => m instanceof DeclineTakeGroundMove);
        expect(declineMove).toBeDefined();

        // Execute: decline take ground
        gameState.executeMove(declineMove!);

        // Assert: attacker has NOT moved
        expect(gameState.getUnitAt(attackerCoord)).toBe(attacker);
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();

        // Assert: phase has been popped
        expect(gameState.activePhase.type).not.toBe(PhaseType.MOVE);
    });

    test("after close combat retreat (single path), attacker can take ground", () => {
        // Setup: close combat that causes retreat
        const { gameState, attacker, target, attackerCoord, targetCoord } = setupCloseCombat(
            [RESULT_FLAG], // 1 flag = retreat
            4,
            4
        );

        // Block one northern neighbor to force single retreat path
        // Target at (5,4) has northern neighbors: (5,3) and (6,3)
        const blockerCoord = hexOf(5, 3);
        const blocker = new Infantry(Side.AXIS, 1);
        gameState.placeUnit(blockerCoord, blocker);

        // Execute the battle
        const battleMove = new BattleMove(attacker, target, 1);
        battleMove.execute(gameState);

        // Assert: target has retreated
        const expectedRetreatCoord = hexOf(6, 3);
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        expect(gameState.getUnitAt(expectedRetreatCoord)).toBe(target);

        // Assert: TakeGroundPhase is active
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Execute: take ground
        const legalMoves = gameState.legalMoves();
        const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: attacker has moved to the vacated hex
        expect(gameState.getUnitAt(attackerCoord)).toBeUndefined();
        expect(gameState.getUnitAt(targetCoord)).toBe(attacker);
    });

    test("after close combat retreat (multiple paths), attacker can take ground after defender chooses", () => {
        // Setup: close combat with multiple retreat paths
        const { gameState, attacker, target, attackerCoord, targetCoord } = setupCloseCombat(
            [RESULT_FLAG],
            4,
            4
        );

        // Don't block any neighbors - target has 2 retreat options
        // Target at (5,4) has northern neighbors: (5,3) and (6,3)

        // Execute the battle
        const battleMove = new BattleMove(attacker, target, 1);
        battleMove.execute(gameState);

        // Assert: RetreatPhase is active (defender must choose)
        expect(gameState.activePhase.type).toBe(PhaseType.RETREAT);

        // Defender chooses a retreat path
        const retreatMoves = gameState.legalMoves();
        expect(retreatMoves.length).toBeGreaterThan(0);
        gameState.executeMove(retreatMoves[0]);

        // Assert: target has retreated
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();

        // Assert: TakeGroundPhase is now active
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Execute: take ground
        const legalMoves = gameState.legalMoves();
        const takeGroundMove = legalMoves.find(m => m instanceof TakeGroundMove);
        expect(takeGroundMove).toBeDefined();
        gameState.executeMove(takeGroundMove!);

        // Assert: attacker has moved to the vacated hex
        expect(gameState.getUnitAt(attackerCoord)).toBeUndefined();
        expect(gameState.getUnitAt(targetCoord)).toBe(attacker);
    });

    test("ranged combat does NOT trigger take ground", () => {
        // Setup: ranged combat (not adjacent)
        const deck = Deck.createStandardDeck();
        const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_INFANTRY]);
        const gameState = new GameState(deck, dice);

        const attacker = new Infantry(Side.ALLIES, 4);
        const target = new Infantry(Side.AXIS, 2);

        // Place units 2 hexes apart (NOT close combat)
        const attackerCoord = hexOf(4, 4);
        const targetCoord = hexOf(6, 4); // 2 hexes away

        gameState.placeUnit(attackerCoord, attacker);
        gameState.placeUnit(targetCoord, target);

        // Execute the battle
        const battleMove = new BattleMove(attacker, target, 2);
        battleMove.execute(gameState);

        // Assert: target is eliminated
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        expect(gameState.getMedalTable(0)).toContain(target);

        // Assert: NO TakeGroundPhase (because it was ranged combat)
        expect(gameState.activePhase.type).not.toBe(PhaseType.MOVE);
    });
});
