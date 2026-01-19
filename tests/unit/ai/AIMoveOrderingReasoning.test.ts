// ABOUTME: Tests for AI MOVE phase unit ordering optimization reasoning
// ABOUTME: Verifies AI tries different movement orderings to avoid blocking and maximize score

import {describe, expect, test, vi} from "vitest";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {SeededRNG} from "../../../src/adapters/RNG";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Dice} from "../../../src/domain/Dice";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {hexOf, hexDistance, HexCoord} from "../../../src/utils/hex";
import {ProbeCenter} from "../../../src/domain/cards/SectionCards";
import {PlayCardMove, OrderUnitMove, ConfirmOrdersMove} from "../../../src/domain/moves/Move";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";
import {PhaseType} from "../../../src/domain/phases/Phase";

/**
 * MOVE PHASE AI REASONING: Unit Ordering Optimization
 *
 * When multiple units can move, the ORDER of movement matters because:
 * - Unit A moving first might block Unit B's path (or vice versa)
 * - The AI generates all permutations of unit orderings
 * - For each permutation, it simulates greedy best-move selection
 * - It picks the ordering that yields the best final position score
 *
 * Example "vertical line" scenario:
 * - Unit A (rear) at hex (4, 7) - distance 6 from enemy
 * - Unit B (front) at hex (4, 6) - distance 5 from enemy
 * - Enemy at hex (4, 1)
 * - If A moves first to (4, 6), it takes B's spot, blocking B's path
 * - If B moves first to (4, 5), A can then move to (4, 6)
 *
 * The AI should detect this and move units in the optimal order.
 */

// Helper to create a GameState in MOVE phase with ordered units ready to move
function createMovePhaseGameState(
    friendlyPositions: Array<{q: number, r: number}>,
    enemyPositions: Array<{q: number, r: number}> = [{q: 4, r: 1}],
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

    // Order all friendly units (up to the card's limit of 2)
    let orderedCount = 0;
    const maxOrders = 2; // ProbeCenter allows 2 units
    while (orderedCount < maxOrders) {
        const legalMoves = gameState.legalMoves();
        const orderMoves = legalMoves.filter(m => m instanceof OrderUnitMove);
        if (orderMoves.length === 0) break;
        gameState.executeMove(orderMoves[0]);
        orderedCount++;
    }

    // Confirm orders to enter MOVE phase
    gameState.executeMove(new ConfirmOrdersMove());

    // Verify we're in MOVE phase
    if (gameState.activePhase.type !== PhaseType.MOVE) {
        throw new Error(`Failed to set up game state in MOVE phase, got ${gameState.activePhase.type}`);
    }

    return gameState;
}

// Helper to track move history during AI execution
interface MoveRecord {
    from: HexCoord;
    to: HexCoord;
}

// Helper to let AI complete MOVE phase and record moves
function letAICompleteMovePhase(gameState: GameState, aiPlayer: RandomAIPlayer): MoveRecord[] {
    const moves: MoveRecord[] = [];
    const maxMoves = 10; // Prevent infinite loops
    let moveCount = 0;

    while (gameState.activePhase.type === PhaseType.MOVE && moveCount < maxMoves) {
        const legalMoves = gameState.legalMoves();
        const selected = aiPlayer.selectMove(gameState, legalMoves);

        // Record MoveUnitMoves
        if (selected instanceof MoveUnitMove) {
            moves.push({from: selected.from, to: selected.to});
        }

        gameState.executeMove(selected);
        moveCount++;
    }

    return moves;
}

