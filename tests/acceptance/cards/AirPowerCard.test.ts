// ABOUTME: Acceptance tests for Air Power card
// ABOUTME: Tests selecting up to 4 contiguous enemy units and battling with variable dice

import {beforeEach, describe, expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Side} from "../../../src/domain/Player";
import {AirPower} from "../../../src/domain/cards/AirPower";
import {SelectTargetMove} from "../../../src/domain/moves/SelectTargetMove";
import {SituatedUnit} from "../../../src/domain/SituatedUnit";
import {
    DiceResult,
    ProgrammableDice,
    RESULT_ARMOR,
    RESULT_FLAG,
    RESULT_GRENADE,
    RESULT_INFANTRY,
    RESULT_STAR
} from "../../../src/domain/Dice";
import {ConfirmTargetsMove} from "../../../src/domain/moves/ConfirmTargetsMove";
import {setupGameForCommandCardTests} from "../../helpers/testHelpers";

function getUnitAt(gameState: GameState, q: number, r: number): SituatedUnit {
    const allUnits = gameState.getAllUnits();
    const found = allUnits.find(su => su.coord.q === q && su.coord.r === r);
    if (!found) {
        throw new Error(`No unit at (${q},${r})`);
    }
    return found;
}

describe("Air Power card", () => {
    const dice = new ProgrammableDice();

    describe('Allies', () => {
        const unitSetup = [
            "   0   1   2   3   4   5   6   7   8   9  10  11  12",
            "....    ....    ....    ....    .insWin ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    .in. in .in. in .in.    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
            "~~....    ....    ....    ....    ....    ....    ~~",
            "....    ....    ....    ....    ....    ....    ....",
        ];

        let gameState: GameState;
        let enemy1: SituatedUnit;
        let enemy2: SituatedUnit;
        let enemy3: SituatedUnit;
        let enemy4: SituatedUnit;
        let enemyInSandbag: SituatedUnit;
        let enemyInWoods: SituatedUnit;

        beforeEach(() => {
            gameState = setupGameForCommandCardTests(unitSetup, AirPower, Side.ALLIES, dice);
            enemy1 = getUnitAt(gameState, 1, 2);
            enemy2 = getUnitAt(gameState, 2, 2);
            enemy3 = getUnitAt(gameState, 3, 2);
            enemy4 = getUnitAt(gameState, 4, 2);
            enemyInSandbag = getUnitAt(gameState, 8, 0);
            enemyInWoods = getUnitAt(gameState, 9, 0);
        });

        describe('Can select up to 4 contiguous enemy units', () => {
            test('Should be able to select any enemy units', () => {
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice)",
                    "SelectTargetMove(Infantry/Axis[(8,0)])",
                    "SelectTargetMove(Infantry/Axis[(9,0)])",
                    "SelectTargetMove(Infantry/Axis[(1,2)])",
                    "SelectTargetMove(Infantry/Axis[(2,2)])",
                    "SelectTargetMove(Infantry/Axis[(3,2)])",
                    "SelectTargetMove(Infantry/Axis[(4,2)])",
                    "SelectTargetMove(Infantry/Axis[(5,2)])",
                ]);
            });

            test('After selecting one unit, only adjacent units are selectable', () => {
                gameState.executeMove(new SelectTargetMove(enemy2));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice)",
                    "UnSelectTargetMove(Infantry/Axis[(2,2)])",
                    "SelectTargetMove(Infantry/Axis[(1,2)])",
                    "SelectTargetMove(Infantry/Axis[(3,2)])",
                ]);
            });

            test('Cannot unselect middle unit because it makes target selection non-contiguous ', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice)",
                    "UnSelectTargetMove(Infantry/Axis[(1,2)])",
                    "UnSelectTargetMove(Infantry/Axis[(3,2)])",
                    "SelectTargetMove(Infantry/Axis[(4,2)])",
                ]);
            });

            test('After selecting four units, no more selections', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                gameState.executeMove(new SelectTargetMove(enemy4));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice)",
                    "UnSelectTargetMove(Infantry/Axis[(1,2)])",
                    "UnSelectTargetMove(Infantry/Axis[(4,2)])",
                ]);
            });
        });

        describe('Battle', () => {
            test('Allies battle with 2 dice per enemy unit', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));

                // should execute battle with 2 dice each
                dice.setNextRolls([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY, RESULT_INFANTRY]);
                gameState.executeMove(new ConfirmTargetsMove(2));

                const enemy1AfterAirPower = getUnitAt(gameState, enemy1.coord.q, enemy1.coord.r);
                const enemy2AfterAirPower = getUnitAt(gameState, enemy2.coord.q, enemy2.coord.r);
                expect(enemy1AfterAirPower.unitState.strength).toBe(2);
                expect(enemy2AfterAirPower.unitState.strength).toBe(2);
            });

            function expectResultingStrength(targetUnit: SituatedUnit, results: DiceResult[], expectedStrength: number) {
                gameState.executeMove(new SelectTargetMove(targetUnit));

                dice.setNextRolls(results);
                gameState.executeMove(new ConfirmTargetsMove(2));

                const enemy1AfterAirPower = getUnitAt(gameState, targetUnit.coord.q, targetUnit.coord.r);
                expect(enemy1AfterAirPower.unitState.strength).toBe(expectedStrength);
            }

            test('Wrong unit symbol ', () => {
                expectResultingStrength(enemy1, [RESULT_ARMOR, RESULT_ARMOR], 4);
            });

            test('Grenades count as hit', () => {
                expectResultingStrength(enemy1, [RESULT_GRENADE, RESULT_GRENADE], 2);
            });

            test('Star count as hit', () => {
                expectResultingStrength(enemy1, [RESULT_STAR, RESULT_STAR], 2);
            });

            test('Flags cannot be ignored', () => {
                expectResultingStrength(enemyInSandbag, [RESULT_FLAG, RESULT_FLAG], 2);
            });

            test('Terrain protection is ignored', () => {
                expectResultingStrength(enemyInWoods, [RESULT_GRENADE, RESULT_GRENADE], 2);
            });
        });
    });

    describe('Axis', () => {
        test('Battles with 1 die per enemy unit', () => {
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

            const gameState = setupGameForCommandCardTests(unitSetup, AirPower, Side.AXIS, dice);

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmTargetsMove(1 dice)",
                "SelectTargetMove(Infantry/Allies[(-2,8)])",
                "SelectTargetMove(Infantry/Allies[(-1,8)])",
            ]);
        });
    });

});

