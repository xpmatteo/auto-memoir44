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
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
            expected: ["Battle(Infantry/Allies, Infantry/Axis, 1)"],
        },
        {
            name: 'Blocked by terrain',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
            expected: ["Battle(Infantry/Allies, Infantry/Axis, 3)"],
        },
        {
            name: 'Blocked by enemy units',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
            expected: ["Battle(Infantry/Allies, Infantry/Axis, 2)"],
        },
        {
            name: 'LOS across hex edge with obstacles on one side only, below',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
            ],
        },
        {
            name: 'LOS across hex edge with obstacles on one side only, above',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
            ],
        },
        {
            name: 'LOS obstacle on the left, vertical',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
            ],
        },
        {
            name: 'LOS obstacle on the right, vertical',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
                "Battle(Infantry/Allies, Infantry/Axis, 2)",
            ],
        },
        {
            name: 'LOS across hex edge blocked on both sides',
            setup: [
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
                "   0   1   2   3   4   5   6   7   8   9  10  11  12",
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
