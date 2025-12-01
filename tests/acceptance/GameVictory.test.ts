// ABOUTME: Acceptance tests for game victory conditions
// ABOUTME: Tests victory detection when a player reaches prerequisite medals

import {expect, test, describe} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {CardLocation, ProbeCenter} from "../../src/domain/CommandCard";
import {GameVictoryMove} from "../../src/domain/Move";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";

interface VictoryCase {
    name: string;
    medalPlayerIndex: 0 | 1;
    medalCount: number;
    shouldWin: boolean;
    expectedWinnerSide: Side | null;
}

describe('Game victory conditions', () => {
    const cases: VictoryCase[] = [
        {
            name: 'bottom player wins with 4 medals',
            medalPlayerIndex: 0,
            medalCount: 4,
            shouldWin: true,
            expectedWinnerSide: Side.ALLIES,
        },
        {
            name: 'bottom player wins with 5 medals',
            medalPlayerIndex: 0,
            medalCount: 5,
            shouldWin: true,
            expectedWinnerSide: Side.ALLIES,
        },
        {
            name: 'top player wins with 4 medals',
            medalPlayerIndex: 1,
            medalCount: 4,
            shouldWin: true,
            expectedWinnerSide: Side.AXIS,
        },
        {
            name: 'top player wins with 5 medals',
            medalPlayerIndex: 1,
            medalCount: 5,
            shouldWin: true,
            expectedWinnerSide: Side.AXIS,
        },
        {
            name: 'no victory with 3 medals',
            medalPlayerIndex: 0,
            medalCount: 3,
            shouldWin: false,
            expectedWinnerSide: null,
        },
        {
            name: 'no victory with 0 medals',
            medalPlayerIndex: 0,
            medalCount: 0,
            shouldWin: false,
            expectedWinnerSide: null,
        },
    ];

    test.each(cases)('$name', ({ medalPlayerIndex, medalCount, shouldWin, expectedWinnerSide }) => {
        // Arrange
        const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
        const gameState = new GameState(deck);
        gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
        gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

        // Add medals to the specified player's medal table
        for (let i = 0; i < medalCount; i++) {
            const unit = new Infantry(Side.ALLIES); // Side doesn't matter for medal count
            gameState.addToMedalTable(unit, medalPlayerIndex);
        }

        // Act
        const legalMoves = gameState.legalMoves();

        // Assert
        if (shouldWin) {
            // Victory should return exactly one move: GameVictoryMove
            expect(legalMoves).toHaveLength(1);
            expect(legalMoves[0]).toBeInstanceOf(GameVictoryMove);

            const victoryMove = legalMoves[0] as GameVictoryMove;
            expect(victoryMove.winningPlayerSide).toBe(expectedWinnerSide);

            // Check the UI button
            const buttons = victoryMove.uiButton();
            expect(buttons).toHaveLength(1);
            expect(buttons[0].label).toBe(`The ${expectedWinnerSide} player won! New game?`);
        } else {
            // No victory - should have normal moves (PlayCardMove)
            expect(legalMoves.length).toBeGreaterThan(0);
            expect(legalMoves[0]).not.toBeInstanceOf(GameVictoryMove);
        }
    });
});

test('Victory button callback refreshes page', () => {
    // Arrange
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck);

    // Add 4 medals to bottom player
    for (let i = 0; i < 4; i++) {
        gameState.addToMedalTable(new Infantry(Side.ALLIES), 0);
    }

    // Mock window.location.reload
    const originalReload = window.location.reload;
    let reloadCalled = false;
    window.location.reload = () => {
        reloadCalled = true;
    };

    // Act
    const legalMoves = gameState.legalMoves();
    const victoryMove = legalMoves[0] as GameVictoryMove;
    const buttons = victoryMove.uiButton();
    buttons[0].callback(gameState);

    // Assert
    expect(reloadCalled).toBe(true);

    // Cleanup
    window.location.reload = originalReload;
});

test('Victory detected regardless of active player', () => {
    // Arrange - bottom player has won but top player is active
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Bottom player gets 4 medals
    for (let i = 0; i < 4; i++) {
        gameState.addToMedalTable(new Infantry(Side.ALLIES), 0);
    }

    // Switch to top player
    gameState.switchActivePlayer();

    // Act
    const legalMoves = gameState.legalMoves();

    // Assert - bottom player victory should still be detected
    expect(legalMoves).toHaveLength(1);
    expect(legalMoves[0]).toBeInstanceOf(GameVictoryMove);
    const victoryMove = legalMoves[0] as GameVictoryMove;
    expect(victoryMove.winningPlayerSide).toBe(Side.ALLIES);
});

test('Both players reach threshold - bottom player wins', () => {
    // Arrange - both players have 4 medals
    const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
    const gameState = new GameState(deck);
    gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);

    // Both players get 4 medals
    for (let i = 0; i < 4; i++) {
        gameState.addToMedalTable(new Infantry(Side.ALLIES), 0);
        gameState.addToMedalTable(new Infantry(Side.AXIS), 1);
    }

    // Act
    const legalMoves = gameState.legalMoves();

    // Assert - bottom player should win (checked first)
    expect(legalMoves).toHaveLength(1);
    expect(legalMoves[0]).toBeInstanceOf(GameVictoryMove);
    const victoryMove = legalMoves[0] as GameVictoryMove;
    expect(victoryMove.winningPlayerSide).toBe(Side.ALLIES);
});
