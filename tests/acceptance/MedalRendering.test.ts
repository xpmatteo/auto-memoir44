// ABOUTME: Acceptance tests for rendering eliminated units in medal circles
// ABOUTME: Tests that eliminated units appear as sprites in correct medal positions

import {describe, expect, it} from "vitest";
import {GameState} from "../../src/domain/GameState";
import {Deck} from "../../src/domain/Deck";
import {Infantry} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {HexCoord} from "../../src/utils/hex";
import {BattleMove} from "../../src/domain/Move";
import {diceReturningAlways, RESULT_GRENADE, RESULT_INFANTRY} from "../../src/domain/Dice";

describe("Medal Circle Rendering", () => {
    describe("Basic medal rendering", () => {
        it("eliminated Bottom player unit appears in medal table for Bottom player", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            // Bottom player (ALLIES) is active by default
            const attacker = new Infantry(Side.ALLIES, 4);
            const target = new Infantry(Side.AXIS, 2);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target);

            // Execute battle to eliminate target
            const move = new BattleMove(attacker, target, 2);
            move.execute(gameState);

            // Target should be in bottom player's medal table (index 0)
            // which will be rendered in the BOTTOM medal circles
            const bottomMedals = gameState.getMedalTable(0);
            expect(bottomMedals).toContain(target);
            expect(bottomMedals.length).toBe(1);

            // Verify it's the correct unit type for rendering
            expect(bottomMedals[0].side).toBe(Side.AXIS);
            expect(bottomMedals[0].type).toBe("infantry");
        });

    });

    describe("Multiple eliminations", () => {
        it("tracks multiple eliminated units in order", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const target1 = new Infantry(Side.AXIS, 2);
            const target2 = new Infantry(Side.AXIS, 2);
            const target3 = new Infantry(Side.AXIS, 2);

            gameState.placeUnit(new HexCoord(0, 0), attacker);
            gameState.placeUnit(new HexCoord(1, 0), target1);
            gameState.placeUnit(new HexCoord(2, 0), target2);
            gameState.placeUnit(new HexCoord(3, 0), target3);

            // Eliminate units in sequence
            new BattleMove(attacker, target1, 2).execute(gameState);
            new BattleMove(attacker, target2, 2).execute(gameState);
            new BattleMove(attacker, target3, 2).execute(gameState);

            // All three should be in bottom player's medal table
            const bottomMedals = gameState.getMedalTable(0);
            expect(bottomMedals.length).toBe(3);
            expect(bottomMedals[0]).toBe(target1);
            expect(bottomMedals[1]).toBe(target2);
            expect(bottomMedals[2]).toBe(target3);

            // All should be infantry
            expect(bottomMedals[0].type).toBe("infantry");
            expect(bottomMedals[1].type).toBe("infantry");
            expect(bottomMedals[2].type).toBe("infantry");
        });

        it("handles more than 6 eliminations (overflow)", () => {
            const deck = Deck.createStandardDeck();
            const dice = diceReturningAlways([RESULT_INFANTRY, RESULT_GRENADE]);
            const gameState = new GameState(deck, dice);

            const attacker = new Infantry(Side.ALLIES, 4);
            const targets = [];

            // Create 8 targets
            for (let i = 0; i < 8; i++) {
                targets.push(new Infantry(Side.AXIS, 2));
                gameState.placeUnit(new HexCoord(i + 1, 0), targets[i]);
            }
            gameState.placeUnit(new HexCoord(0, 0), attacker);

            // Eliminate all 8 units
            for (const target of targets) {
                new BattleMove(attacker, target, 2).execute(gameState);
            }

            // All 8 should be tracked
            const bottomMedals = gameState.getMedalTable(0);
            expect(bottomMedals.length).toBe(8);

            // Verify all targets are accounted for
            for (let i = 0; i < 8; i++) {
                expect(bottomMedals[i]).toBe(targets[i]);
            }
        });
    });

});
