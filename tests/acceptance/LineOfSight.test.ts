import {describe, expect, test} from "vitest";
import {BattlePhase} from "../../src/domain/phases/BattlePhase";
import {createTestGameState, toStringAndSort} from "../helpers/testHelpers";
import {GameState} from "../../src/domain/GameState";
import {parseAndSetupUnits} from "../../src/scenarios/Scenario";

interface TestCase {
    name: string
    setup: string[]
    expected: string[]
}

function orderAllFriendlyUnits(gameState: GameState) {
    gameState.getAllUnits().forEach(({unit}) => {
        if (unit.side === gameState.activePlayer.side) {
            gameState.orderUnit(unit);
        }
    });
}

describe('Line of sight', () => {
    const phase = new BattlePhase();
    const cases: TestCase[] = [
        {
            name: 'Not blocked',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    .IN.    Win.    ....    ....",
            ],
            expected: ["Battle(Infantry/Allies/unit-1, Infantry/Axis/unit-2, 1)"],
        },
        {
            name: 'Blocked by terrain',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    .in.T   .IN.W   .in.    ....    ....",
            ],
            expected: [],
        },
        {
            name: 'Blocked by friendly units',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    .in. IN .IN.    ....    ....    ....",
            ],
            // only one unit will battle, the other's LOS is blocked
            expected: ["Battle(Infantry/Allies/unit-7, Infantry/Axis/unit-6, 3)"],
        },
        {
            name: 'Blocked by enemy units',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    .in. in .... IN ....    ....    ....",
            ],
            // can target only one unit, the other's LOS is blocked
            expected: ["Battle(Infantry/Allies/unit-11, Infantry/Axis/unit-10, 2)"],
        },
        {
            name: 'LOS across hex edge with obstacles on one side only, below',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    .in.    ....    ....    ....    ~~",
                "....    ....    ....W   .IN.    ....    ....    ....",
                "~~....    ....    ....    W... in ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [
                "Battle(Infantry/Allies/unit-13, Infantry/Axis/unit-12, 2)",
                "Battle(Infantry/Allies/unit-13, Infantry/Axis/unit-14, 2)",
            ],
        },
        {
            name: 'LOS across hex edge with obstacles on one side only, above',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    .in.W   ....    ....    ....    ~~",
                "....    ....    ....    .IN.W   ....    ....    ....",
                "~~....    ....    ....    .... in ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [
                "Battle(Infantry/Allies/unit-16, Infantry/Axis/unit-15, 2)",
                "Battle(Infantry/Allies/unit-16, Infantry/Axis/unit-17, 2)",
            ],
        },
        {
            name: 'LOS obstacle on the left, vertical',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    .in.    ....    ....    ....",
                "~~....    ....    ....W   ....    ....    ....    ~~",
                "....    ....    ....    .IN.    ....    ....    ....",
                "~~....    ....    ....W   ....    ....    ....    ~~",
                "....    ....    ....    .in.    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [
                "Battle(Infantry/Allies/unit-19, Infantry/Axis/unit-18, 2)",
                "Battle(Infantry/Allies/unit-19, Infantry/Axis/unit-20, 2)",
            ],
        },
        {
            name: 'LOS obstacle on the right, vertical',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    .in.    ....    ....    ....",
                "~~....    ....    ....    W...    ....    ....    ~~",
                "....    ....    ....    .IN.    ....    ....    ....",
                "~~....    ....    ....    W...    ....    ....    ~~",
                "....    ....    ....    .in.    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [
                "Battle(Infantry/Allies/unit-22, Infantry/Axis/unit-21, 2)",
                "Battle(Infantry/Allies/unit-22, Infantry/Axis/unit-23, 2)",
            ],
        },
        {
            name: 'LOS across hex edge blocked on both sides',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    .in.    ....    ....    ....",
                "~~....    ....    ....W   W...    ....    ....    ~~",
                "....    ....    ....    .IN.    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [],
        },
        {
            name: 'LOS across hex edge blocked by both sides oblique',
            setup: [
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    .in.W   ....    ....    ....    ~~",
                "....    ....    ....W   .IN.W   ....    ....    ....",
                "~~....    ....    ....    W... in ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
                "~~....    ....    ....    ....    ....    ....    ~~",
                "....    ....    ....    ....    ....    ....    ....",
            ],
            expected: [
            ],
        },

    ];

    test.each(cases)('$name', ({setup, expected}) => {
        const gameState = createTestGameState();
        parseAndSetupUnits(gameState, setup);
        orderAllFriendlyUnits(gameState);
        const moves = phase.doLegalMoves(gameState);
        expect(toStringAndSort(moves)).toEqual(["EndBattles", ...expected].sort());
    });
});