describe("AI MOVE Phase Unit Ordering Reasoning", () => {
    /*
     * TEST: AI picks unit ordering that avoids blocking
     *
     * Scenario: "Vertical line" where two units form a column toward the enemy
     * - Unit A (rear) at hex (4, 7) - distance 6 from enemy
     * - Unit B (front) at hex (4, 6) - distance 5 from enemy
     * - Enemy at hex (4, 1)
     *
     * Key insight:
     * - If A moves first toward enemy (northwest to 4,6), it takes B's current spot
     *   which forces B to move to a less optimal position
     * - If B moves first (northwest to 4,5), B advances and A can then advance
     *   into B's vacated spot (4,6)
     *
     * The AI should evaluate both orderings [A, B] and [B, A] and pick
     * the one that results in the best final position score.
     *
     * Expected: Unit B (the front unit closer to enemy) moves first,
     * allowing both units to advance optimally toward the enemy.
     */
    test("AI picks unit ordering that avoids blocking", () => {
        // Arrange: Create "vertical line" scenario
        // Unit B at (4,6) row 6 CENTER, Unit A at B.southwest() row 7 CENTER
        const unitBPos = hexOf(4, 6); // Front unit (closer to enemy)
        const unitAPos = unitBPos.southwest(); // Rear unit (farther from enemy)
        const enemyPos = hexOf(4, 1); // Enemy straight ahead

        const gameState = createMovePhaseGameState(
            [{q: unitAPos.q, r: unitAPos.r}, {q: unitBPos.q, r: unitBPos.r}],
            [{q: enemyPos.q, r: enemyPos.r}],
            12345
        );

        // Guard assertions: verify test setup
        // A and B should be adjacent (distance 1)
        expect(hexDistance(unitAPos, unitBPos)).toBe(1);

        // B should be closer to enemy than A
        const distA = hexDistance(unitAPos, enemyPos);
        const distB = hexDistance(unitBPos, enemyPos);
        expect(distB).toBeLessThan(distA);

        // Verify both units are ordered
        const orderedUnits = gameState.getOrderedUnitsWithPositions();
        expect(orderedUnits.length).toBe(2);

        // Act: let AI complete MOVE phase
        const rng = new SeededRNG(12345);
        const aiPlayer = new RandomAIPlayer(rng);
        const moves = letAICompleteMovePhase(gameState, aiPlayer);

        // Assert: AI should have moved both units
        expect(moves.length).toBe(2);

        // The front unit (B at 4,6) should move first to avoid blocking the rear unit
        // This allows both units to advance toward the enemy optimally
        const firstMoveFrom = moves[0].from;
        // HexCoord uses Flyweight pattern, so we can compare by reference
        expect(firstMoveFrom).toBe(unitBPos);

        /*
         * Reasoning:
         * Moving B first: B advances toward enemy (e.g., to 4,5), A can then advance
         * into B's vacated spot (4,6). Both units reach optimal positions closer to enemy.
         *
         * Moving A first: A might move into B's spot (4,6), forcing B to take a lateral
         * or backward position instead of advancing.
         *
         * AI evaluates both orderings [A, B] and [B, A] and picks [B, A] because it
         * yields a higher final position score.
         */
    });

    /*
     * TEST: AI evaluates all permutations
     *
     * With 3 ordered units, there are 3! = 6 possible orderings.
     * The AI should evaluate all 6 to find the optimal one.
     *
     * We spy on simulateUnitOrdering to verify it's called 6 times.
     */
    test("AI evaluates all permutations for 3 units", () => {
        // Arrange: 3 units in center section
        // ProbeCenter only orders 2 units, so we manually order all 3 units
        // to test the permutation logic with 3! = 6 orderings
        const rng = new SeededRNG(54321);
        const deck = Deck.createFromComposition([[ProbeCenter, 10]]);
        const dice = new Dice(() => rng.random());
        const gameState = new GameState(deck, dice);

        // Place enemy
        gameState.placeUnit(hexOf(4, 1), new Infantry(Side.AXIS));

        // Place 3 friendly units in center section
        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const unit3 = new Infantry(Side.ALLIES);
        gameState.placeUnit(hexOf(2, 7), unit1);
        gameState.placeUnit(hexOf(3, 7), unit2);
        gameState.placeUnit(hexOf(4, 7), unit3);

        // Draw and play card
        gameState.drawCards(1, gameState.activePlayerHand);
        const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
        gameState.executeMove(new PlayCardMove(cards[0]));

        // Manually order all 3 units to test 3! = 6 permutations
        gameState.orderUnit(unit1);
        gameState.orderUnit(unit2);
        gameState.orderUnit(unit3);

        // Confirm orders to enter MOVE phase
        gameState.executeMove(new ConfirmOrdersMove());
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Verify 3 units are ordered
        const orderedUnits = gameState.getOrderedUnitsWithPositions();
        expect(orderedUnits.length).toBe(3);

        // Create AI with spy on simulateUnitOrdering
        const aiRng = new SeededRNG(54321);
        const aiPlayer = new RandomAIPlayer(aiRng);

        // Access private method via prototype for spying
        // Note: simulateUnitOrdering is called by computeOptimalUnitOrdering
        const simulateSpy = vi.spyOn(aiPlayer as any, 'simulateUnitOrdering');

        // Act: let AI make one move (which triggers ordering computation)
        const legalMoves = gameState.legalMoves();
        aiPlayer.selectMove(gameState, legalMoves);

        // Assert: simulateUnitOrdering should be called 6 times (3! permutations)
        expect(simulateSpy.mock.calls.length).toBe(6);

        simulateSpy.mockRestore();
    });

    /*
     * TEST: Single unit needs no ordering optimization
     *
     * With only 1 ordered unit, there's only 1 permutation (the unit itself).
     * The AI should move it without the overhead of permutation evaluation.
     */
    test("single unit needs no ordering optimization", () => {
        // Arrange: 1 unit in center section
        const unitPos = hexOf(3, 7);
        const enemyPos = hexOf(4, 1);

        const rng = new SeededRNG(99999);
        const deck = Deck.createFromComposition([[ProbeCenter, 10]]);
        const dice = new Dice(() => rng.random());
        const gameState = new GameState(deck, dice);

        // Place enemy and friendly unit
        gameState.placeUnit(enemyPos, new Infantry(Side.AXIS));
        const friendlyUnit = new Infantry(Side.ALLIES);
        gameState.placeUnit(unitPos, friendlyUnit);

        // Draw and play card
        gameState.drawCards(1, gameState.activePlayerHand);
        const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
        gameState.executeMove(new PlayCardMove(cards[0]));

        // Order only 1 unit
        gameState.orderUnit(friendlyUnit);
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Verify 1 unit is ordered
        const orderedUnits = gameState.getOrderedUnitsWithPositions();
        expect(orderedUnits.length).toBe(1);

        // Create AI with spy
        const aiRng = new SeededRNG(99999);
        const aiPlayer = new RandomAIPlayer(aiRng);
        const simulateSpy = vi.spyOn(aiPlayer as any, 'simulateUnitOrdering');

        // Act: let AI complete MOVE phase
        const moves = letAICompleteMovePhase(gameState, aiPlayer);

        // Assert: AI should have moved the unit
        expect(moves.length).toBe(1);
        // HexCoord uses Flyweight pattern, so we can compare by reference
        expect(moves[0].from).toBe(unitPos);

        // simulateUnitOrdering should NOT be called (single unit = no permutation needed)
        // The AI's computeOptimalUnitOrdering returns early for 0 or 1 units
        expect(simulateSpy.mock.calls.length).toBe(0);

        simulateSpy.mockRestore();
    });

    /*
     * TEST: AI ordering is deterministic with same seed
     *
     * Given the same seed and setup, AI should always produce the same
     * unit ordering and final positions.
     */
    test("AI ordering is deterministic with same seed", () => {
        const seed = 77777;

        function runScenario(): string {
            const gameState = createMovePhaseGameState(
                [{q: 3, r: 7}, {q: 4, r: 7}],
                [{q: 4, r: 1}],
                seed
            );
            const ai = new RandomAIPlayer(new SeededRNG(seed));
            const moves = letAICompleteMovePhase(gameState, ai);
            // Return move sequence as string for comparison
            return moves.map(m => `${m.from.q},${m.from.r}->${m.to.q},${m.to.r}`).join("|");
        }

        // Act: Run twice
        const result1 = runScenario();
        const result2 = runScenario();

        // Assert: Results should be identical
        expect(result1).toBe(result2);
    });

    /*
     * TEST: Zero ordered units is handled gracefully
     *
     * Edge case: If we somehow enter MOVE phase with no ordered units,
     * the AI should handle this gracefully without errors.
     * This can happen if a card allows ordering 0 units or all units were eliminated.
     */
    test("zero ordered units is handled gracefully", () => {
        // Arrange: Set up MOVE phase with no ordered units
        const enemyPos = hexOf(4, 1);

        const rng = new SeededRNG(11111);
        const deck = Deck.createFromComposition([[ProbeCenter, 10]]);
        const dice = new Dice(() => rng.random());
        const gameState = new GameState(deck, dice);

        // Place enemy (but no friendly units to order)
        gameState.placeUnit(enemyPos, new Infantry(Side.AXIS));

        // Draw and play card
        gameState.drawCards(1, gameState.activePlayerHand);
        const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
        gameState.executeMove(new PlayCardMove(cards[0]));

        // Confirm orders without ordering any units
        gameState.executeMove(new ConfirmOrdersMove());

        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Verify no units are ordered
        const orderedUnits = gameState.getOrderedUnitsWithPositions();
        expect(orderedUnits.length).toBe(0);

        // Create AI with spy
        const aiRng = new SeededRNG(11111);
        const aiPlayer = new RandomAIPlayer(aiRng);
        const simulateSpy = vi.spyOn(aiPlayer as any, 'simulateUnitOrdering');

        // Act: let AI complete MOVE phase (should exit immediately or end movements)
        const moves = letAICompleteMovePhase(gameState, aiPlayer);

        // Assert: No unit moves should occur
        expect(moves.length).toBe(0);

        // simulateUnitOrdering should NOT be called (no units = no permutation needed)
        expect(simulateSpy.mock.calls.length).toBe(0);

        simulateSpy.mockRestore();
    });
});
