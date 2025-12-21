// ABOUTME: Unit tests for retreat path calculation
// ABOUTME: Tests retreat path generation in different directions with obstacles

import {describe, expect, test} from "vitest";
import {GameState} from "../../../src/domain/GameState";
import {Deck} from "../../../src/domain/Deck";
import {HexCoord, hexOf} from "../../../src/utils/hex";
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
            startHex: hexOf(4, 4),
            maxDistance: 1,
            side: Side.AXIS,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(4, 3), hexOf(5, 3)]],
                ]),
            },
        },
        {
            name: "2 hexes north with clear ground",
            startHex: hexOf(4, 4),
            maxDistance: 2,
            side: Side.AXIS,
            want: {
                maxDistance: 2,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(4, 3), hexOf(5, 3)]],
                    [2, [hexOf(4, 2), hexOf(5, 2), hexOf(6, 2)]],
                ]),
            },
        },
        {
            name: "3 hexes north with clear ground",
            startHex: hexOf(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(4, 3), hexOf(5, 3)]],
                    [2, [hexOf(4, 2), hexOf(5, 2), hexOf(6, 2)]],
                    [3, [hexOf(4, 1), hexOf(5, 1), hexOf(6, 1), hexOf(7, 1)]],
                ]),
            },
        },
        // basic retreath south (bottom player)
        {
            name: "1 hex south with clear ground",
            startHex: hexOf(4, 4),
            maxDistance: 1,
            side: Side.ALLIES,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(3, 5), hexOf(4, 5)]],
                ]),
            },
        },
        {
            name: "2 hexes south with clear ground",
            startHex: hexOf(4, 4),
            maxDistance: 2,
            side: Side.ALLIES,
            want: {
                maxDistance: 2,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(3, 5), hexOf(4, 5)]],
                    [2, [hexOf(2, 6), hexOf(3, 6), hexOf(4, 6)]],
                ]),
            },
        },
        {
            name: "3 hexes south with clear ground",
            startHex: hexOf(4, 4),
            maxDistance: 3,
            side: Side.ALLIES,
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(3, 5), hexOf(4, 5)]],
                    [2, [hexOf(2, 6), hexOf(3, 6), hexOf(4, 6)]],
                    [3, [hexOf(1, 7), hexOf(2, 7), hexOf(3, 7), hexOf(4, 7)]],
                ]),
            },
        },
        // retreat blocked by board edge
        {
            name: "north retreat blocked after 1 hex at board edge",
            startHex: hexOf(7, 1),
            maxDistance: 3,
            side: Side.AXIS,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [hexOf(7, 1)]],
                    [1, [hexOf(7, 0), hexOf(8, 0)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "north retreat impossible from northernmost row",
            startHex: hexOf(7, 0),
            maxDistance: 2,
            side: Side.AXIS,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [hexOf(7, 0)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        {
            name: "south retreat blocked after 1 hex at board edge",
            startHex: hexOf(3, 7),
            maxDistance: 3,
            side: Side.ALLIES,
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [hexOf(3, 7)]],
                    [1, [hexOf(2, 8), hexOf(3, 8)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "south retreat impossible from southernmost row",
            startHex: hexOf(3, 8),
            maxDistance: 2,
            side: Side.ALLIES,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [hexOf(3, 8)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        // retreat blocked by occupied hexes
        {
            name: "north retreat partially blocked - one path remains",
            startHex: hexOf(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            occupiedHexes: [hexOf(4, 3)],
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(5, 3)]],
                    [2, [hexOf(5, 2), hexOf(6, 2)]],
                    [3, [hexOf(5, 1), hexOf(6, 1), hexOf(7, 1)]],
                ]),
            },
        },
        {
            name: "north retreat fully blocked at first step",
            startHex: hexOf(4, 4),
            maxDistance: 2,
            side: Side.AXIS,
            occupiedHexes: [hexOf(4, 3), hexOf(5, 3)],
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        {
            name: "north retreat blocked at second step",
            startHex: hexOf(4, 4),
            maxDistance: 3,
            side: Side.AXIS,
            occupiedHexes: [hexOf(4, 2), hexOf(5, 2), hexOf(6, 2)],
            want: {
                maxDistance: 1,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(4, 3), hexOf(5, 3)]],
                    [2, []],
                    [3, []],
                ]),
            },
        },
        {
            name: "south retreat partially blocked - one path remains",
            startHex: hexOf(4, 4),
            maxDistance: 3,
            side: Side.ALLIES,
            occupiedHexes: [hexOf(4, 5)],
            want: {
                maxDistance: 3,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, [hexOf(3, 5)]],
                    [2, [hexOf(2, 6), hexOf(3, 6)]],
                    [3, [hexOf(1, 7), hexOf(2, 7), hexOf(3, 7)]],
                ]),
            },
        },
        {
            name: "south retreat fully blocked at first step",
            startHex: hexOf(4, 4),
            maxDistance: 2,
            side: Side.ALLIES,
            occupiedHexes: [hexOf(3, 5), hexOf(4, 5)],
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
                    [1, []],
                    [2, []],
                ]),
            },
        },
        // edge cases
        {
            name: "zero maxDistance returns only starting position",
            startHex: hexOf(4, 4),
            maxDistance: 0,
            side: Side.AXIS,
            want: {
                maxDistance: 0,
                paths: new Map([
                    [0, [hexOf(4, 4)]],
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
