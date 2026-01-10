// ABOUTME: Acceptance tests for AI movement toward enemies
// ABOUTME: Verifies AI uses close-the-gap scorer to approach distant enemies

import { describe, expect, test } from "vitest";
import { GameState } from "../../../src/domain/GameState";
import { Deck } from "../../../src/domain/Deck";
import { CardLocation } from "../../../src/domain/cards/CommandCard";
import { ProbeCenter } from "../../../src/domain/cards/SectionCards";
import { ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, PlayCardMove, ReplenishHandMove } from "../../../src/domain/moves/Move";
import { Position, Side } from "../../../src/domain/Player";
import { SeededRNG } from "../../../src/adapters/RNG";
import { Dice } from "../../../src/domain/Dice";
import { RandomAIPlayer } from "../../../src/ai/AIPlayer";
import { Infantry } from "../../../src/domain/Unit";
import { hexDistance, hexOf } from "../../../src/utils/hex";
import { PhaseType } from "../../../src/domain/phases/Phase";
import { MoveUnitMove } from "../../../src/domain/moves/MoveUnitMove";

describe("AI approaches enemies", () => {
    test("AI moves unit closer to enemy when no battle is available", () => {
        // Given: AI (TOP/AXIS) has a unit far from any enemy
        const seed = 42;
        const rng = new SeededRNG(seed);
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));

        // Place AI unit (AXIS) in center section, far from enemies
        // AI is TOP player, so center is around q=5-6
        const aiUnitStartPos = hexOf(5, 1);
        const aiUnit = new Infantry(Side.AXIS);
        gameState.placeUnit(aiUnitStartPos, aiUnit);

        // Place enemy unit (ALLIES) far away - more than 3 hexes (outside battle range)
        const enemyPos = hexOf(5, 7);
        const enemyUnit = new Infantry(Side.ALLIES);
        gameState.placeUnit(enemyPos, enemyUnit);

        // Guard: verify they are far apart (no battle possible)
        const initialDistance = hexDistance(aiUnitStartPos, enemyPos);
        expect(initialDistance).toBeGreaterThan(3); // Infantry range is 3

        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Complete bottom player's turn to make AI active
        const playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(playedCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());
        const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState.executeMove(replenishMove!);

        // Verify AI (TOP) is now active
        expect(gameState.activePlayer.position).toBe(Position.TOP);

        // When: AI plays card, orders unit, and moves
        const aiPlayer = new RandomAIPlayer(rng);

        // AI plays card (ProbeCenter orders units in center)
        let legalMoves = gameState.legalMoves();
        let move = aiPlayer.selectMove(gameState.clone(), legalMoves);
        gameState.executeMove(move);

        // AI orders the unit (should order our unit since it's in center)
        while (gameState.activePhase.type === PhaseType.ORDER) {
            legalMoves = gameState.legalMoves();
            move = aiPlayer.selectMove(gameState.clone(), legalMoves);
            gameState.executeMove(move);
        }

        // Verify we're now in MOVE phase
        expect(gameState.activePhase.type).toBe(PhaseType.MOVE);

        // Track the move made
        legalMoves = gameState.legalMoves();
        const moveUnitMoves = legalMoves.filter(m => m instanceof MoveUnitMove) as MoveUnitMove[];
        expect(moveUnitMoves.length).toBeGreaterThan(0);

        move = aiPlayer.selectMove(gameState.clone(), legalMoves);
        expect(move).toBeInstanceOf(MoveUnitMove);
        const selectedMove = move as MoveUnitMove;
        gameState.executeMove(move);

        // Then: The unit moved closer to the enemy
        const newDistance = hexDistance(selectedMove.to, enemyPos);
        expect(newDistance).toBeLessThan(initialDistance);
    });

    test("AI consistently chooses moves that close distance across multiple seeds", () => {
        // Test that across different seeds, the AI generally moves closer
        const seeds = [100, 200, 300, 400, 500];
        let closerCount = 0;

        for (const seed of seeds) {
            const rng = new SeededRNG(seed);
            const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
            const gameState = new GameState(deck, new Dice(() => rng.random()));

            // Setup: AI unit far from enemy
            const aiUnitStartPos = hexOf(5, 1);
            gameState.placeUnit(aiUnitStartPos, new Infantry(Side.AXIS));

            const enemyPos = hexOf(5, 7);
            gameState.placeUnit(enemyPos, new Infantry(Side.ALLIES));

            const initialDistance = hexDistance(aiUnitStartPos, enemyPos);

            gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
            gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

            // Complete bottom player's turn
            const playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
            gameState.executeMove(new PlayCardMove(playedCard));
            gameState.executeMove(new ConfirmOrdersMove());
            gameState.executeMove(new EndMovementsMove());
            gameState.executeMove(new EndBattlesMove());
            const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
            gameState.executeMove(replenishMove!);

            const aiPlayer = new RandomAIPlayer(rng);

            // AI plays card
            let legalMoves = gameState.legalMoves();
            let move = aiPlayer.selectMove(gameState.clone(), legalMoves);
            gameState.executeMove(move);

            // AI orders
            while (gameState.activePhase.type === PhaseType.ORDER) {
                legalMoves = gameState.legalMoves();
                move = aiPlayer.selectMove(gameState.clone(), legalMoves);
                gameState.executeMove(move);
            }

            // AI moves
            if (gameState.activePhase.type === PhaseType.MOVE) {
                legalMoves = gameState.legalMoves();
                const moveUnitMoves = legalMoves.filter(m => m instanceof MoveUnitMove);
                if (moveUnitMoves.length > 0) {
                    move = aiPlayer.selectMove(gameState.clone(), legalMoves);
                    if (move instanceof MoveUnitMove) {
                        const newDistance = hexDistance(move.to, enemyPos);
                        if (newDistance < initialDistance) {
                            closerCount++;
                        }
                    }
                }
            }
        }

        // AI should move closer in most cases (at least 80%)
        expect(closerCount).toBeGreaterThanOrEqual(Math.floor(seeds.length * 0.8));
    });
});
