// ABOUTME: Unit tests for retreat path calculation
// ABOUTME: Tests retreat path generation in different directions with obstacles

import {describe, expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {HexCoord} from "../../../src/utils/hex";
import {Side} from "../../../src/domain/Player";
import {Infantry} from "../../../src/domain/Unit";
import {retreatPaths, RetreatPaths} from "../../../src/rules/retreatPaths";

describe("retreatPaths", () => {
    interface RetreatCase {
        name: string;
        startHex: HexCoord;
        maxDistance: number;
        side: Side;
        occupiedHexes?: HexCoord[];
        want: RetreatPaths;
    }

    // basic retreath north (top player)
    const cases: RetreatCase[] = [
        {
            name: "1 hex north with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 1,
            side: Side.AXIS,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(4, 3), new HexCoord(5, 3)]],
                ]),
            },
        },
        {
            name: "2 hexes north with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 2,
            side: Side.AXIS,
            want: {
                maxDistance: 2,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(4, 3), new HexCoord(5, 3)]],
                    [2, [new HexCoord(4, 2), new HexCoord(5, 2), new HexCoord(6, 2)]],
                ]),
            },
        },
        {
            name: "3 hexes north with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(4, 3), new HexCoord(5, 3)]],
                    [2, [new HexCoord(4, 2), new HexCoord(5, 2), new HexCoord(6, 2)]],
                    [3, [new HexCoord(4, 1), new HexCoord(5, 1), new HexCoord(6, 1), new HexCoord(7, 1)]],
                ]),
            },
        },
        // basic retreath south (bottom player)
        {
            name: "1 hex south with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 1,
            side: Side.ALLIES,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(3, 5), new HexCoord(4, 5)]],
                ]),
            },
        },
        {
            name: "2 hexes south with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 2,
            side: Side.ALLIES,
            want: {
                maxDistance: 2,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(3, 5), new HexCoord(4, 5)]],
                    [2, [new HexCoord(2, 6), new HexCoord(3, 6), new HexCoord(4, 6)]],
                ]),
            },
        },
        {
            name: "3 hexes south with clear ground",
            startHex: new HexCoord(4, 4),
            maxDistance: 3,
            side: Side.ALLIES,
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(3, 5), new HexCoord(4, 5)]],
                    [2, [new HexCoord(2, 6), new HexCoord(3, 6), new HexCoord(4, 6)]],
                    [3, [new HexCoord(1, 7), new HexCoord(2, 7), new HexCoord(3, 7), new HexCoord(4, 7)]],
                ]),
            },
        },
        // retreat blocked by board edge
        {
            name: "north retreat blocked after 1 hex at board edge",
            startHex: new HexCoord(7, 1),
            maxDistance: 3,
            side: Side.AXIS,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [new HexCoord(7, 1)]],
                    [1, [new HexCoord(7, 0), new HexCoord(8, 0)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "north retreat impossible from northernmost row",
            startHex: new HexCoord(7, 0),
            maxDistance: 2,
            side: Side.AXIS,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [new HexCoord(7, 0)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        {
            name: "south retreat blocked after 1 hex at board edge",
            startHex: new HexCoord(3, 7),
            maxDistance: 3,
            side: Side.ALLIES,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [new HexCoord(3, 7)]],
                    [1, [new HexCoord(2, 8), new HexCoord(3, 8)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "south retreat impossible from southernmost row",
            startHex: new HexCoord(3, 8),
            maxDistance: 2,
            side: Side.ALLIES,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [new HexCoord(3, 8)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        // retreat blocked by occupied hexes
        {
            name: "north retreat partially blocked - one path remains",
            startHex: new HexCoord(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            occupiedHexes: [new HexCoord(4, 3)],
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(5, 3)]],
                    [2, [new HexCoord(5, 2), new HexCoord(6, 2)]],
                    [3, [new HexCoord(5, 1), new HexCoord(6, 1), new HexCoord(7, 1)]],
                ]),
            },
        },
        {
            name: "north retreat fully blocked at first step",
            startHex: new HexCoord(4, 4),
            maxDistance: 2,
            side: Side.AXIS,
            occupiedHexes: [new HexCoord(4, 3), new HexCoord(5, 3)],
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        {
            name: "north retreat blocked at second step",
            startHex: new HexCoord(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            occupiedHexes: [new HexCoord(4, 2), new HexCoord(5, 2), new HexCoord(6, 2)],
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(4, 3), new HexCoord(5, 3)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "south retreat partially blocked - one path remains",
            startHex: new HexCoord(4, 4),
            maxDistance: 3,
            side: Side.ALLIES,
            occupiedHexes: [new HexCoord(4, 5)],
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, [new HexCoord(3, 5)]],
                    [2, [new HexCoord(2, 6), new HexCoord(3, 6)]],
                    [3, [new HexCoord(1, 7), new HexCoord(2, 7), new HexCoord(3, 7)]],
                ]),
            },
        },
        {
            name: "south retreat fully blocked at first step",
            startHex: new HexCoord(4, 4),
            maxDistance: 2,
            side: Side.ALLIES,
            occupiedHexes: [new HexCoord(3, 5), new HexCoord(4, 5)],
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        // edge cases
        {
            name: "zero maxDistance returns only starting position",
            startHex: new HexCoord(4, 4),
            maxDistance: 0,
            side: Side.AXIS,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [new HexCoord(4, 4)]],
                ]),
            },
        },
    ];

    test.each(cases)("$name", ({startHex, maxDistance, side, occupiedHexes = [], want}) => {
        const deck = Deck.createStandardDeck();
        const gameState = new GameState(deck);

        // Place blocking units
        occupiedHexes.forEach(hex => {
            gameState.placeUnit(hex, new Infantry(Side.ALLIES));
        });

        const got = retreatPaths(gameState, startHex, maxDistance, side);

        expect(got).toEqual(want);
    });
});
