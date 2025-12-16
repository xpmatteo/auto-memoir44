// ABOUTME: Integration tests for BattleMove class
// ABOUTME: Tests orchestration of dice rolling, hit resolution, damage, elimination, retreats, and medal tracking

import {describe, expect, it} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";
import {diceReturningAlways, DiceResult, RESULT_INFANTRY, RESULT_FLAG} from "../../../src/domain/Dice";
import {BattleMove} from "../../../src/domain/moves/BattleMove";
import {RetreatMove} from "../../../src/domain/moves/Move";
import {RetreatPhase} from "../../../src/domain/phases/RetreatPhase";
import {TakeGroundPhase} from "../../../src/domain/phases/TakeGroundPhase";
import {sandbagAllies} from "../../../src/domain/fortifications/Fortification";
import {Phase, PhaseType} from "../../../src/domain/phases/Phase";

// Test helper: sets up a battle scenario with specified dice results
// Uses middle of board (row 4) so AXIS units can retreat north
function setupBattle(diceResults: DiceResult[], attackerStrength: number, targetStrength: number) {
    const deck = Deck.createStandardDeck();
    const dice = diceReturningAlways(diceResults);
    const gameState = new GameState(deck, dice);

    const attacker = new Infantry(Side.ALLIES, attackerStrength);
    const target = new Infantry(Side.AXIS, targetStrength);
    const attackerCoord = new HexCoord(4, 4);
    const targetCoord = new HexCoord(5, 4);

    gameState.placeUnit(attackerCoord, attacker);
    gameState.placeUnit(targetCoord, target);

    return { gameState, attacker, target, attackerCoord, targetCoord };
}

