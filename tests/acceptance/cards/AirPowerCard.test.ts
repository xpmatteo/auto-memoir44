// ABOUTME: Acceptance tests for Air Power card
// ABOUTME: Tests selecting up to 4 contiguous enemy units and battling with variable dice

import {describe, expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {CardLocation} from "../../../src/domain/cards/CommandCard";
import {ConfirmOrdersMove, PlayCardMove} from "../../../src/domain/moves/Move";
import {HexCoord} from "../../../src/utils/hex";
import {parseAndSetupUnits} from "../../../src/scenarios/Scenario";
import {Side} from "../../../src/domain/Player";
import {resetUnitIdCounter} from "../../../src/domain/Unit";
import {AirPower} from "../../../src/domain/cards/AirPower";
import {SelectTargetMove} from "../../../src/domain/moves/SelectTargetMove";
import {SituatedUnit, situatedUnit} from "../../../src/domain/SituatedUnit";
import {diceReturningAlways, RESULT_INFANTRY} from "../../../src/domain/Dice";

const dice = diceReturningAlways([RESULT_INFANTRY]);

function setupGame(unitSetup: string[], activePlayer: Side = Side.ALLIES): GameState {
    resetUnitIdCounter();
    const deck = Deck.createFromComposition([[AirPower, 10]]);
    const gameState = new GameState(deck, dice);
    gameState.drawCards(2, CardLocation.BOTTOM_PLAYER_HAND);
    gameState.drawCards(2, CardLocation.TOP_PLAYER_HAND);
    parseAndSetupUnits(gameState, unitSetup);
    if (activePlayer === Side.AXIS) {
        gameState.switchActivePlayer();
    }
    gameState.executeMove(new PlayCardMove(deck.peekOneCard()));
    return gameState;
}

function getUnitAt(gameState: GameState, q: number, r: number): SituatedUnit {
    const unitAt = gameState.getUnitAt(new HexCoord(q, r));
    if (!unitAt) {
        throw new Error(`No unit at (${q},${r})`);
    }
    return situatedUnit().at(q, r).build();
}

describe.skip("Air Power card", () => {
    describe('Allies', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    .in. in .in. in .in.    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];

        const gameState = setupGame(unitSetup);
        //const enemy0 = getUnit(gameState, 0, 1);
        const enemy1 = getUnitAt(gameState, 1, 2);
        const enemy2 = getUnitAt(gameState, 2, 2);
        const enemy3 = getUnitAt(gameState, 3, 2);
        const enemy4 = getUnitAt(gameState, 4, 2);

        describe('Can select up to 4 contiguous enemy units', () => {
            test('Should be able to select any enemy units', () => {
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmOrdersMove",
                    "SelectTargetMove(unit-1/Axis[0,2])",
                    "SelectTargetMove(unit-2/Axis[1,2])",
                    "SelectTargetMove(unit-3/Axis[2,2])",
                    "SelectTargetMove(unit-4/Axis[3,2])",
                    "SelectTargetMove(unit-5/Axis[4,2])",
                ]);
            });

            test('After selecting one unit, only adjacent units are selectable', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmOrdersMove",
                    "UnSelectTargetMove(unit-1/Axis[1,2])",
                    "SelectTargetMove(unit-2/Axis[0,2])",
                    "SelectTargetMove(unit-3/Axis[2,2])",
                ]);
            });

            test('After selecting three units', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmOrdersMove",
                    "UnSelectTargetMove(unit-1/Axis[1,2])",
                    "UnSelectTargetMove(unit-1/Axis[2,2])",
                    "UnSelectTargetMove(unit-1/Axis[3,2])",
                    "SelectTargetMove(unit-2/Axis[0,1])",
                    "SelectTargetMove(unit-5/Axis[4,2])",
                ]);
            });

            test('After selecting four units, no more selections', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                gameState.executeMove(new SelectTargetMove(enemy4));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmOrdersMove",
                    "UnSelectTargetMove(unit-1/Axis[1,2])",
                    "UnSelectTargetMove(unit-1/Axis[2,2])",
                    "UnSelectTargetMove(unit-1/Axis[3,2])",
                    "UnSelectTargetMove(unit-1/Axis[4,2])",
                ]);
            });
        });
        describe('Battle with two dice', () => {
            test('Allies battle with 2 dice per enemy unit', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));

                // should execute battle with 2 dice each
                //dice.setupNextRolls([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
                gameState.executeMove(new ConfirmOrdersMove());

                const enemy1AfterAirPower = getUnitAt(gameState, 1, 2);
                const enemy2AfterAirPower = getUnitAt(gameState, 2, 2);
                expect(enemy1AfterAirPower.unitState.strength).toBe(2);
                expect(enemy2AfterAirPower.unitState.strength).toBe(2);
            });

        });
    });

    describe('Axis', () => {
        test('Battle with 1 die per enemy unit', () => {
            const unitSetup = [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    .IN. IN ....    ....    ....    ....    ....",
            ];

            const gameState = setupGame(unitSetup, Side.AXIS);
            const enemy1 = getUnitAt(gameState, -2, 8);
            const enemy2 = getUnitAt(gameState, -1, 8);

            gameState.executeMove(new SelectTargetMove(enemy1));
            gameState.executeMove(new SelectTargetMove(enemy2));

            // should execute battle with 1 dice each
            //dice.setupNextRolls([RESULT_INFANTRY, RESULT_INFANTRY]);
            gameState.executeMove(new ConfirmOrdersMove());

            const enemy1AfterAirPower = getUnitAt(gameState, -2, 8);
            const enemy2AfterAirPower = getUnitAt(gameState, -1, 82);
            expect(enemy1AfterAirPower.unitState.strength).toBe(3);
            expect(enemy2AfterAirPower.unitState.strength).toBe(3);
        });
    });

});

