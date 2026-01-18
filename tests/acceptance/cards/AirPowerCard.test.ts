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
import {getUnitAt, setupGameForCommandCardTests} from "../../helpers/testHelpers";
import {PhaseType} from "../../../src/domain/phases/Phase";
import {RetreatMove} from "../../../src/domain/moves/Move";

describe("Air Power card", () => {
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
                    "ConfirmTargetsMove(2 dice, starsCountAsHits=true)",
                    "SelectTargetMove(Infantry/Axis/unit-1[(8,0)])",
                    "SelectTargetMove(Infantry/Axis/unit-2[(9,0)])",
                    "SelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-4[(2,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-5[(3,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-6[(4,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-7[(5,2)])",
                ]);
            });

            test('After selecting one unit, only adjacent units are selectable', () => {
                gameState.executeMove(new SelectTargetMove(enemy2));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice, starsCountAsHits=true)",
                    "UnSelectTargetMove(Infantry/Axis/unit-4[(2,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-5[(3,2)])",
                ]);
            });

            test('Cannot unselect middle unit because it makes target selection non-contiguous ', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice, starsCountAsHits=true)",
                    "UnSelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                    "UnSelectTargetMove(Infantry/Axis/unit-5[(3,2)])",
                    "SelectTargetMove(Infantry/Axis/unit-6[(4,2)])",
                ]);
            });

            test('After selecting four units, no more selections', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));
                gameState.executeMove(new SelectTargetMove(enemy3));
                gameState.executeMove(new SelectTargetMove(enemy4));
                expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                    "ConfirmTargetsMove(2 dice, starsCountAsHits=true)",
                    "UnSelectTargetMove(Infantry/Axis/unit-3[(1,2)])",
                    "UnSelectTargetMove(Infantry/Axis/unit-6[(4,2)])",
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

            test('interleave battle and retreats', () => {
                gameState.executeMove(new SelectTargetMove(enemy1));
                gameState.executeMove(new SelectTargetMove(enemy2));

                dice.setNextRolls([RESULT_FLAG, RESULT_STAR]);
                gameState.executeMove(new ConfirmTargetsMove(2));

                // First deferred combat task executes and pushes a retreat phase
                expect(gameState.activePhase.type).toBe(PhaseType.RETREAT);
                const legalMoves = gameState.legalMoves();
                expect(legalMoves.map(m => m.toString())).toEqual([
                    `RetreatMove(${enemy1.unit.id} from (1,2) to (1,1))`,
                    `RetreatMove(${enemy1.unit.id} from (1,2) to (2,1))`,
                ]);

                // First deferred combat task executes and pushes another retreat phase
                dice.setNextRolls([RESULT_FLAG, RESULT_STAR]);
                gameState.executeMove(new RetreatMove(enemy1.unit, enemy1.coord, enemy1.coord.southeast()));
                const legalMoves1 = gameState.legalMoves();
                expect(legalMoves1.map(m => m.toString())).toEqual([
                    `RetreatMove(${enemy2.unit.id} from (2,2) to (2,1))`,
                    `RetreatMove(${enemy2.unit.id} from (2,2) to (3,1))`,
                ]);
            });

        });
    });

    describe('Axis', () => {
        test('Battles with 1 die per enemy unit', () => {
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

            const gameState = setupGameForCommandCardTests(unitSetup, AirPower, Side.AXIS, dice);

            expect(gameState.legalMoves().map(m => m.toString())).toEqual([
                "ConfirmTargetsMove(1 dice, starsCountAsHits=true)",
                "SelectTargetMove(Infantry/Allies/unit-1[(-2,8)])",
                "SelectTargetMove(Infantry/Allies/unit-2[(-1,8)])",
            ]);
        });
    });

    // Note: Additional multi-target and retreat scenarios are covered by existing tests
    // and the normal game flow with the CombatTask implementation

});