describe("BattleMove integration", () => {
    it("should damage unit without eliminating when hits < strength", () => {
        // Setup: 2 hits against 4-strength unit
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_INFANTRY, RESULT_INFANTRY],
            4,
            4
        );

        const move = new BattleMove(attacker, target, 2);
        move.execute(gameState);

        // Assert: unit damaged but alive
        expect(gameState.getUnitCurrentStrength(target)).toBe(2);
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: not in medal table
        expect(gameState.getMedalTable(0)).not.toContain(target);
        expect(gameState.getMedalTable(1)).not.toContain(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should eliminate unit and update medal table when hits >= strength", () => {
        // Setup: 4 hits against 2-strength unit (overkill)
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY],
            4,
            2
        );

        const move = new BattleMove(attacker, target, 4);
        move.execute(gameState);

        // Assert: unit removed from board
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();

        // Assert: added to active player's medal table (player 0 = BOTTOM)
        expect(gameState.getMedalTable(0)).toContain(target);
        expect(gameState.getMedalTable(1)).not.toContain(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should force unit to retreat when flag rolled and single retreat path exists", () => {
        // Setup: 1 flag, unit can retreat to exactly one hex
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Block one of the two northern neighbors to force single retreat path
        // Target at (5,4) has northern neighbors: (5,3) northwest and (6,3) northeast
        const blockerCoord = new HexCoord(5, 3); // Block northwest
        const blocker = new Infantry(Side.AXIS, 1);
        gameState.placeUnit(blockerCoord, blocker);

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit moved to the only available retreat hex
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        const expectedRetreatCoord = new HexCoord(6, 3); // Northeast neighbor
        expect(gameState.getUnitAt(expectedRetreatCoord)).toBe(target);

        // Assert: no damage taken (successful retreat)
        expect(gameState.getUnitCurrentStrength(target)).toBe(4);

        // Assert: not eliminated
        expect(gameState.getMedalTable(0)).not.toContain(target);
        expect(gameState.getMedalTable(1)).not.toContain(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should automatically retreat AND offer take ground in close combat with single retreat path", () => {
        // Setup: Close combat (adjacent), 1 flag, single retreat path
        // This is the scenario from the bug report where unit didn't auto-retreat
        const { gameState, attacker, target, attackerCoord, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Verify it's close combat (setupBattle puts them at distance 1)
        expect(attackerCoord).toEqual(new HexCoord(4, 4));
        expect(targetCoord).toEqual(new HexCoord(5, 4));

        // Block one of the two northern neighbors to force single retreat path
        const blockerCoord = new HexCoord(5, 3); // Block northwest
        gameState.placeUnit(blockerCoord, new Infantry(Side.AXIS, 1));

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit automatically moved to the only available retreat hex
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        const expectedRetreatCoord = new HexCoord(6, 3); // Northeast neighbor
        expect(gameState.getUnitAt(expectedRetreatCoord)).toBe(target);

        // Assert: TakeGroundPhase was pushed for the vacated hex
        const phase = gameState.activePhase;
        expect(phase).toBeInstanceOf(TakeGroundPhase);
        const takeGroundPhase = phase as TakeGroundPhase;
        expect(takeGroundPhase.attackingUnit).toBe(attacker);
        expect(takeGroundPhase.fromHex).toEqual(attackerCoord);
        expect(takeGroundPhase.toHex).toEqual(targetCoord); // The hex that was vacated by retreat

        // Assert: no damage taken (successful retreat)
        expect(gameState.getUnitCurrentStrength(target)).toBe(4);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should damage unit when flag rolled but all retreat paths blocked", () => {
        // Setup: 1 flag, but no valid retreat paths
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Block both northern neighbors to prevent retreat
        // Target at (5,4) has northern neighbors: (5,3) and (6,3)
        const blocker1 = new Infantry(Side.AXIS, 1);
        const blocker2 = new Infantry(Side.AXIS, 1);
        gameState.placeUnit(new HexCoord(5, 3), blocker1);
        gameState.placeUnit(new HexCoord(6, 3), blocker2);

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit takes 1 damage (can't retreat 1 hex, so 1 damage)
        expect(gameState.getUnitCurrentStrength(target)).toBe(3);

        // Assert: unit still at original position
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: not eliminated
        expect(gameState.getMedalTable(0)).not.toContain(target);
        expect(gameState.getMedalTable(1)).not.toContain(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should push RetreatPhase when multiple retreat paths exist", () => {
        // Setup: 1 flag, unit has 2+ retreat options
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // No blockers - target has multiple northern neighbors available
        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit not moved yet
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: RetreatPhase pushed for player to choose
        expect(gameState.activePhase).toBeInstanceOf(RetreatPhase);
        const retreatPhase = gameState.activePhase as RetreatPhase;
        expect(retreatPhase.unit).toBe(target);
        expect(retreatPhase.availableRetreatHexes.length).toBeGreaterThan(1);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should eliminate unit from flag damage when retreat blocked and damage is lethal", () => {
        // Setup: 1 flag against 1-strength unit, retreat blocked
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            1
        );

        // Block all retreat paths
        gameState.placeUnit(new HexCoord(5, 3), new Infantry(Side.AXIS, 1));
        gameState.placeUnit(new HexCoord(6, 3), new Infantry(Side.AXIS, 1));

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit eliminated by flag damage
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();

        // Assert: added to medal table
        expect(gameState.getMedalTable(0)).toContain(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should handle combined hits and flags (hits then flag retreat)", () => {
        // Setup: 1 hit + 1 flag, unit survives hit and has retreat path
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_INFANTRY, RESULT_FLAG],
            4,
            4
        );

        // Block one retreat path to force single retreat
        gameState.placeUnit(new HexCoord(5, 3), new Infantry(Side.AXIS, 1));

        const move = new BattleMove(attacker, target, 2);
        move.execute(gameState);

        // Assert: took 1 damage from hit
        expect(gameState.getUnitCurrentStrength(target)).toBe(3);

        // Assert: retreated from flag
        expect(gameState.getUnitAt(targetCoord)).toBeUndefined();
        expect(gameState.getUnitAt(new HexCoord(6, 3))).toBe(target);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should offer 3 retreat hexes at distance 2 when 2 flags rolled with no blocked terrain", () => {
        // Setup: 2 flags, unit must retreat 2 hexes
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG, RESULT_FLAG],
            4,
            4
        );

        // No blockers - all retreat paths available
        const move = new BattleMove(attacker, target, 2);
        move.execute(gameState);

        // Assert: unit not moved yet (waiting for player choice)
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: RetreatPhase pushed
        expect(gameState.activePhase).toBeInstanceOf(RetreatPhase);
        const retreatPhase = gameState.activePhase as RetreatPhase;
        expect(retreatPhase.unit).toBe(target);

        // Assert: 3 retreat options at distance 2
        // Target at (5,4) -> distance 2 north gives: (5,2), (6,2), (7,2)
        expect(retreatPhase.availableRetreatHexes.length).toBe(3);
        expect(retreatPhase.availableRetreatHexes).toContainEqual(new HexCoord(5, 2));
        expect(retreatPhase.availableRetreatHexes).toContainEqual(new HexCoord(6, 2));
        expect(retreatPhase.availableRetreatHexes).toContainEqual(new HexCoord(7, 2));

        // Assert: no damage taken (retreat available)
        expect(gameState.getUnitCurrentStrength(target)).toBe(4);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should NOT push RetreatPhase when flag rolled, all retreats blocked, but unit survives damage", () => {
        // Setup: 1 flag against 4-strength unit, all retreat paths blocked
        // BUG: This used to push a RetreatPhase with empty retreat options!
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Block all retreat paths
        gameState.placeUnit(new HexCoord(5, 3), new Infantry(Side.AXIS, 1));
        gameState.placeUnit(new HexCoord(6, 3), new Infantry(Side.AXIS, 1));

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: unit took 1 damage (can't retreat 1 hex)
        expect(gameState.getUnitCurrentStrength(target)).toBe(3);

        // Assert: unit still at original position
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: NO RetreatPhase should be pushed (already handled by test on line 111)
        // But let's be explicit - the phase should NOT be RetreatPhase
        expect(gameState.activePhase).not.toBeInstanceOf(RetreatPhase);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should allow unit on sandbag to optionally ignore one flag", () => {
        // Setup: 1 flag, unit on sandbag, no blocked terrain
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Place sandbag on target's hex
        gameState.setFortification(targetCoord, sandbagAllies);

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: RetreatPhase pushed with option to stay or retreat
        expect(gameState.activePhase).toBeInstanceOf(RetreatPhase);
        const retreatPhase = gameState.activePhase as RetreatPhase;
        expect(retreatPhase.unit).toBe(target);

        // Assert: 3 options - stay at current position OR retreat to 2 northern neighbors
        expect(retreatPhase.availableRetreatHexes.length).toBe(3);
        expect(retreatPhase.availableRetreatHexes).toContainEqual(targetCoord); // Can stay
        expect(retreatPhase.availableRetreatHexes).toContainEqual(new HexCoord(5, 3)); // Northwest
        expect(retreatPhase.availableRetreatHexes).toContainEqual(new HexCoord(6, 3)); // Northeast

        // Assert: no damage taken yet
        expect(gameState.getUnitCurrentStrength(target)).toBe(4);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should NOT push TakeGroundPhase when unit on sandbag ignores flag in close combat", () => {
        // Setup: Close combat, 1 flag, unit on sandbag chooses to ignore flag and stay
        // This is the bug from the screenshot!
        const { gameState, attacker, target, targetCoord } = setupBattle(
            [RESULT_FLAG],
            4,
            4
        );

        // Place sandbag on target's hex
        gameState.setFortification(targetCoord, sandbagAllies);

        const move = new BattleMove(attacker, target, 1);
        move.execute(gameState);

        // Assert: RetreatPhase was pushed (unit can choose to stay or retreat)
        expect(gameState.activePhase).toBeInstanceOf(RetreatPhase);

        // Get the legal moves - one should be to stay in place
        const retreatMoves = gameState.legalMoves();
        const stayMove = retreatMoves.find(m => {
            const rm = m as RetreatMove;
            return rm.from.key() === targetCoord.key() && rm.to.key() === targetCoord.key();
        });
        expect(stayMove).toBeDefined();

        // Execute the "stay in place" move (ignoring the flag)
        stayMove!.execute(gameState);

        // Assert: unit stayed at original position
        expect(gameState.getUnitAt(targetCoord)).toBe(target);

        // Assert: TakeGroundPhase should NOT be pushed since hex was not vacated
        expect(gameState.activePhase).not.toBeInstanceOf(TakeGroundPhase);

        // The phase should have popped back to BattlePhase (or whatever was underneath)
        expect(gameState.activePhase).not.toBeInstanceOf(RetreatPhase);
    });

    it("should pop phase after execution when popsPhaseAfterExecution flag is true", () => {
        // Setup: Basic battle scenario
        const { gameState, attacker, target } = setupBattle(
            [RESULT_INFANTRY, RESULT_INFANTRY],
            4,
            4
        );

        // Push a dummy phase to track popping
        const dummyPhase = new class implements Phase {
            readonly name = "Dummy Phase";
            readonly type = PhaseType.BATTLE;
            legalMoves() { return []; }
            onBeingPoppedUp() { /* do nothing */ }
        }();
        gameState.pushPhase(dummyPhase);

        // Verify we're in the dummy phase
        expect(gameState.activePhase.name).toBe("Dummy Phase");

        // Create BattleMove with popsPhaseAfterExecution = true
        const move = new BattleMove(attacker, target, 2, true);
        move.execute(gameState);

        // Assert: Phase was popped after execution
        expect(gameState.activePhase.name).not.toBe("Dummy Phase");

        // Assert: Battle still executed normally (damage applied)
        expect(gameState.getUnitCurrentStrength(target)).toBe(2);

        // Assert: attack counted
        expect(gameState.getUnitBattlesThisTurn(attacker)).toBe(1);
    });

    it("should NOT pop phase when popsPhaseAfterExecution flag is false or omitted", () => {
        // Setup: Basic battle scenario
        const { gameState, attacker, target } = setupBattle(
            [RESULT_INFANTRY, RESULT_INFANTRY],
            4,
            4
        );

        // Push a dummy phase
        const dummyPhase = new class implements Phase {
            readonly name = "Dummy Phase";
            readonly type = PhaseType.BATTLE;
            legalMoves() { return []; }
            onBeingPoppedUp() { /* do nothing */ }
        }();
        gameState.pushPhase(dummyPhase);

        // Create BattleMove without the flag (defaults to false)
        const move = new BattleMove(attacker, target, 2);
        move.execute(gameState);

        // Assert: Phase was NOT popped
        expect(gameState.activePhase.name).toBe("Dummy Phase");

        // Assert: Battle still executed normally
        expect(gameState.getUnitCurrentStrength(target)).toBe(2);
    });
});

