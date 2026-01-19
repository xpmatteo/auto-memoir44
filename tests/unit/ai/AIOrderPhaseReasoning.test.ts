// ABOUTME: Tests for AI ORDER phase unit combination selection reasoning
// ABOUTME: Verifies AI simulates full turns to pick the best unit combination

import {describe, expect, test} from "vitest";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {SeededRNG} from "../../../src/adapters/RNG";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Dice} from "../../../src/domain/Dice";
import {Infantry} from "../../../src/domain/Unit";
import {Side, Position} from "../../../src/domain/Player";
import {hexOf, hexDistance} from "../../../src/utils/hex";
import {ProbeCenter} from "../../../src/domain/cards/SectionCards";
import {PlayCardMove, OrderUnitMove, ConfirmOrdersMove} from "../../../src/domain/moves/Move";
import {PhaseType} from "../../../src/domain/phases/Phase";
import {isHexInSection, Section} from "../../../src/domain/Section";

/**
 * ORDER PHASE AI REASONING
 *
 * When the AI has N orderable units but can only order M (where M < N),
 * it must choose which units to order. The AI uses full turn simulation:
 *
 * 1. Generate all M-sized combinations of orderable units
 * 2. For each combination, simulate: order → confirm → move all → evaluate final position
 * 3. Pick the combination yielding the highest position score
 *
 * This ensures the AI orders units that will be most valuable after moving,
 * not just units that look good in their current position.
 */

// Helper to create a GameState in ORDER phase with specified unit positions
function createOrderPhaseGameState(
    friendlyPositions: Array<{q: number, r: number}>,
    enemyPositions: Array<{q: number, r: number}> = [{q: 6, r: 1}],
    seed: number = 999
): GameState {
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 10]]); // Orders 2 units in center
    const dice = new Dice(() => rng.random());
    const gameState = new GameState(deck, dice);

    // Place enemy units
    for (const pos of enemyPositions) {
        gameState.placeUnit(hexOf(pos.q, pos.r), new Infantry(Side.AXIS));
    }

    // Place friendly units (ALLIES is active player, at BOTTOM)
    for (const pos of friendlyPositions) {
        gameState.placeUnit(hexOf(pos.q, pos.r), new Infantry(Side.ALLIES));
    }

    // Draw cards and play one to enter ORDER phase
    gameState.drawCards(1, gameState.activePlayerHand);
    const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
    gameState.executeMove(new PlayCardMove(cards[0]));

    // Verify we're in ORDER phase
    if (gameState.activePhase.type !== PhaseType.ORDER) {
        throw new Error(`Failed to set up game state in ORDER phase, got ${gameState.activePhase.type}`);
    }

    return gameState;
}

// Helper to extract which units the AI ordered
function getOrderedUnits(gameState: GameState): Set<string> {
    const ordered = new Set<string>();
    const friendlyUnits = gameState.getFriendlySituatedUnits();
    for (const su of friendlyUnits) {
        if (su.unitState.isOrdered) {
            ordered.add(`${su.coord.q},${su.coord.r}`);
        }
    }
    return ordered;
}

// Helper to let AI complete the ORDER phase
function letAICompleteOrderPhase(gameState: GameState, aiPlayer: RandomAIPlayer): void {
    const maxMoves = 10; // Prevent infinite loops
    let moveCount = 0;

    while (gameState.activePhase.type === PhaseType.ORDER && moveCount < maxMoves) {
        const legalMoves = gameState.legalMoves();
        const selected = aiPlayer.selectMove(gameState, legalMoves);
        gameState.executeMove(selected);
        moveCount++;
    }

    if (gameState.activePhase.type === PhaseType.ORDER) {
        throw new Error("AI did not complete ORDER phase within max moves");
    }
}

