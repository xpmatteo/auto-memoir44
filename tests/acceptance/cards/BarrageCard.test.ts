// ABOUTME: Acceptance tests for Barrage card
// ABOUTME: Tests selecting one enemy unit and battling with 4 dice, stars don't count as hits

import {beforeEach, describe, expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Side} from "../../../src/domain/Player";
import {Barrage} from "../../../src/domain/cards/Barrage";
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
import {getUnitAt, setupGameForCommandCardTests} from "../../helpers/testHelpers";
import {PhaseType} from "../../../src/domain/phases/Phase";

describe("Barrage card", () => {
    const dice = new ProgrammableDice();

    describe('Allies', () => {
        const unitSetup = [
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
        let enemyInSandbag: SituatedUnit;
        let enemyInWoods: SituatedUnit;

        beforeEach(() => {
            gameState = setupGameForCommandCardTests(unitSetup, Barrage, Side.ALLIES, dice);
            enemy1 = getUnitAt(gameState, 1, 2);
            enemyInSandbag = getUnitAt(gameState, 8, 0);
            enemyInWoods = getUnitAt(gameState, 9, 0);
        });

        describe('Can select exactly one enemy unit', () => {
            test('Should be able to select any enemy unit', () => {
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(4 dice, starsCountAsHits=false)",
                    "SelectTargetMove(Infantry/Axis/unit-1[(8,0)])",
                    "SelectTargetMove(Infantry/Axis/unit-2[(9,0)])",
                    "SelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-4[(2,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-5[(3,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-6[(4,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-7[(5,2)])",
                ]);
            });

            test('After selecting one unit, no more selections allowed', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(4 dice, starsCountAsHits=false)",
                    "UnSelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                ]);
            });
        });

        describe('Battle', () => {
            test('Battles with exactly 4 dice', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));

                // should execute battle with 4 dice, getting 2 hits
                dice.setNextRolls([RESULT_INFANTRY, RESULT_INFANTRY, RESULT_ARMOR, RESULT_ARMOR]);
                gameState.executeMove(new ConfirmTargetsMove(4, false));

                const enemy1AfterBarrage = getUnitAt(gameState, enemy1.coord.q, enemy1.coord.r);
                expect(enemy1AfterBarrage.unitState.strength).toBe(2);
            });

            function expectResultingStrength(targetUnit: SituatedUnit, results: DiceResult[], expectedStrength: number) {
                gameState.executeMove(new SelectTargetMove(targetUnit));

                dice.setNextRolls(results);
                gameState.executeMove(new ConfirmTargetsMove(4, false));

                const unitAfterBarrage = getUnitAt(gameState, targetUnit.coord.q, targetUnit.coord.r);
                expect(unitAfterBarrage.unitState.strength).toBe(expectedStrength);
            }

            test('Wrong unit symbol does not count as hit', () => {
                expectResultingStrength(enemy1, [RESULT_ARMOR, RESULT_ARMOR, RESULT_ARMOR, RESULT_ARMOR], 4);
            });

            test('Grenades count as hit', () => {
                expectResultingStrength(enemy1, [RESULT_GRENADE, RESULT_GRENADE, RESULT_ARMOR, RESULT_ARMOR], 2);
            });

            test('Stars do NOT count as hit', () => {
                expectResultingStrength(enemy1, [RESULT_STAR, RESULT_STAR, RESULT_STAR, RESULT_ARMOR], 4);
            });

            test('Flags cannot be ignored', () => {
                expectResultingStrength(enemyInSandbag, [RESULT_FLAG, RESULT_FLAG, RESULT_ARMOR, RESULT_ARMOR], 2);
            });

            test('Terrain protection is ignored', () => {
                expectResultingStrength(enemyInWoods, [RESULT_GRENADE, RESULT_GRENADE, RESULT_ARMOR, RESULT_ARMOR], 2);
            });

            test('Mix of results', () => {
                // 2 hits (infantry + grenade), 1 miss (armor), 1 miss (star)
                expectResultingStrength(enemy1, [RESULT_INFANTRY, RESULT_GRENADE, RESULT_ARMOR, RESULT_STAR], 2);
            });

            test('multiple retreat paths possible', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));

                dice.setNextRolls([RESULT_FLAG, RESULT_STAR, RESULT_STAR, RESULT_STAR]);
                gameState.executeMove(new ConfirmTargetsMove(4, false));

                expect(gameState.activePhase.type).toBe(PhaseType.RETREAT);
                const legalMoves = gameState.legalMoves();
                expect(legalMoves).toHaveLength(2);
                expect(legalMoves.map(m => m.toString())).toEqual([
                    `RetreatMove(${enemy1.unit.id} from (1,2) to (1,1))`,
                    `RetreatMove(${enemy1.unit.id} from (1,2) to (2,1))`,
                ]);
            });
        });
    });

    describe('Axis', () => {
        test('Also battles with exactly 4 dice', () => {
            const unitSetup = [
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

            const gameState = setupGameForCommandCardTests(unitSetup, Barrage, Side.AXIS, dice);

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmTargetsMove(4 dice, starsCountAsHits=false)",
                "SelectTargetMove(Infantry/Allies/unit-1[(-2,8)])",
                "SelectTargetMove(Infantry/Allies/unit-2[(-1,8)])",
            ]);
        });
    });

});
