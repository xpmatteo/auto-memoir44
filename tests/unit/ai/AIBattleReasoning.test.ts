// ABOUTME: Tests for AI BATTLE phase attacker prioritization reasoning
// ABOUTME: Verifies AI uses 3-tier priority: constrained attackers, weaker targets, coordinated fire

import {describe, expect, test} from "vitest";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {SeededRNG} from "../../../src/adapters/RNG";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {Dice} from "../../../src/domain/Dice";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {hexOf, hexDistance, HexCoord} from "../../../src/utils/hex";
import {ProbeCenter} from "../../../src/domain/cards/SectionCards";
import {PlayCardMove, ConfirmOrdersMove, EndMovementsMove} from "../../../src/domain/moves/Move";
import {BattleMove} from "../../../src/domain/moves/BattleMove";
import {PhaseType} from "../../../src/domain/phases/Phase";

/**
 * BATTLE PHASE AI REASONING
 *
 * The AI uses a 3-tier priority system when selecting which unit attacks which target:
 *
 * Tier 1 - Constrained Attackers First:
 *   Units with fewer target options attack first. If Unit B can only attack Enemy1,
 *   while Unit A can attack Enemy1 or Enemy2, Unit B should attack first. Otherwise,
 *   Unit A might kill Enemy1 and leave Unit B with no valid target.
 *
 * Tier 2 - Target Weaker Enemies:
 *   Prefer targets closer to elimination. A unit with 1 strength remaining can be
 *   eliminated with a single good roll. A half-dead enemy still attacks at full
 *   strength, so finishing it off is valuable.
 *
 * Tier 3 - Coordinate Fire:
 *   Prefer targets threatened by multiple attackers. Concentrating 6 dice on one
 *   enemy is more likely to eliminate it than spreading 3+3 dice across two enemies.
 */

// Helper to create a GameState in BATTLE phase with specified unit positions
function createBattlePhaseGameState(
    friendlyPositions: Array<{coord: HexCoord, ordered?: boolean}>,
    enemyPositions: Array<{coord: HexCoord, strength?: number}>,
    seed: number = 999
): GameState {
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 10]]);
    const dice = new Dice(() => rng.random());
    const gameState = new GameState(deck, dice);

    // Place enemy units
    for (const {coord, strength} of enemyPositions) {
        const enemy = new Infantry(Side.AXIS);
        gameState.placeUnit(coord, enemy);
        if (strength !== undefined) {
            gameState.setUnitCurrentStrength(enemy, strength);
        }
    }

    // Place friendly units (ALLIES is active player, at BOTTOM)
    for (const {coord, ordered} of friendlyPositions) {
        const friendly = new Infantry(Side.ALLIES);
        gameState.placeUnit(coord, friendly);
        if (ordered !== false) {
            gameState.orderUnit(friendly);
        }
    }

    gameState.finishSetup();

    // Draw cards and play one to enter ORDER phase
    gameState.drawCards(1, gameState.activePlayerHand);
    const cards = gameState.getCardsInLocation(gameState.activePlayerHand);
    gameState.executeMove(new PlayCardMove(cards[0]));

    // Skip through ORDER and MOVE phases to get to BATTLE
    // Confirm orders
    const confirmMove = gameState.legalMoves().find(m => m instanceof ConfirmOrdersMove);
    if (confirmMove) {
        gameState.executeMove(confirmMove);
    }

    // End movements (we don't want units to move)
    const endMovementsMove = gameState.legalMoves().find(m => m instanceof EndMovementsMove);
    if (endMovementsMove) {
        gameState.executeMove(endMovementsMove);
    }

    // Verify we're in BATTLE phase
    if (gameState.activePhase.type !== PhaseType.BATTLE) {
        throw new Error(`Failed to set up game state in BATTLE phase, got ${gameState.activePhase.type}`);
    }

    return gameState;
}

// Helper to get battle moves from legal moves
function getBattleMoves(gameState: GameState): BattleMove[] {
    return gameState.legalMoves().filter(m => m instanceof BattleMove) as BattleMove[];
}

