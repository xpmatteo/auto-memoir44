// ABOUTME: Acceptance tests for AI player turn completion
// ABOUTME: Verifies AI can complete full turns using random move selection

import {expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../../src/domain/CommandCard";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, PlayCardMove, ReplenishHandMove} from "../../../src/domain/Move";
import {Position} from "../../../src/domain/Player";
import {SeededRNG} from "../../../src/adapters/RNG";
import {Dice} from "../../../src/domain/Dice";
import type {Move} from "../../../src/domain/Move";
import type {AIPlayer} from "../../../src/ai/AIPlayer";

// Helper function for tests (bypasses setTimeout for synchronous execution)
function playFullAITurn(gameState: GameState, aiPlayer: AIPlayer): void {
    const maxIterations = 100; // Safety limit to prevent infinite loops
    let iterations = 0;

    while (gameState.activePlayer.position === Position.TOP && iterations < maxIterations) {
        const legalMoves = gameState.legalMoves();
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available for AI");
        }
        const clonedState = gameState.clone();
        const move = aiPlayer.selectMove(clonedState, legalMoves);
        gameState.executeMove(move);
        iterations++;
    }

    if (iterations >= maxIterations) {
        throw new Error("AI turn exceeded maximum iterations");
    }
}

test("AI player completes a full turn", () => {
    // Given: Game state with Bottom player finishing their turn, Top player (AI) becoming active
    const seed = 12345;
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck, new Dice(() => rng.random()));
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Complete bottom player's turn first
    const playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
    gameState.executeMove(new PlayCardMove(playedCard));
    gameState.executeMove(new ConfirmOrdersMove());
    gameState.executeMove(new EndMovementsMove());
    gameState.executeMove(new EndBattlesMove());

    const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
    gameState.executeMove(replenishMove!);

    // Verify Top player is now active
    expect(gameState.activePlayer.position).toBe(Position.TOP);
    expect(gameState.activePhase.name).toBe("Play Card");

    // When: AI plays a complete turn (using synchronous helper)
    const aiPlayer: AIPlayer = {
        selectMove(_gameState: GameState, legalMoves: Move[]): Move {
            const index = Math.floor(rng.random() * legalMoves.length);
            return legalMoves[index];
        }
    };
    playFullAITurn(gameState, aiPlayer);

    // Then: Bottom player is active again, AI's turn completed
    expect(gameState.activePlayer.position).toBe(Position.BOTTOM);
    expect(gameState.activePhase.name).toBe("Play Card");

    // AI should have cards in hand again (drew a new card after discarding)
    expect(gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)).toHaveLength(3);
});

test("Seeded AI makes identical move sequences", () => {
    // Given: Two game instances with the same seed
    const seed = 99999;

    // First game run
    const rng1 = new SeededRNG(seed);
    const deck1 = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState1 = new GameState(deck1, new Dice(() => rng1.random()));
    gameState1.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState1.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Complete bottom player's turn
    const playedCard1 = gameState1.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
    gameState1.executeMove(new PlayCardMove(playedCard1));
    gameState1.executeMove(new ConfirmOrdersMove());
    gameState1.executeMove(new EndMovementsMove());
    gameState1.executeMove(new EndBattlesMove());

    const replenishMove1 = gameState1.legalMoves().find(m => m instanceof ReplenishHandMove);
    gameState1.executeMove(replenishMove1!);

    // Record AI moves for first game
    const moves1: string[] = [];
    const aiPlayer1: AIPlayer = {
        selectMove(_gameState: GameState, legalMoves: Move[]): Move {
            const index = Math.floor(rng1.random() * legalMoves.length);
            const move = legalMoves[index];
            moves1.push(`${move.constructor.name}:${index}`);
            return move;
        }
    };
    playFullAITurn(gameState1, aiPlayer1);

    // Second game run with same seed
    const rng2 = new SeededRNG(seed);
    const deck2 = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState2 = new GameState(deck2, new Dice(() => rng2.random()));
    gameState2.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState2.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Complete bottom player's turn
    const playedCard2 = gameState2.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
    gameState2.executeMove(new PlayCardMove(playedCard2));
    gameState2.executeMove(new ConfirmOrdersMove());
    gameState2.executeMove(new EndMovementsMove());
    gameState2.executeMove(new EndBattlesMove());

    const replenishMove2 = gameState2.legalMoves().find(m => m instanceof ReplenishHandMove);
    gameState2.executeMove(replenishMove2!);

    // Record AI moves for second game
    const moves2: string[] = [];
    const aiPlayer2: AIPlayer = {
        selectMove(_gameState: GameState, legalMoves: Move[]): Move {
            const index = Math.floor(rng2.random() * legalMoves.length);
            const move = legalMoves[index];
            moves2.push(`${move.constructor.name}:${index}`);
            return move;
        }
    };
    playFullAITurn(gameState2, aiPlayer2);

    // Then: Both AI players made identical move sequences
    expect(moves1).toEqual(moves2);
    expect(moves1.length).toBeGreaterThan(0); // Verify AI actually made moves
});
