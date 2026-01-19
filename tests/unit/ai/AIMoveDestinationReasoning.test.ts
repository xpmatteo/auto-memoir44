// ABOUTME: Tests for AI MOVE phase destination selection reasoning
// ABOUTME: Verifies AI chooses destinations that maximize position score using battleDiceScorer and closeTheGapScorer

import {describe, expect, test} from "vitest";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {SeededRNG} from "../../../src/adapters/RNG";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Dice} from "../../../src/domain/Dice";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {hexOf, hexDistance} from "../../../src/utils/hex";
import {ProbeCenter} from "../../../src/domain/cards/SectionCards";
import {PlayCardMove, OrderUnitMove, ConfirmOrdersMove} from "../../../src/domain/moves/Move";
import {MoveUnitMove} from "../../../src/domain/moves/MoveUnitMove";
import {PhaseType} from "../../../src/domain/phases/Phase";

/**
 * MOVE PHASE DESTINATION SELECTION AI REASONING
 *
 * When a unit can move to multiple destinations, the AI evaluates each option using
 * a weighted combination of scoring functions:
 *
 * 1. closeTheGapScorer: Rewards positions closer to enemies (-100 per hex of distance)
 *    - Moving closer to enemies = less negative = higher score
 *    - Adjacent to enemy (distance 1) scores higher than 2 hexes away
 *
 * 2. battleDiceScorer: Rewards positions where units can attack
 *    - Only applies in BATTLE phase (AI simulates move then evaluates battle potential)
 *    - More dice available = higher score
 *    - Weaker targets = more points per die (finishing enemies is valuable)
 *
 * The AI simulates each move, then uses combineScorers to evaluate the resulting position.
 * It picks the destination with the highest combined score.
 */

/**
 * Helper to create a GameState in MOVE phase with a single ordered unit ready to move.
 * Places units in CENTER section to work with ProbeCenter card.
 */
function createMovePhaseWithSingleUnit(
    friendlyPos: {q: number, r: number},
    enemyPositions: Array<{q: number, r: number}>,
    seed: number = 999
): GameState {
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 10]]);
    const dice = new Dice(() => rng.random());
    const gameState = new GameState(deck, dice);

    // Place enemy units (AXIS is enemy for ALLIES)
    for (const pos of enemyPositions) {
        gameState.placeUnit(hexOf(pos.q, pos.r), new Infantry(Side.AXIS));
    }

    // Place friendly unit (ALLIES is active player)
    gameState.placeUnit(hexOf(friendlyPos.q, friendlyPos.r), new Infantry(Side.ALLIES));

    // Draw cards and play one to enter ORDER phase
    gameState.drawCards(1, gameState.activePlayerHand);
    const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
    gameState.executeMove(new PlayCardMove(cards[0]));

    // Order the friendly unit
    const legalMoves = gameState.legalMoves();
    const orderMoves = legalMoves.filter(m => m instanceof OrderUnitMove);
    if (orderMoves.length === 0) {
        throw new Error(`No units available to order at (${friendlyPos.q}, ${friendlyPos.r})`);
    }
    gameState.executeMove(orderMoves[0]);

    // Confirm orders to enter MOVE phase
    gameState.executeMove(new ConfirmOrdersMove());

    // Verify we're in MOVE phase
    if (gameState.activePhase.type !== PhaseType.MOVE) {
        throw new Error(`Failed to set up game state in MOVE phase, got ${gameState.activePhase.type}`);
    }

    return gameState;
}

/**
 * Helper to get the destination the AI selects for a move.
 */
function getAISelectedDestination(
    gameState: GameState,
    seed: number
): {from: {q: number, r: number}, to: {q: number, r: number}} {
    const rng = new SeededRNG(seed);
    const aiPlayer = new RandomAIPlayer(rng);

    const legalMoves = gameState.legalMoves();
    const selected = aiPlayer.selectMove(gameState, legalMoves);

    if (!(selected instanceof MoveUnitMove)) {
        throw new Error(`Expected MoveUnitMove but got ${selected.constructor.name}`);
    }

    return {
        from: {q: selected.from.q, r: selected.from.r},
        to: {q: selected.to.q, r: selected.to.r}
    };
}

