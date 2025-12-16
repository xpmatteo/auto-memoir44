// ABOUTME: Unit tests for AutoCombatPhase
// ABOUTME: Tests combat execution via onBeingPoppedUp() for single target scenarios

import {describe, expect, test} from "vitest";
import {AutoCombatPhase} from "../../../src/domain/phases/AutoCombatPhase";
import {GameState} from "../../../src/domain/GameState";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {HexCoord} from "../../../src/utils/hex";
import {PhaseType} from "../../../src/domain/phases/Phase";
import {ProgrammableDice, RESULT_INFANTRY, RESULT_ARMOR} from "../../../src/domain/Dice";
import {Deck} from "../../../src/domain/Deck";

describe("AutoCombatPhase", () => {
    test("legalMoves returns empty array (phase should never be active)", () => {
        const dice = new ProgrammableDice();
        const gameState = new GameState(Deck.createStandardDeck(), dice);
        const targetHex = new HexCoord(5, 5);
        const phase = new AutoCombatPhase(targetHex, 2, true);

        const moves = phase.legalMoves(gameState);
        expect(moves).toEqual([]);
    });

    test("phase type is AUTO_COMBAT", () => {
        const targetHex = new HexCoord(5, 5);
        const phase = new AutoCombatPhase(targetHex, 2, true);

        expect(phase.type).toBe(PhaseType.AUTO_COMBAT);
    });

    test("Target eliminated by hits → removes unit and awards medals", () => {
        const dice = new ProgrammableDice();
        const gameState = new GameState(Deck.createStandardDeck(), dice);

        const targetHex = new HexCoord(5, 5);
        const targetUnit = new Infantry(Side.AXIS);
        gameState.placeUnit(targetHex, targetUnit);
        gameState.setUnitCurrentStrength(targetUnit, 2); // 2 strength unit

        const phase = new AutoCombatPhase(targetHex, 2, true);

        // Roll 2 hits (infantry symbol hits infantry)
        dice.setNextRolls([RESULT_INFANTRY, RESULT_INFANTRY]);

        phase.onBeingPoppedUp(gameState);

        // Unit should be eliminated
        expect(gameState.getUnitAt(targetHex)).toBeUndefined();

        // Medal awarded to attacker (Allies)
        expect(gameState.getMedalTable(0).length).toBe(1);
    });

    test("Target takes hits but survives → reduces strength", () => {
        const dice = new ProgrammableDice();
        const gameState = new GameState(Deck.createStandardDeck(), dice);

        const targetHex = new HexCoord(5, 5);
        const targetUnit = new Infantry(Side.AXIS);
        gameState.placeUnit(targetHex, targetUnit);
        gameState.setUnitCurrentStrength(targetUnit, 4); // 4 strength unit

        const phase = new AutoCombatPhase(targetHex, 2, true);

        // Roll 1 hit
        dice.setNextRolls([RESULT_INFANTRY, RESULT_ARMOR]);

        phase.onBeingPoppedUp(gameState);

        // Unit should survive with reduced strength
        const unit = gameState.getUnitAt(targetHex);
        expect(unit).toBeDefined();
        expect(gameState.getUnitCurrentStrength(unit!)).toBe(3); // 4 - 1 = 3
    });

    test("Target takes no damage → unchanged", () => {
        const dice = new ProgrammableDice();
        const gameState = new GameState(Deck.createStandardDeck(), dice);

        const targetHex = new HexCoord(5, 5);
        const targetUnit = new Infantry(Side.AXIS);
        gameState.placeUnit(targetHex, targetUnit);
        gameState.setUnitCurrentStrength(targetUnit, 4);

        const phase = new AutoCombatPhase(targetHex, 2, true);

        // Roll no hits (armor against infantry)
        dice.setNextRolls([RESULT_ARMOR, RESULT_ARMOR]);

        phase.onBeingPoppedUp(gameState);

        // Unit should be unchanged
        const unit = gameState.getUnitAt(targetHex);
        expect(unit).toBeDefined();
        expect(gameState.getUnitCurrentStrength(unit!)).toBe(4);
    });

    test("Target already eliminated → gracefully skips combat", () => {
        const dice = new ProgrammableDice();
        const gameState = new GameState(Deck.createStandardDeck(), dice);

        const targetHex = new HexCoord(5, 5);
        // Don't place the unit - simulate it being eliminated already

        const phase = new AutoCombatPhase(targetHex, 2, true);

        phase.onBeingPoppedUp(gameState);

        // No unit at target hex
        expect(gameState.getUnitAt(targetHex)).toBeUndefined();

        // No medals awarded
        expect(gameState.getMedalTable(0).length).toBe(0);
    });

    // Note: Flag/retreat tests are covered by acceptance tests
    // Unit tests for retreats require proper phase stack setup which is complex
});
