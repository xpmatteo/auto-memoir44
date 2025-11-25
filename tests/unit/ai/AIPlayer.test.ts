// ABOUTME: Unit tests for AI player move selection logic
// ABOUTME: Tests RandomAIPlayer behavior with seeded RNG and edge cases

import {expect, test, describe} from "vitest";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {SeededRNG} from "../../../src/adapters/RNG";
import {PlayCardMove} from "../../../src/domain/Move";
import {ProbeCenter} from "../../../src/domain/CommandCard";

describe("RandomAIPlayer", () => {
    test("selects a move from available legal moves", () => {
        const aiPlayer = new RandomAIPlayer();
        const card1 = new ProbeCenter();
        const card2 = new ProbeCenter();
        const moves = [new PlayCardMove(card1), new PlayCardMove(card2)];

        const selected = aiPlayer.selectMove(moves, Math.random);

        // Should select one of the available moves
        expect(moves).toContain(selected);
    });

    test("selection is deterministic with seeded RNG", () => {
        const aiPlayer = new RandomAIPlayer();
        const card1 = new ProbeCenter();
        const card2 = new ProbeCenter();
        const card3 = new ProbeCenter();
        const moves = [new PlayCardMove(card1), new PlayCardMove(card2), new PlayCardMove(card3)];

        // First selection with seed 42
        const rng1 = new SeededRNG(42);
        const selected1 = aiPlayer.selectMove(moves, () => rng1.random());

        // Second selection with same seed
        const rng2 = new SeededRNG(42);
        const selected2 = aiPlayer.selectMove(moves, () => rng2.random());

        // Should select the same move
        expect(selected1).toBe(selected2);
    });

    test("distributes selections across multiple moves", () => {
        const aiPlayer = new RandomAIPlayer();
        const card1 = new ProbeCenter();
        const card2 = new ProbeCenter();
        const card3 = new ProbeCenter();
        const move1 = new PlayCardMove(card1);
        const move2 = new PlayCardMove(card2);
        const move3 = new PlayCardMove(card3);
        const moves = [move1, move2, move3];

        // Track which moves are selected
        const selectedMoves = new Set<PlayCardMove>();

        // Run 100 selections with different random values
        for (let i = 0; i < 100; i++) {
            const selected = aiPlayer.selectMove(moves, Math.random);
            selectedMoves.add(selected as PlayCardMove);
        }

        // Over 100 trials, should have selected all three moves at least once
        expect(selectedMoves.size).toBe(3);
    });

    test("always selects the single move when only one is available", () => {
        const aiPlayer = new RandomAIPlayer();
        const card = new ProbeCenter();
        const moves = [new PlayCardMove(card)];

        // Run multiple times to ensure consistent behavior
        for (let i = 0; i < 10; i++) {
            const selected = aiPlayer.selectMove(moves, Math.random);
            expect(selected).toBe(moves[0]);
        }
    });

    test("throws error when no legal moves available", () => {
        const aiPlayer = new RandomAIPlayer();
        const moves: any[] = [];

        expect(() => {
            aiPlayer.selectMove(moves, Math.random);
        }).toThrow("No legal moves available for AI to select");
    });

    test("uses RNG function correctly following Dice/Deck pattern", () => {
        const aiPlayer = new RandomAIPlayer();
        const card1 = new ProbeCenter();
        const card2 = new ProbeCenter();
        const moves = [new PlayCardMove(card1), new PlayCardMove(card2)];

        // Create a controlled RNG that returns specific values
        let callCount = 0;
        const controlledRng = () => {
            callCount++;
            // First call returns 0.0 (should select index 0)
            if (callCount === 1) return 0.0;
            // Second call returns 0.6 (should select index 1 with 2 items)
            if (callCount === 2) return 0.6;
            return 0.0;
        };

        const selected1 = aiPlayer.selectMove(moves, controlledRng);
        expect(selected1).toBe(moves[0]); // 0.0 * 2 = 0, floor = 0

        const selected2 = aiPlayer.selectMove(moves, controlledRng);
        expect(selected2).toBe(moves[1]); // 0.6 * 2 = 1.2, floor = 1

        expect(callCount).toBe(2);
    });
});
