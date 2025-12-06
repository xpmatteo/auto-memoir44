// ABOUTME: Unit tests for GameVictoryMove class
// ABOUTME: Tests victory move construction, execution, and UI button generation

import {describe, expect, it, test} from "vitest";
import {GameVictoryMove} from "../../src/domain/moves/Move";
import {Side} from "../../src/domain/Player";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {ProbeCenter} from "../../src/domain/CommandCard";

interface VictorySideCase {
    name: string;
    side: Side;
    expectedLabel: string;
}

describe("GameVictoryMove", () => {
    describe("constructor", () => {
        const cases: VictorySideCase[] = [
            {
                name: "stores Allies side correctly",
                side: Side.ALLIES,
                expectedLabel: "The Allies player won! New game?",
            },
            {
                name: "stores Axis side correctly",
                side: Side.AXIS,
                expectedLabel: "The Axis player won! New game?",
            },
        ];

        test.each(cases)('$name', ({ side, expectedLabel }) => {
            const move = new GameVictoryMove(side);

            expect(move.winningPlayerSide).toBe(side);

            const buttons = move.uiButton();
            expect(buttons).toHaveLength(1);
            expect(buttons[0].label).toBe(expectedLabel);
        });
    });

    describe("execute", () => {
        it("should be a no-op (no state changes)", () => {
            const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
            const gameState = new GameState(deck);

            // Create a snapshot of the state
            const stateBefore = {
                activePlayerIndex: gameState.activePlayer.position,
                medalCount0: gameState.getMedalTable(0).length,
                medalCount1: gameState.getMedalTable(1).length,
            };

            const move = new GameVictoryMove(Side.ALLIES);
            move.execute(gameState);

            // Verify state hasn't changed
            expect(gameState.activePlayer.position).toBe(stateBefore.activePlayerIndex);
            expect(gameState.getMedalTable(0).length).toBe(stateBefore.medalCount0);
            expect(gameState.getMedalTable(1).length).toBe(stateBefore.medalCount1);
        });
    });

    describe("uiButton", () => {
        it("should return exactly one button", () => {
            const move = new GameVictoryMove(Side.ALLIES);
            const buttons = move.uiButton();

            expect(buttons).toHaveLength(1);
        });

        it("should include the winning side in the button label", () => {
            const alliesMove = new GameVictoryMove(Side.ALLIES);
            const axisMove = new GameVictoryMove(Side.AXIS);

            const alliesButtons = alliesMove.uiButton();
            const axisButtons = axisMove.uiButton();

            expect(alliesButtons[0].label).toContain("Allies");
            expect(axisButtons[0].label).toContain("Axis");
        });

        it("should have a callback that triggers page reload", () => {
            const move = new GameVictoryMove(Side.ALLIES);
            const buttons = move.uiButton();

            expect(buttons[0].callback).toBeDefined();
            expect(typeof buttons[0].callback).toBe("function");
        });

        it("should call window.location.reload when callback is executed", () => {
            const move = new GameVictoryMove(Side.ALLIES);
            const buttons = move.uiButton();

            // Mock window.location.reload
            const originalReload = window.location.reload;
            let reloadCalled = false;
            window.location.reload = () => {
                reloadCalled = true;
            };

            // Execute the callback
            const deck = Deck.createFromComposition([[ProbeCenter, 60]]);
            const gameState = new GameState(deck);
            buttons[0].callback(gameState);

            expect(reloadCalled).toBe(true);

            // Cleanup
            window.location.reload = originalReload;
        });
    });
});