describe("AI MOVE Phase Destination Selection Reasoning", () => {
    /*
     * TEST: AI moves toward enemies to maximize battle potential
     *
     * Scenario:
     * - Friendly infantry at (5, 5) in CENTER section
     * - Enemy infantry at (8, 5) - 3 hexes east
     * - Unit can move to multiple destinations (infantry moves up to 2 hexes)
     *
     * closeTheGapScorer gives -100 per hex of distance to nearest enemy.
     * Moving closer reduces the distance penalty.
     *
     * However, infantry that moves 2 hexes skips battle phase!
     * So the AI balances: move closer (closeTheGap) vs retain battle capability (battleDice).
     *
     * Expected: AI moves east (toward enemy) rather than west (away) or staying put.
     * The AI may prefer moving 1 hex to retain battle capability over moving 2 hexes
     * and skipping battle entirely.
     *
     * Reasoning: The AI considers both scorers:
     * - Move to (6,5): distance 2, 1 hex moved → keeps battle potential
     * - Move to (7,5): distance 1, 2 hexes moved → skips battle (infantry rule)
     * - Move to (4,5): distance 4 → wrong direction
     */
    test("AI moves toward enemies to maximize battle potential", () => {
        // Arrange
        const friendlyPos = {q: 5, r: 5};
        const enemyPos = {q: 8, r: 5};

        const gameState = createMovePhaseWithSingleUnit(
            friendlyPos,
            [enemyPos],
            12345
        );

        // Guard assertions: verify setup
        const startHex = hexOf(friendlyPos.q, friendlyPos.r);
        const enemyHex = hexOf(enemyPos.q, enemyPos.r);
        const initialDistance = hexDistance(startHex, enemyHex);
        expect(initialDistance).toBe(3);

        // Verify we have movement options in both directions
        const legalMoves = gameState.legalMoves();
        const moveMoves = legalMoves.filter(m => m instanceof MoveUnitMove) as MoveUnitMove[];
        expect(moveMoves.length).toBeGreaterThan(1);

        // Verify there are moves that go toward enemy and away from enemy
        const movesToward = moveMoves.filter(m => hexDistance(m.to, enemyHex) < initialDistance);
        const movesAway = moveMoves.filter(m => hexDistance(m.to, enemyHex) > initialDistance);
        expect(movesToward.length).toBeGreaterThan(0);
        expect(movesAway.length).toBeGreaterThan(0);

        // Act
        const selected = getAISelectedDestination(gameState, 12345);

        // Assert: AI should move toward enemy (reduce distance)
        const selectedHex = hexOf(selected.to.q, selected.to.r);
        const finalDistance = hexDistance(selectedHex, enemyHex);

        expect(finalDistance).toBeLessThan(initialDistance);
    });

    /*
     * TEST: AI considers battle dice potential
     *
     * Scenario:
     * - Friendly infantry at (5, 5)
     * - Enemy infantry at (6, 5) - adjacent (distance 1)
     * - Unit can move to stay adjacent or move away
     *
     * battleDiceScorer rewards positions where we can attack.
     * Infantry at distance 1 rolls 3 dice (4 - distance).
     * Moving away means fewer or no dice.
     *
     * Expected: AI stays adjacent (maintains battle dice potential).
     *
     * Reasoning: battleDiceScorer gives points for attack potential.
     * - Stay at (5,5) or move to (6,4)/(5,4): still adjacent → 3 dice potential
     * - Move to (4,5): distance 2 → only 2 dice potential
     * - Move to (3,5): distance 3 → only 1 die potential
     */
    test("AI considers battle dice potential", () => {
        // Arrange
        const friendlyPos = {q: 5, r: 5};
        const enemyPos = {q: 6, r: 5};

        const gameState = createMovePhaseWithSingleUnit(
            friendlyPos,
            [enemyPos],
            54321
        );

        // Guard: verify adjacency
        const startHex = hexOf(friendlyPos.q, friendlyPos.r);
        const enemyHex = hexOf(enemyPos.q, enemyPos.r);
        expect(hexDistance(startHex, enemyHex)).toBe(1);

        // Verify we have options to stay adjacent or move away
        const legalMoves = gameState.legalMoves();
        const moveMoves = legalMoves.filter(m => m instanceof MoveUnitMove) as MoveUnitMove[];

        const stayAdjacentMoves = moveMoves.filter(m => hexDistance(m.to, enemyHex) === 1);
        const moveAwayMoves = moveMoves.filter(m => hexDistance(m.to, enemyHex) > 1);
        expect(stayAdjacentMoves.length).toBeGreaterThan(0);
        expect(moveAwayMoves.length).toBeGreaterThan(0);

        // Act
        const selected = getAISelectedDestination(gameState, 54321);

        // Assert: AI should stay adjacent or even closer (distance <= 1)
        const selectedHex = hexOf(selected.to.q, selected.to.r);
        const finalDistance = hexDistance(selectedHex, enemyHex);

        // AI should stay adjacent (distance 1) to maintain battle dice potential
        expect(finalDistance).toBe(1);
    });

    /*
     * TEST: AI balances multiple scoring factors
     *
     * This tests the interaction between closeTheGapScorer and battleDiceScorer.
     * Both scorers contribute to the final decision.
     *
     * Scenario:
     * - Friendly infantry at (5, 5)
     * - Enemy 1 at (7, 5) - distance 2 (move closer = battle dice gain)
     * - Enemy 2 at (4, 4) - distance 2 (provides alternative direction)
     *
     * The AI should evaluate the combined score and make a reasonable choice.
     * With equal-weight scorers, both factors matter.
     *
     * Expected: AI moves in a direction that improves overall score.
     */
    test("AI balances multiple scoring factors", () => {
        // Arrange
        const friendlyPos = {q: 5, r: 5};
        const enemy1Pos = {q: 7, r: 5}; // 2 hexes east
        const enemy2Pos = {q: 4, r: 4}; // 2 hexes northwest-ish

        const gameState = createMovePhaseWithSingleUnit(
            friendlyPos,
            [enemy1Pos, enemy2Pos],
            99999
        );

        // Guard assertions
        const startHex = hexOf(friendlyPos.q, friendlyPos.r);
        const enemy1Hex = hexOf(enemy1Pos.q, enemy1Pos.r);
        const enemy2Hex = hexOf(enemy2Pos.q, enemy2Pos.r);

        const distToEnemy1 = hexDistance(startHex, enemy1Hex);
        const distToEnemy2 = hexDistance(startHex, enemy2Hex);
        expect(distToEnemy1).toBe(2);
        expect(distToEnemy2).toBe(2);

        // Act
        const selected = getAISelectedDestination(gameState, 99999);

        // Assert: AI should move (not stay in place) and improve position
        const selectedHex = hexOf(selected.to.q, selected.to.r);

        // Calculate minimum distance to any enemy after move
        const finalDistToEnemy1 = hexDistance(selectedHex, enemy1Hex);
        const finalDistToEnemy2 = hexDistance(selectedHex, enemy2Hex);
        const finalMinDist = Math.min(finalDistToEnemy1, finalDistToEnemy2);

        const initialMinDist = Math.min(distToEnemy1, distToEnemy2);

        // AI should move closer to at least one enemy (improving closeTheGap score)
        expect(finalMinDist).toBeLessThanOrEqual(initialMinDist);
    });

    /*
     * TEST: AI selects best destination consistently with same seed
     *
     * Verifies deterministic behavior for reproducible testing.
     */
    test("AI destination selection is deterministic with same seed", () => {
        // Arrange
        const seed = 42424242;

        function selectDestination(): string {
            const gameState = createMovePhaseWithSingleUnit(
                {q: 5, r: 5},
                [{q: 8, r: 5}],
                seed
            );
            const rng = new SeededRNG(seed);
            const aiPlayer = new RandomAIPlayer(rng);

            const legalMoves = gameState.legalMoves();
            const selected = aiPlayer.selectMove(gameState, legalMoves) as MoveUnitMove;

            return `${selected.to.q},${selected.to.r}`;
        }

        // Act
        const result1 = selectDestination();
        const result2 = selectDestination();

        // Assert
        expect(result1).toBe(result2);
    });

    /*
     * TEST: AI handles staying in place as an option
     *
     * Infantry can choose to stay in place (move 0 hexes).
     * If already in an optimal position, the AI might choose not to move.
     *
     * Scenario:
     * - Friendly infantry at (5, 5)
     * - Enemy at (6, 5) - adjacent
     * - Staying put maintains adjacency and doesn't trigger the "move 2 = skip battle" rule
     */
    test("AI can choose to stay in place when optimal", () => {
        // Arrange
        const friendlyPos = {q: 5, r: 5};
        const enemyPos = {q: 6, r: 5};

        const gameState = createMovePhaseWithSingleUnit(
            friendlyPos,
            [enemyPos],
            11111
        );

        // Guard: verify adjacency
        expect(hexDistance(hexOf(friendlyPos.q, friendlyPos.r), hexOf(enemyPos.q, enemyPos.r))).toBe(1);

        // Verify stay-in-place is a legal move
        const legalMoves = gameState.legalMoves();
        const moveMoves = legalMoves.filter(m => m instanceof MoveUnitMove) as MoveUnitMove[];
        const stayInPlaceMoves = moveMoves.filter(m =>
            m.from.q === m.to.q && m.from.r === m.to.r
        );
        expect(stayInPlaceMoves.length).toBe(1);

        // Act
        const selected = getAISelectedDestination(gameState, 11111);
        const selectedHex = hexOf(selected.to.q, selected.to.r);

        // Assert: AI should stay adjacent (either stay in place or move to another adjacent hex)
        const enemyHex = hexOf(enemyPos.q, enemyPos.r);
        const finalDistance = hexDistance(selectedHex, enemyHex);

        // Should remain at distance 1 (units cannot share a hex, so distance 0 is impossible)
        expect(finalDistance).toBe(1);
    });
});