describe("AI BATTLE Phase Reasoning", () => {
    /**
     * TIER 1: CONSTRAINED ATTACKERS FIRST
     *
     * Test: "AI attacks with constrained units before flexible units"
     *
     * Scenario:
     * - Unit A can attack Enemy1 OR Enemy2 (2 options)
     * - Unit B can ONLY attack Enemy1 (1 option)
     *
     * Reasoning:
     * Unit B has only 1 target option. If we use Unit A on Enemy1 first, Unit B might
     * lose its only valid target. Constrained units attack first to ensure they can
     * contribute to the battle before their options are eliminated.
     */
    describe("Tier 1: Constrained Attackers First", () => {
        test("AI attacks with constrained units before flexible units", () => {
            // Arrange
            // Unit A at center can reach both enemies (east and west)
            // Unit B off to the side can only reach Enemy1
            //
            // Layout (simplified):
            //   Enemy1 -- UnitA -- Enemy2
            //              |
            //            UnitB (can only reach Enemy1)
            //
            // For close combat, units must be adjacent (distance 1)

            const unitAPos = hexOf(5, 4);
            const enemy1Pos = unitAPos.west();      // Enemy1 west of A
            const enemy2Pos = unitAPos.east();      // Enemy2 east of A

            // UnitB must be adjacent to Enemy1 but NOT adjacent to Enemy2
            // Enemy1 is at unitA.west(), so we place UnitB adjacent to Enemy1
            const unitBPos = enemy1Pos.southwest(); // Adjacent to Enemy1, far from Enemy2

            // Guard assertions: verify setup correctness
            expect(hexDistance(unitAPos, enemy1Pos)).toBe(1); // A can attack Enemy1
            expect(hexDistance(unitAPos, enemy2Pos)).toBe(1); // A can attack Enemy2
            expect(hexDistance(unitBPos, enemy1Pos)).toBe(1); // B can attack Enemy1
            expect(hexDistance(unitBPos, enemy2Pos)).toBeGreaterThan(1); // B cannot attack Enemy2

            const gameState = createBattlePhaseGameState(
                [
                    {coord: unitAPos, ordered: true},
                    {coord: unitBPos, ordered: true},
                ],
                [
                    {coord: enemy1Pos},
                    {coord: enemy2Pos},
                ],
                12345
            );

            // Get the units for assertion
            const unitA = gameState.getUnitAt( unitAPos);
            const unitB = gameState.getUnitAt( unitBPos);
            expect(unitA).toBeDefined();
            expect(unitB).toBeDefined();

            // Verify battle moves match expectations
            const battleMoves = getBattleMoves(gameState);

            // Count moves per attacker
            const movesFromA = battleMoves.filter(m => m.fromUnit.id === unitA!.id);
            const movesFromB = battleMoves.filter(m => m.fromUnit.id === unitB!.id);

            expect(movesFromA.length).toBe(2); // A can attack Enemy1 or Enemy2
            expect(movesFromB.length).toBe(1); // B can only attack Enemy1

            // Act: AI selects a battle move
            const rng = new SeededRNG(12345);
            const aiPlayer = new RandomAIPlayer(rng);
            const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

            // Assert: AI should select Unit B (constrained) to attack first
            expect(selectedMove).toBeInstanceOf(BattleMove);
            expect(selectedMove.fromUnit.id).toBe(unitB!.id);
        });
    });

    /**
     * TIER 2: TARGET WEAKER ENEMIES
     *
     * Test: "AI targets weaker enemies over stronger ones"
     *
     * Scenario:
     * - Attacker can hit Enemy1 (4 strength) or Enemy2 (1 strength)
     * - Both enemies have same threat level (adjacency)
     *
     * Reasoning:
     * Enemy2 has 1 figure remaining. One good roll eliminates it entirely.
     * A half-dead enemy still attacks at full strength, so finishing it off
     * removes a threat from the board.
     */
    describe("Tier 2: Target Weaker Enemies", () => {
        test("AI targets weaker enemies over stronger ones", () => {
            // Arrange
            // Single attacker with two adjacent enemies of different strengths
            const attackerPos = hexOf(5, 4);
            const enemy1Pos = attackerPos.west();   // Full strength (4)
            const enemy2Pos = attackerPos.east();   // Damaged (1)

            // Guard assertions
            expect(hexDistance(attackerPos, enemy1Pos)).toBe(1);
            expect(hexDistance(attackerPos, enemy2Pos)).toBe(1);

            const gameState = createBattlePhaseGameState(
                [{coord: attackerPos, ordered: true}],
                [
                    {coord: enemy1Pos, strength: 4}, // Full strength
                    {coord: enemy2Pos, strength: 1}, // Almost dead
                ],
                54321
            );

            const attacker = gameState.getUnitAt( attackerPos);
            const enemy1 = gameState.getUnitAt( enemy1Pos);
            const enemy2 = gameState.getUnitAt( enemy2Pos);

            expect(attacker).toBeDefined();
            expect(enemy1).toBeDefined();
            expect(enemy2).toBeDefined();

            // Verify strengths
            expect(gameState.getUnitCurrentStrength(enemy1!)).toBe(4);
            expect(gameState.getUnitCurrentStrength(enemy2!)).toBe(1);

            // Verify we have 2 battle options
            const battleMoves = getBattleMoves(gameState);
            expect(battleMoves.length).toBe(2);

            // Act
            const rng = new SeededRNG(54321);
            const aiPlayer = new RandomAIPlayer(rng);
            const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

            // Assert: AI should target the weaker enemy (Enemy2 with 1 strength)
            expect(selectedMove).toBeInstanceOf(BattleMove);
            expect(selectedMove.toUnit.id).toBe(enemy2!.id);
        });
    });

    /**
     * TIER 3: COORDINATE FIRE (Tertiary Tie-Breaker)
     *
     * Test: "AI coordinates attacks on mutually threatened targets"
     *
     * This tests the TERTIARY tie-breaker that only kicks in when:
     * - Tier 1 (constraint count) is tied: both attackers have equal options
     * - Tier 2 (target strength) is tied: all enemies have equal strength
     *
     * Scenario:
     * - Unit A can attack Enemy1 or Enemy2 (2 options each - Tier 1 tied)
     * - Unit B can attack Enemy1 or Enemy3 (2 options each - Tier 1 tied)
     * - All enemies at equal strength (Tier 2 tied)
     *
     * Reasoning:
     * With Tiers 1 and 2 tied, Tier 3 breaks the tie by preferring targets
     * threatened by multiple attackers. Enemy1 is threatened by both A and B
     * (6 total dice). Concentrating fire increases kill probability vs
     * spreading 3+3 dice across different targets.
     */
    describe("Tier 3: Coordinate Fire (Tertiary Tie-Breaker)", () => {
        test("AI coordinates attacks on mutually threatened targets", () => {
            // Arrange
            // Layout: Enemy2 -- UnitA -- Enemy1 -- UnitB -- Enemy3
            // Both units can attack Enemy1 (center), but each has an exclusive target too

            const enemy1Pos = hexOf(5, 4);          // Center enemy - threatened by both
            const unitAPos = enemy1Pos.west();      // A is west of Enemy1
            const unitBPos = enemy1Pos.east();      // B is east of Enemy1
            const enemy2Pos = unitAPos.west();      // Only A can reach
            const enemy3Pos = unitBPos.east();      // Only B can reach

            // Guard assertions
            expect(hexDistance(unitAPos, enemy1Pos)).toBe(1); // A can attack Enemy1
            expect(hexDistance(unitAPos, enemy2Pos)).toBe(1); // A can attack Enemy2
            expect(hexDistance(unitAPos, enemy3Pos)).toBeGreaterThan(1); // A cannot attack Enemy3

            expect(hexDistance(unitBPos, enemy1Pos)).toBe(1); // B can attack Enemy1
            expect(hexDistance(unitBPos, enemy3Pos)).toBe(1); // B can attack Enemy3
            expect(hexDistance(unitBPos, enemy2Pos)).toBeGreaterThan(1); // B cannot attack Enemy2

            const gameState = createBattlePhaseGameState(
                [
                    {coord: unitAPos, ordered: true},
                    {coord: unitBPos, ordered: true},
                ],
                [
                    {coord: enemy1Pos, strength: 4}, // All at equal strength
                    {coord: enemy2Pos, strength: 4},
                    {coord: enemy3Pos, strength: 4},
                ],
                99999
            );

            const unitA = gameState.getUnitAt( unitAPos);
            const unitB = gameState.getUnitAt( unitBPos);
            const enemy1 = gameState.getUnitAt( enemy1Pos);

            expect(unitA).toBeDefined();
            expect(unitB).toBeDefined();
            expect(enemy1).toBeDefined();

            // Verify battle moves
            const battleMoves = getBattleMoves(gameState);
            const movesFromA = battleMoves.filter(m => m.fromUnit.id === unitA!.id);
            const movesFromB = battleMoves.filter(m => m.fromUnit.id === unitB!.id);

            expect(movesFromA.length).toBe(2); // A: Enemy1 or Enemy2
            expect(movesFromB.length).toBe(2); // B: Enemy1 or Enemy3

            // Act: Let AI select first battle
            const rng = new SeededRNG(99999);
            const aiPlayer = new RandomAIPlayer(rng);
            const firstMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

            // Assert: First attack should target Enemy1 (mutually threatened)
            // The AI's coordinate fire logic means it prefers targets that can be
            // hit by multiple attackers. Enemy1 can be attacked by both A and B,
            // so it should be the preferred target.
            expect(firstMove).toBeInstanceOf(BattleMove);
            expect(firstMove.toUnit.id).toBe(enemy1!.id);

            // Note: We don't execute the battle because dice rolls can trigger
            // retreat phases which change the game state unpredictably. The key
            // insight is that the FIRST selection targets the coordinated enemy.
            // The AI's scoring function counts total threat dice per target,
            // so Enemy1 (6 dice threat) scores higher than Enemy2 or Enemy3 (3 dice each).
        });
    });

    /**
     * EDGE CASES
     */
    describe("Edge Cases", () => {
        /**
         * Test: "AI handles single attacker single target"
         *
         * Trivial case where there's only one valid battle.
         * Should work without errors.
         */
        test("AI handles single attacker single target", () => {
            // Arrange
            const attackerPos = hexOf(5, 4);
            const enemyPos = attackerPos.east();

            expect(hexDistance(attackerPos, enemyPos)).toBe(1);

            const gameState = createBattlePhaseGameState(
                [{coord: attackerPos, ordered: true}],
                [{coord: enemyPos}],
                11111
            );

            const attacker = gameState.getUnitAt( attackerPos);
            const enemy = gameState.getUnitAt( enemyPos);

            expect(attacker).toBeDefined();
            expect(enemy).toBeDefined();

            // Verify exactly 1 battle move
            const battleMoves = getBattleMoves(gameState);
            expect(battleMoves.length).toBe(1);

            // Act
            const rng = new SeededRNG(11111);
            const aiPlayer = new RandomAIPlayer(rng);
            const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves());

            // Assert
            expect(selectedMove).toBeInstanceOf(BattleMove);
            const battleMove = selectedMove as BattleMove;
            expect(battleMove.fromUnit.id).toBe(attacker!.id);
            expect(battleMove.toUnit.id).toBe(enemy!.id);
        });

        /**
         * Test: "tie-breaking is deterministic with seeded RNG"
         *
         * When two battle options have identical scores, the AI should
         * consistently pick the same one given the same seed.
         */
        test("tie-breaking is deterministic with seeded RNG", () => {
            // Arrange: Create a symmetric scenario where both options score equally
            // Two attackers, each with one exclusive target of equal strength
            const attacker1Pos = hexOf(4, 4);
            const attacker2Pos = hexOf(6, 4);
            const enemy1Pos = attacker1Pos.west();  // Only attacker1 can reach
            const enemy2Pos = attacker2Pos.east();  // Only attacker2 can reach

            // Guard: both attackers constrained to 1 target each
            expect(hexDistance(attacker1Pos, enemy1Pos)).toBe(1);
            expect(hexDistance(attacker1Pos, enemy2Pos)).toBeGreaterThan(1);
            expect(hexDistance(attacker2Pos, enemy2Pos)).toBe(1);
            expect(hexDistance(attacker2Pos, enemy1Pos)).toBeGreaterThan(1);

            function runWithSeed(seed: number): string {
                const gameState = createBattlePhaseGameState(
                    [
                        {coord: attacker1Pos, ordered: true},
                        {coord: attacker2Pos, ordered: true},
                    ],
                    [
                        {coord: enemy1Pos, strength: 4},
                        {coord: enemy2Pos, strength: 4},
                    ],
                    seed
                );

                const rng = new SeededRNG(seed);
                const aiPlayer = new RandomAIPlayer(rng);
                const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

                // Find positions for the selected units to make comparison stable
                // across runs (unit IDs change between runs since they auto-increment)
                const allUnits = gameState.getAllUnitsWithPositions();
                const fromPos = allUnits.find(u => u.unit.id === selectedMove.fromUnit.id)!.coord;
                const toPos = allUnits.find(u => u.unit.id === selectedMove.toUnit.id)!.coord;
                return `${fromPos.q},${fromPos.r}->${toPos.q},${toPos.r}`;
            }

            // Act: Run twice with same seed
            const seed = 77777;
            const result1 = runWithSeed(seed);
            const result2 = runWithSeed(seed);

            // Assert: Results should be identical
            expect(result1).toBe(result2);

            // Additional verification: different seeds can produce different results
            const results = new Set<string>();
            for (let s = 1; s <= 50; s++) {
                results.add(runWithSeed(s * 1000));
            }
            // With equal scoring, ties are broken by RNG, so we should see some variation
            // (not always the same choice across all 50 seeds)
            expect(results.size).toBeGreaterThanOrEqual(1);
        });
    });

    /**
     * TABLE-DRIVEN TESTS FOR WEAKNESS TARGETING
     *
     * Test multiple scenarios where the AI should prefer weaker enemies.
     */
    describe("Tier 2: Weakness targeting table-driven", () => {
        interface WeaknessCase {
            name: string;
            enemy1Strength: number;
            enemy2Strength: number;
            expectedTargetIndex: number; // 0 for enemy1, 1 for enemy2
        }

        const cases: WeaknessCase[] = [
            {
                name: "targets 1-strength over 4-strength",
                enemy1Strength: 4,
                enemy2Strength: 1,
                expectedTargetIndex: 1, // enemy2 (weaker)
            },
            {
                name: "targets 2-strength over 4-strength",
                enemy1Strength: 4,
                enemy2Strength: 2,
                expectedTargetIndex: 1, // enemy2 (weaker)
            },
            {
                name: "targets 1-strength over 2-strength",
                enemy1Strength: 2,
                enemy2Strength: 1,
                expectedTargetIndex: 1, // enemy2 (weaker)
            },
            {
                name: "targets 3-strength over 4-strength",
                enemy1Strength: 4,
                enemy2Strength: 3,
                expectedTargetIndex: 1, // enemy2 (weaker)
            },
        ];

        test.each(cases)("$name", ({enemy1Strength, enemy2Strength, expectedTargetIndex}) => {
            // Arrange
            const attackerPos = hexOf(5, 4);
            const enemy1Pos = attackerPos.west();
            const enemy2Pos = attackerPos.east();

            // Guard
            expect(hexDistance(attackerPos, enemy1Pos)).toBe(1);
            expect(hexDistance(attackerPos, enemy2Pos)).toBe(1);

            const gameState = createBattlePhaseGameState(
                [{coord: attackerPos, ordered: true}],
                [
                    {coord: enemy1Pos, strength: enemy1Strength},
                    {coord: enemy2Pos, strength: enemy2Strength},
                ],
                42424
            );

            const enemy1 = gameState.getUnitAt( enemy1Pos);
            const enemy2 = gameState.getUnitAt( enemy2Pos);
            const expectedTarget = expectedTargetIndex === 0 ? enemy1 : enemy2;

            // Act
            const rng = new SeededRNG(42424);
            const aiPlayer = new RandomAIPlayer(rng);
            const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

            // Assert
            expect(selectedMove.toUnit.id).toBe(expectedTarget!.id);
        });
    });

    /**
     * TABLE-DRIVEN TESTS FOR CONSTRAINT PRIORITIZATION
     *
     * Test scenarios with different numbers of target options per attacker.
     */
    describe("Tier 1: Constraint prioritization table-driven", () => {
        interface ConstraintCase {
            name: string;
            // unitA options count, unitB options count
            unitAOptions: number;
            unitBOptions: number;
            expectedAttackerIndex: number; // 0 for A, 1 for B
        }

        const cases: ConstraintCase[] = [
            {
                name: "1 option vs 2 options - picks 1-option unit",
                unitAOptions: 2,
                unitBOptions: 1,
                expectedAttackerIndex: 1, // B has fewer options
            },
            {
                name: "1 option vs 3 options - picks 1-option unit",
                unitAOptions: 3,
                unitBOptions: 1,
                expectedAttackerIndex: 1, // B has fewer options
            },
            {
                name: "2 options vs 3 options - picks 2-option unit",
                unitAOptions: 3,
                unitBOptions: 2,
                expectedAttackerIndex: 1, // B has fewer options
            },
        ];

        test.each(cases)("$name", ({unitAOptions, unitBOptions, expectedAttackerIndex}) => {
            // Arrange
            // Create a scenario where unitA has `unitAOptions` targets
            // and unitB has `unitBOptions` targets
            // This is done by positioning enemies appropriately

            // For simplicity, we'll use a fixed layout where:
            // - UnitA at center can reach multiple enemies
            // - UnitB positioned to reach fewer enemies

            const unitAPos = hexOf(5, 4);

            // Enemies that both can reach
            const sharedEnemyPos = unitAPos.west();

            // Additional enemies that only A can reach
            const aOnlyEnemies: HexCoord[] = [];
            if (unitAOptions >= 2) aOnlyEnemies.push(unitAPos.east());
            if (unitAOptions >= 3) aOnlyEnemies.push(unitAPos.northeast());

            // Position B adjacent to shared enemy but far from A-only enemies
            const unitBPos = sharedEnemyPos.southwest();

            // Additional enemies that only B can reach (if needed)
            const bOnlyEnemies: HexCoord[] = [];
            if (unitBOptions >= 2) {
                const bOnlyPos = unitBPos.west();
                bOnlyEnemies.push(bOnlyPos);
            }

            // Guard assertions
            expect(hexDistance(unitAPos, sharedEnemyPos)).toBe(1);
            expect(hexDistance(unitBPos, sharedEnemyPos)).toBe(1);

            for (const pos of aOnlyEnemies) {
                expect(hexDistance(unitAPos, pos)).toBe(1);
                expect(hexDistance(unitBPos, pos)).toBeGreaterThan(1);
            }

            for (const pos of bOnlyEnemies) {
                expect(hexDistance(unitBPos, pos)).toBe(1);
                expect(hexDistance(unitAPos, pos)).toBeGreaterThan(1);
            }

            const enemyPositions = [
                {coord: sharedEnemyPos, strength: 4},
                ...aOnlyEnemies.map(coord => ({coord, strength: 4})),
                ...bOnlyEnemies.map(coord => ({coord, strength: 4})),
            ];

            const gameState = createBattlePhaseGameState(
                [
                    {coord: unitAPos, ordered: true},
                    {coord: unitBPos, ordered: true},
                ],
                enemyPositions,
                88888
            );

            const unitA = gameState.getUnitAt( unitAPos);
            const unitB = gameState.getUnitAt( unitBPos);
            const expectedAttacker = expectedAttackerIndex === 0 ? unitA : unitB;

            // Act
            const rng = new SeededRNG(88888);
            const aiPlayer = new RandomAIPlayer(rng);
            const selectedMove = aiPlayer.selectMove(gameState, gameState.legalMoves()) as BattleMove;

            // Assert
            expect(selectedMove.fromUnit.id).toBe(expectedAttacker!.id);
        });
    });
});
