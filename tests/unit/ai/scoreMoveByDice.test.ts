import { describe, expect, test} from "vitest";
import {createTestGameState} from "../../helpers/testHelpers";
import {BattlePhase} from "../../../src/domain/phases/BattlePhase";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {HexCoord, hexDistance} from "../../../src/utils/hex";
import {scoreMoveByDice} from "../../../src/ai/scoreMoveByDice";

describe("scoreMoveByDice", () => {
    interface ScoreByDiceCase {
        name: string
        fromHex: HexCoord
        toHex: HexCoord
        enemies: Array<{hex: HexCoord, expectedDistance: number, strength: number}>
        expected: number
    }

    const cases: ScoreByDiceCase[] = [
        // score varies by distance
        {
            name: 'move 1 towards 1 target at distance 1',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(2, 0), expectedDistance: 1, strength: 4},
            ],
            expected: 300,
        },
        {
            name: 'move 1 towards 1 target at distance 2',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(3, 0), expectedDistance: 2, strength: 4},
            ],
            expected: 200,
        },
        {
            name: 'move 1 towards 1 target at distance 3',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(4, 0), expectedDistance: 3, strength: 4},
            ],
            expected: 100,
        },
        {
            name: 'move 1 towards 1 target at distance 4',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(5, 0), expectedDistance: 4, strength: 4},
            ],
            expected: 0,
        },
        // score varies by target strength
        {
            name: 'move 1 towards 1 target at strength 3 distance 1',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(2, 0), expectedDistance: 1, strength: 3},
            ],
            expected: 600,
        },
        {
            name: 'move 1 towards 1 target at strength 3 distance 2',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(3, 0), expectedDistance: 2, strength: 3},
            ],
            expected: 400,
        },
        {
            name: 'move 1 towards 1 target at strength 3 distance 3',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(4, 0), expectedDistance: 3, strength: 3},
            ],
            expected: 200,
        },
        {
            name: 'move 1 towards 1 target at strength 2 distance 3',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(4, 0), expectedDistance: 3, strength: 2},
            ],
            expected: 300,
        },
        {
            name: 'move 1 towards 1 target at strength 1 distance 3',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(4, 0), expectedDistance: 3, strength: 1},
            ],
            expected: 400,
        },
        {
            name: 'move 1 towards 1 target at strength 1 distance 1',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(2, 0), expectedDistance: 1, strength: 1},
            ],
            expected: 1200,
        },
        // score from multiple units is summed
        {
            name: 'move 1 towards 2 targets at strength 4 distance 1',
            fromHex: new HexCoord(0, 0),
            toHex: new HexCoord(1, 0),
            enemies: [
                {hex: new HexCoord(2, 0), expectedDistance: 1, strength: 4},
                {hex: new HexCoord(1, 1), expectedDistance: 1, strength: 4},
            ],
            expected: 600,
        },
        // infantry moving twice cannot battle
        // {
        //     name: 'move 2 towards 1 targets at distance 1',
        //     fromHex: new HexCoord(0, 0),
        //     toHex: new HexCoord(2, 0),
        //     enemies: [
        //         {hex: new HexCoord(3, 0), expectedDistance: 1, strength: 4},
        //     ],
        //     expected: 0,
        // },
    ];

    test.each(cases)('$name', ({fromHex, toHex, enemies, expected}) => {
        const gameState = createTestGameState();
        gameState.pushPhase(new BattlePhase());
        const friendlyUnit = new Infantry(Side.ALLIES);
        gameState.placeUnit(fromHex, friendlyUnit);
        gameState.orderUnit(friendlyUnit);

        for (const {hex, expectedDistance, strength} of enemies) {
            const enemyUnit = new Infantry(Side.AXIS);
            gameState.placeUnit(hex, enemyUnit);
            expect(hexDistance(toHex, hex), 'Error in setup: distance is not what we expected').toBe(expectedDistance);
            if (strength < 4) {
                gameState.setUnitCurrentStrength(enemyUnit, strength);
            }
        }

        const clonedState = gameState.clone();
        const score = scoreMoveByDice(gameState, fromHex, toHex);

        expect(score, 'score expected to be').toEqual(expected);
        expect(gameState, 'should not be changed').toEqual(clonedState);
    })
});