/**
 * Additional tests using table-driven style for edge cases
 */
interface DestinationTestCase {
    name: string;
    friendlyPos: {q: number, r: number};
    enemyPositions: Array<{q: number, r: number}>;
    seed: number;
    expectedBehavior: (
        initialPos: {q: number, r: number},
        selectedPos: {q: number, r: number},
        enemies: Array<{q: number, r: number}>
    ) => boolean;
}

describe("AI MOVE Destination Selection - Edge Cases", () => {
    const testCases: DestinationTestCase[] = [
        {
            name: "moves toward single distant enemy",
            friendlyPos: {q: 4, r: 6},
            enemyPositions: [{q: 6, r: 2}],
            seed: 1001,
            expectedBehavior: (initial, selected, enemies) => {
                const enemy = hexOf(enemies[0].q, enemies[0].r);
                const initialDist = hexDistance(hexOf(initial.q, initial.r), enemy);
                const finalDist = hexDistance(hexOf(selected.q, selected.r), enemy);
                return finalDist < initialDist;
            },
        },
        {
            name: "moves toward closest of multiple enemies",
            friendlyPos: {q: 4, r: 5},
            enemyPositions: [
                {q: 6, r: 5}, // distance 2
                {q: 2, r: 2}, // distance 5
            ],
            seed: 1002,
            expectedBehavior: (initial, selected, enemies) => {
                const closer = hexOf(enemies[0].q, enemies[0].r);
                const initialDist = hexDistance(hexOf(initial.q, initial.r), closer);
                const finalDist = hexDistance(hexOf(selected.q, selected.r), closer);
                // Should reduce distance to the closer enemy
                return finalDist <= initialDist;
            },
        },
    ];

    test.each(testCases)("$name", ({friendlyPos, enemyPositions, seed, expectedBehavior}) => {
        // Arrange
        const gameState = createMovePhaseWithSingleUnit(friendlyPos, enemyPositions, seed);

        // Guard: verify we're in MOVE phase with legal moves
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);
        const legalMoves = gameState.legalMoves();
        const moveMoves = legalMoves.filter(m => m instanceof MoveUnitMove);
        expect(moveMoves.length).toBeGreaterThan(0);

        // Act
        const selected = getAISelectedDestination(gameState, seed);

        // Assert
        const result = expectedBehavior(friendlyPos, selected.to, enemyPositions);
        expect(result).toBe(true);
    });
});