describe("AI ORDER Phase Reasoning", () => {
    /*
     * TEST: AI orders units that yield best position after full turn simulation
     *
     * Scenario:
     * - 3 infantry units available, card allows ordering 2 (ProbeCenter)
     * - Unit A and B are closer to enemy (can advance and attack)
     * - Unit C is farther back (less valuable after moving)
     * - Enemy at (4, 1): deep in enemy territory
     *
     * Expected: AI orders the units that yield higher position score after movement.
     *
     * Reasoning: The AI simulates full turns for each combination:
     * - For each combination, it simulates: order → confirm → move all → evaluate
     * - It picks the combination yielding the best final position score
     */
    test("AI orders units that yield best position after full turn simulation", () => {
        // Arrange
        // Place 3 units in CENTER section for BOTTOM player
        // Row 3 CENTER is q values 3-6 (plus straddling hex 2,3)
        // Row 8 CENTER is q values 0-4
        const unitA = {q: 3, r: 3}; // Close to enemy at (4,1) - distance 2
        const unitB = {q: 4, r: 3}; // Close to enemy at (4,1) - distance 2
        const unitC = {q: 0, r: 8}; // Far back - distance 7, clearly inferior

        const enemyPos = {q: 4, r: 1}; // Enemy in top-center

        const gameState = createOrderPhaseGameState(
            [unitA, unitB, unitC],
            [enemyPos],
            12345
        );

        // Guard assertions: verify unit positions are in center section
        const friendlyUnits = gameState.getFriendlySituatedUnits();
        expect(friendlyUnits.length).toBe(3);

        // Guard: verify all friendly units are in CENTER section for BOTTOM player
        expect(isHexInSection(hexOf(unitA.q, unitA.r), Section.CENTER, Position.BOTTOM)).toBe(true);
        expect(isHexInSection(hexOf(unitB.q, unitB.r), Section.CENTER, Position.BOTTOM)).toBe(true);
        expect(isHexInSection(hexOf(unitC.q, unitC.r), Section.CENTER, Position.BOTTOM)).toBe(true);

        // Guard: verify distances - A and B much closer than C
        const distA = hexDistance(hexOf(unitA.q, unitA.r), hexOf(enemyPos.q, enemyPos.r));
        const distB = hexDistance(hexOf(unitB.q, unitB.r), hexOf(enemyPos.q, enemyPos.r));
        const distC = hexDistance(hexOf(unitC.q, unitC.r), hexOf(enemyPos.q, enemyPos.r));
        expect(distA).toBe(2); // A is 2 hexes from enemy
        expect(distB).toBe(2); // B is 2 hexes from enemy
        expect(distC).toBe(7); // C is 7 hexes from enemy - clearly worse

        // Verify card can only order 2 units (ProbeCenter)
        const orderMoves = gameState.legalMoves().filter(m => m instanceof OrderUnitMove);
        expect(orderMoves.length).toBe(3); // 3 units can be ordered initially

        // Act: let AI complete the ORDER phase
        const rng = new SeededRNG(12345);
        const aiPlayer = new RandomAIPlayer(rng);
        letAICompleteOrderPhase(gameState, aiPlayer);

        // Assert: AI should have ordered 2 units
        const orderedUnits = getOrderedUnits(gameState);
        expect(orderedUnits.size).toBe(2);

        // AI should prefer units A and B over C because they have better scoring potential
        // (closer to enemy = higher closeTheGap score after moving)
        const orderedC = orderedUnits.has(`${unitC.q},${unitC.r}`);

        // The AI should NOT order unit C (the inferior unit further from enemy)
        // This proves the AI rejected C in favor of the better-positioned A and B
        expect(orderedC).toBe(false);
    });

    /*
     * TEST: AI consistently orders 2 units from 4 available across different seeds
     *
     * Verifies the AI can handle C(4,2) = 6 possible combinations and
     * always successfully completes the ORDER phase.
     */
    test("AI consistently orders 2 units from 4 available across different seeds", () => {
        // Arrange: 4 units in center section
        // Row 7 CENTER is q values 1-5, Row 8 CENTER is q values 0-4
        const unitPositions = [
            {q: 1, r: 7},
            {q: 2, r: 7},
            {q: 3, r: 7},
            {q: 4, r: 7},
        ];

        const gameState = createOrderPhaseGameState(
            unitPositions,
            [{q: 3, r: 1}],
            54321
        );

        // Guard: verify all units are in CENTER section for BOTTOM player
        for (const pos of unitPositions) {
            expect(isHexInSection(hexOf(pos.q, pos.r), Section.CENTER, Position.BOTTOM)).toBe(true);
        }

        // Verify we have 4 units that can be ordered
        const orderMoves = gameState.legalMoves().filter(m => m instanceof OrderUnitMove);
        expect(orderMoves.length).toBe(4);

        // Act: let AI complete ORDER phase
        const rng = new SeededRNG(54321);
        const aiPlayer = new RandomAIPlayer(rng);
        letAICompleteOrderPhase(gameState, aiPlayer);

        // Assert: AI ordered exactly 2 units
        const orderedUnits = getOrderedUnits(gameState);
        expect(orderedUnits.size).toBe(2);

        // Additional verification: Run multiple times with different seeds
        // to verify AI consistently completes ordering
        for (let seed = 1; seed <= 20; seed++) {
            const gs = createOrderPhaseGameState(
                unitPositions,
                [{q: 3, r: 1}],
                seed * 1000
            );
            const ai = new RandomAIPlayer(new SeededRNG(seed * 1000));
            letAICompleteOrderPhase(gs, ai);
            const ordered = getOrderedUnits(gs);

            // Each run should successfully order exactly 2 units
            expect(ordered.size).toBe(2);
        }
    });

    /*
     * TEST: AI handles single valid combination
     *
     * When there are exactly as many units as the card allows,
     * there's only one valid combination and the AI should order all.
     */
    test("AI handles single valid combination", () => {
        // Arrange: 2 units in center section, card orders 2 (ProbeCenter) = only 1 combination
        // Row 7 CENTER is q values 1-5
        const unitA = {q: 3, r: 7};
        const unitB = {q: 4, r: 7};

        const gameState = createOrderPhaseGameState(
            [unitA, unitB],
            [{q: 4, r: 1}], // Enemy in top-center
            99999
        );

        // Verify we have exactly 2 units
        const orderMoves = gameState.legalMoves().filter(m => m instanceof OrderUnitMove);
        expect(orderMoves.length).toBe(2);

        // Act
        const rng = new SeededRNG(99999);
        const aiPlayer = new RandomAIPlayer(rng);
        letAICompleteOrderPhase(gameState, aiPlayer);

        // Assert: AI should have ordered both units
        const orderedUnits = getOrderedUnits(gameState);
        expect(orderedUnits.size).toBe(2);
        expect(orderedUnits.has(`${unitA.q},${unitA.r}`)).toBe(true);
        expect(orderedUnits.has(`${unitB.q},${unitB.r}`)).toBe(true);
    });

    /*
     * TEST: AI selection is deterministic with same seed
     *
     * Given the same seed and setup, AI should always make the same choices.
     */
    test("AI selection is deterministic with same seed", () => {
        // Arrange: Create identical game states
        const seed = 42424242;

        function createAndRun(): string {
            const gs = createOrderPhaseGameState(
                [
                    {q: 2, r: 7},
                    {q: 3, r: 7},
                    {q: 4, r: 7},
                ],
                [{q: 3, r: 1}],
                seed
            );
            const ai = new RandomAIPlayer(new SeededRNG(seed));
            letAICompleteOrderPhase(gs, ai);
            return Array.from(getOrderedUnits(gs)).sort().join("|");
        }

        // Act: Run twice
        const result1 = createAndRun();
        const result2 = createAndRun();

        // Assert: Results should be identical
        expect(result1).toBe(result2);
    });

    /*
     * TEST: AI orders no units when none available
     *
     * Edge case: if no units can be ordered, AI should just confirm.
     */
    test("AI confirms immediately when no units can be ordered", () => {
        // Arrange: No friendly units in center section
        // Place units in LEFT section (q < 4 for low rows)
        const gameState = createOrderPhaseGameState(
            [], // No units
            [{q: 6, r: 1}],
            11111
        );

        // Verify no OrderUnitMoves available
        const legalMoves = gameState.legalMoves();
        const orderMoves = legalMoves.filter(m => m instanceof OrderUnitMove);
        expect(orderMoves.length).toBe(0);

        // Act
        const rng = new SeededRNG(11111);
        const aiPlayer = new RandomAIPlayer(rng);

        const selected = aiPlayer.selectMove(gameState, legalMoves);

        // Assert: AI should select ConfirmOrdersMove
        expect(selected).toBeInstanceOf(ConfirmOrdersMove);
    });
});
