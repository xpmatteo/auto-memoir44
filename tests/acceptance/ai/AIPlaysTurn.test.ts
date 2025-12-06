// ABOUTME: Acceptance tests for AI player turn completion
// ABOUTME: Verifies AI can complete full turns using random move selection

import {expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../../src/domain/CommandCard";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, PlayCardMove, ReplenishHandMove, OrderUnitMove, UnOrderMove} from "../../../src/domain/moves/Move";
import {Position, Side} from "../../../src/domain/Player";
import {SeededRNG} from "../../../src/adapters/RNG";
import {Dice} from "../../../src/domain/Dice";
import type {Move} from "../../../src/domain/moves/Move";
import type {AIPlayer} from "../../../src/ai/AIPlayer";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {Infantry} from "../../../src/domain/Unit";
import {HexCoord} from "../../../src/utils/hex";
import {PhaseType} from "../../../src/domain/phases/Phase";

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

test("AI completes ORDER phase by ordering available units", () => {
    // Given: Game state with units in CENTER section for TOP player (AI)
    const seed = 54321;
    const rng = new SeededRNG(seed);
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck, new Dice(() => rng.random()));

    // Setup: Place some units in CENTER section for TOP player (AXIS)
    // TOP player's center is q=6
    gameState.placeUnit(new HexCoord(6, 1), new Infantry(Side.AXIS));
    gameState.placeUnit(new HexCoord(6, 2), new Infantry(Side.AXIS));

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

    // Verify TOP player is active
    expect(gameState.activePlayer.position).toBe(Position.TOP);

    // Track moves during ORDER phase
    const orderPhaseMoves: Move[] = [];
    const aiPlayer = new RandomAIPlayer(rng);

    // When: AI plays through the ORDER phase
    let inOrderPhase = false;
    const maxIterations = 20;
    let iterations = 0;

    while (gameState.activePlayer.position === Position.TOP && iterations < maxIterations) {
        const legalMoves = gameState.legalMoves();
        const move = aiPlayer.selectMove(gameState.clone(), legalMoves);

        // Track if we entered ORDER phase
        if (gameState.activePhase.type === PhaseType.ORDER) {
            inOrderPhase = true;
            orderPhaseMoves.push(move);
        }

        gameState.executeMove(move);
        iterations++;

        // Stop after ORDER phase completes (we're no longer in ORDER phase after being in it)
        if (inOrderPhase && gameState.activePhase.type !== PhaseType.ORDER) {
            break;
        }
    }

    // Then: Verify AI ordered units during ORDER phase
    const orderMoves = orderPhaseMoves.filter(m => m instanceof OrderUnitMove);
    expect(orderMoves.length).toBeGreaterThan(0);

    // Verify AI never used UnOrderMove
    const unorderMoves = orderPhaseMoves.filter(m => m instanceof UnOrderMove);
    expect(unorderMoves.length).toBe(0);

    // Verify AI eventually confirmed orders
    const confirmMoves = orderPhaseMoves.filter(m => m instanceof ConfirmOrdersMove);
    expect(confirmMoves.length).toBe(1);
});
