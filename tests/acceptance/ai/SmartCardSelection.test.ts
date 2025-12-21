// ABOUTME: Acceptance tests for AI smart card selection
// ABOUTME: Verifies AI selects cards that order the most units during PLAY_CARD phase

import {expect, test, describe} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation, ProbeLeft, ProbeCenter, ProbeRight, AttackCenter, ReconLeft, AssaultCenter} from "../../../src/domain/cards/CommandCard";
import {ConfirmOrdersMove, EndBattlesMove, EndMovementsMove, PlayCardMove, ReplenishHandMove} from "../../../src/domain/moves/Move";
import {Position, Side} from "../../../src/domain/Player";
import {SeededRNG} from "../../../src/adapters/RNG";
import {Dice} from "../../../src/domain/Dice";
import {RandomAIPlayer} from "../../../src/ai/AIPlayer";
import type {Move} from "../../../src/domain/moves/Move";
import {Infantry} from "../../../src/domain/Unit";
import {hexOf} from "../../../src/utils/hex";

// Helper function to play full AI turn synchronously
function playFullAITurn(gameState: GameState, aiPlayer: RandomAIPlayer): Move[] {
    const maxIterations = 100;
    let iterations = 0;
    const movesPlayed: Move[] = [];

    while (gameState.activePlayer.position === Position.TOP && iterations < maxIterations) {
        const legalMoves = gameState.legalMoves();
        if (legalMoves.length === 0) {
            throw new Error("No legal moves available for AI");
        }
        const clonedState = gameState.clone();
        const move = aiPlayer.selectMove(clonedState, legalMoves);
        movesPlayed.push(move);
        gameState.executeMove(move);
        iterations++;
    }

    if (iterations >= maxIterations) {
        throw new Error("AI turn exceeded maximum iterations");
    }

    return movesPlayed;
}

