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
    ];

    test.each(cases)('$name', ({setup, expected}) => {
        const gameState = createTestGameState();
        parseAndSetupUnits(gameState, setup);
        orderAllFriendlyUnits(gameState);
        const moves = phase.doLegalMoves(gameState);
        expect(toStringAndSort(moves)).toEqual(["EndBattles", ...expected].sort());
    });
});
