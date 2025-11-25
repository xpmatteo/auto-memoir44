// ABOUTME: Integration tests for AIController coordination logic
// ABOUTME: Tests position checks, move execution, and callback handling

import {expect, test, describe} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../../src/domain/CommandCard";
import {Position} from "../../../src/domain/Player";
import {SeededRNG} from "../../../src/adapters/RNG";
import {Dice} from "../../../src/domain/Dice";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import {AIController} from "../../../src/ai/AIController";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, PlayCardMove} from "../../../src/domain/Move";

describe("AIController", () => {
    test("only acts when Top player is active", () => {
        const rng = new SeededRNG(123);
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Bottom player is active initially
        expect(gameState.activePlayer.position).toBe(Position.BOTTOM);

        const aiPlayer = new RandomAIPlayer();
        let callbackCalled = false;
        const aiController = new AIController(
            gameState,
            aiPlayer,
            () => rng.random(),
            () => { callbackCalled = true; },
            0 // No delay for tests
        );

        // When: checkAndAct is called while Bottom player is active
        aiController.checkAndAct();

        // Then: Should not execute any moves or call callback (synchronously)
        // Note: We set delay to 0, so if it were to act, it would happen very quickly
        // But it shouldn't schedule anything at all
        expect(callbackCalled).toBe(false);
        expect(gameState.activePlayer.position).toBe(Position.BOTTOM);
    });

    test("executes move when Top player is active", async () => {
        const rng = new SeededRNG(456);
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Complete Bottom player's turn so Top player becomes active
        const playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(playedCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());

        expect(gameState.activePlayer.position).toBe(Position.TOP);
        const initialPhase = gameState.activePhase.name;

        const aiPlayer = new RandomAIPlayer();
        let callbackCalled = false;
        const aiController = new AIController(
            gameState,
            aiPlayer,
            () => rng.random(),
            () => { callbackCalled = true; },
            10 // Small delay for async test
        );

        // When: checkAndAct is called while Top player is active
        aiController.checkAndAct();

        // Then: Should schedule a move (wait for setTimeout)
        await new Promise(resolve => setTimeout(resolve, 50));

        // Callback should have been called
        expect(callbackCalled).toBe(true);

        // Game state should have changed (a move was executed)
        // Either phase changed or player changed
        const afterPhase = gameState.activePhase.name;
        expect(initialPhase !== afterPhase || gameState.activePlayer.position !== Position.TOP).toBe(true);
    });

    test("does not act when no legal moves available", () => {
        const rng = new SeededRNG(789);
        const deck = Deck.createFromComposition([[ProbeCenter, 0]]); // Empty deck
        const gameState = new GameState(deck, new Dice(() => rng.random()));

        // Edge case: game state with no legal moves (shouldn't happen in real game)
        const aiPlayer = new RandomAIPlayer();
        let callbackCalled = false;
        const aiController = new AIController(
            gameState,
            aiPlayer,
            () => rng.random(),
            () => { callbackCalled = true; },
            0
        );

        // When: checkAndAct is called with no legal moves
        aiController.checkAndAct();

        // Then: Should not call callback or throw error
        expect(callbackCalled).toBe(false);
    });

    test("uses provided RNG for move selection", async () => {
        const rng = new SeededRNG(12345);
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Complete Bottom player's turn
        const playedCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(playedCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());

        // Track RNG calls
        let rngCalled = false;
        const trackedRng = () => {
            rngCalled = true;
            return rng.random();
        };

        const aiPlayer = new RandomAIPlayer();
        const aiController = new AIController(
            gameState,
            aiPlayer,
            trackedRng,
            () => {},
            10
        );

        // When: AI makes a move
        aiController.checkAndAct();
        await new Promise(resolve => setTimeout(resolve, 50));

        // Then: RNG should have been called
        expect(rngCalled).toBe(true);
    });
});