describe("AI Smart Card Selection", () => {
    test("AI selects card that orders most units when clear winner exists", () => {
        // Given: Game state with specific unit distribution
        const seed = 42;
        const rng = new SeededRNG(seed);

        // Create deck with exactly the cards we need (3 for TOP, 1 for BOTTOM, plus extras for replenish)
        // Order matters: first drawn goes to first location
        const deck = Deck.createFromComposition([
            [ProbeLeft, 1],
            [ProbeCenter, 1],
            [ProbeRight, 1],
            [ProbeCenter, 10] // Extras for replenishing
        ]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));

        // Setup board: 1 unit in LEFT, 2 units in CENTER, 0 units in RIGHT (TOP player's perspective)
        // TOP player (AXIS) is at top, so their LEFT is screen-RIGHT (q >= 7)
        gameState.placeUnit(hexOf(9, 1), new Infantry(Side.AXIS)); // TOP's left section
        gameState.placeUnit(hexOf(6, 1), new Infantry(Side.AXIS)); // TOP's center
        gameState.placeUnit(hexOf(6, 2), new Infantry(Side.AXIS)); // TOP's center

        // Draw cards: BOTTOM gets 1, TOP gets 3
        // With our deck composition, TOP will get: ProbeLeft, ProbeCenter, ProbeRight (in shuffled order)
        gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Verify we have the right cards in TOP hand
        const topCards = gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);
        expect(topCards.length).toBe(3);

        // ProbeLeft has 1 unit -> orders min(1, 2) = 1
        // ProbeCenter has 2 units -> orders min(2, 2) = 2  <-- MOST
        // ProbeRight has 0 units -> orders min(0, 2) = 0

        // Complete bottom player's turn first
        const bottomCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(bottomCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());
        const replenishMove = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState.executeMove(replenishMove!);

        // Verify TOP player is active
        expect(gameState.activePlayer.position).toBe(Position.TOP);

        // When: AI plays its turn
        const aiPlayer = new RandomAIPlayer(rng);
        const movesPlayed = playFullAITurn(gameState, aiPlayer);

        // Then: AI should have selected ProbeCenter (orders 2 units - the most)
        const playCardMove = movesPlayed.find(m => m instanceof PlayCardMove) as PlayCardMove;
        expect(playCardMove).toBeDefined();
        expect(playCardMove.card).toBeInstanceOf(ProbeCenter);
    });

    test("AI breaks ties randomly with seeded RNG", () => {
        // Given: Two identical game setups with same seed
        const seed = 99999;

        // First game
        const rng1 = new SeededRNG(seed);
        const deck1 = Deck.createFromComposition([
            [ProbeLeft, 1],
            [ProbeCenter, 1],
            [ProbeRight, 1],
            [ProbeCenter, 10]
        ]);
        const gameState1 = new GameState(deck1, new Dice(() => rng1.random()));

        // All sections have 1 unit (all cards tie at ordering 1 unit)
        gameState1.placeUnit(hexOf(9, 1), new Infantry(Side.AXIS)); // TOP's left
        gameState1.placeUnit(hexOf(6, 1), new Infantry(Side.AXIS)); // TOP's center
        gameState1.placeUnit(hexOf(2, 1), new Infantry(Side.AXIS)); // TOP's right

        gameState1.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
        gameState1.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Complete bottom turn
        const bottomCard1 = gameState1.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState1.executeMove(new PlayCardMove(bottomCard1));
        gameState1.executeMove(new ConfirmOrdersMove());
        gameState1.executeMove(new EndMovementsMove());
        gameState1.executeMove(new EndBattlesMove());
        const replenish1 = gameState1.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState1.executeMove(replenish1!);

        const aiPlayer1 = new RandomAIPlayer(rng1);
        const moves1 = playFullAITurn(gameState1, aiPlayer1);
        const card1 = (moves1.find(m => m instanceof PlayCardMove) as PlayCardMove).card;

        // Second game with same seed
        const rng2 = new SeededRNG(seed);
        const deck2 = Deck.createFromComposition([
            [ProbeLeft, 1],
            [ProbeCenter, 1],
            [ProbeRight, 1],
            [ProbeCenter, 10]
        ]);
        const gameState2 = new GameState(deck2, new Dice(() => rng2.random()));

        gameState2.placeUnit(hexOf(9, 1), new Infantry(Side.AXIS));
        gameState2.placeUnit(hexOf(6, 1), new Infantry(Side.AXIS));
        gameState2.placeUnit(hexOf(2, 1), new Infantry(Side.AXIS));

        gameState2.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
        gameState2.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        const bottomCard2 = gameState2.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState2.executeMove(new PlayCardMove(bottomCard2));
        gameState2.executeMove(new ConfirmOrdersMove());
        gameState2.executeMove(new EndMovementsMove());
        gameState2.executeMove(new EndBattlesMove());
        const replenish2 = gameState2.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState2.executeMove(replenish2!);

        const aiPlayer2 = new RandomAIPlayer(rng2);
        const moves2 = playFullAITurn(gameState2, aiPlayer2);
        const card2 = (moves2.find(m => m instanceof PlayCardMove) as PlayCardMove).card;

        // Then: Both should select the same card (deterministic tie-breaking)
        expect(card1.constructor.name).toBe(card2.constructor.name);
    });

    test("AI handles Assault cards correctly (orders all units)", () => {
        // Given: Game with Assault and Attack cards
        const seed = 777;
        const rng = new SeededRNG(seed);
        // Need enough cards: 1 for BOTTOM, 2 for TOP (Assault + Attack), plus extras for replenish
        const deck = Deck.createFromComposition([
            [AssaultCenter, 2],  // Ensure at least one for TOP
            [AttackCenter, 2],   // Ensure at least one for TOP
            [ProbeCenter, 10]    // Extras for replenishing
        ]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));

        // CENTER has 4 units
        gameState.placeUnit(hexOf(6, 1), new Infantry(Side.AXIS));
        gameState.placeUnit(hexOf(6, 2), new Infantry(Side.AXIS));
        gameState.placeUnit(hexOf(6, 3), new Infantry(Side.AXIS));
        gameState.placeUnit(hexOf(6, 4), new Infantry(Side.AXIS));

        // AssaultCenter: orders min(4, 1000) = 4  <-- MOST
        // AttackCenter: orders min(4, 3) = 3

        gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(2, CardLocation.TOP_PLAYER_HAND);

        // Verify we have both cards in hand (regardless of shuffle order)
        const topCards = gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND);
        expect(topCards.length).toBe(2);
        const hasAssault = topCards.some(c => c instanceof AssaultCenter);
        const hasAttack = topCards.some(c => c instanceof AttackCenter);
        expect(hasAssault).toBe(true);
        expect(hasAttack).toBe(true);

        // Complete bottom turn
        const bottomCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(bottomCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());
        const replenish = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState.executeMove(replenish!);

        // When: AI plays
        const aiPlayer = new RandomAIPlayer(rng);
        const moves = playFullAITurn(gameState, aiPlayer);

        // Then: Should select AssaultCenter (orders all 4 units vs Attack's 3)
        const playCardMove = moves.find(m => m instanceof PlayCardMove) as PlayCardMove;
        expect(playCardMove.card).toBeInstanceOf(AssaultCenter);
    });

    test("AI handles sections with no friendly units (all order 0)", () => {
        // Given: No units on board, all cards order 0
        const seed = 555;
        const rng = new SeededRNG(seed);
        const deck = Deck.createFromComposition([
            [ProbeLeft, 1],
            [ProbeCenter, 1],
            [ReconLeft, 1],
            [ProbeCenter, 10]
        ]);
        const gameState = new GameState(deck, new Dice(() => rng.random()));

        // No units added - all sections empty
        // ProbeLeft: orders min(0, 2) = 0
        // ProbeCenter: orders min(0, 2) = 0
        // ReconLeft: orders min(0, 1) = 0
        // All tie at 0

        gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Complete bottom turn
        const bottomCard = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)[0];
        gameState.executeMove(new PlayCardMove(bottomCard));
        gameState.executeMove(new ConfirmOrdersMove());
        gameState.executeMove(new EndMovementsMove());
        gameState.executeMove(new EndBattlesMove());
        const replenish = gameState.legalMoves().find(m => m instanceof ReplenishHandMove);
        gameState.executeMove(replenish!);

        // When: AI plays (should randomly select since all tie at 0)
        const aiPlayer = new RandomAIPlayer(rng);
        const moves = playFullAITurn(gameState, aiPlayer);

        // Then: Should select one of the cards (any is valid)
        const playCardMove = moves.find(m => m instanceof PlayCardMove) as PlayCardMove;
        expect(playCardMove).toBeDefined();
        // Just verify it selected a card - all are equally valid since they all order 0 units
        expect([ProbeLeft, ProbeCenter, ReconLeft].some(CardClass =>
            playCardMove.card instanceof CardClass
        )).toBe(true);
    });
});
