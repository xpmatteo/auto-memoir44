// ABOUTME: Unit tests for hex coordinate utilities
// ABOUTME: Tests distance calculations and coordinate transformations (ported from doc/hexlib.test.js)

import {expect, test} from "vitest";
import {hexDistance} from "../../src/utils/hex";
import {HexCoord} from "../../src/utils/hex";

test('hex distance', () => {
    expect(hexDistance(new HexCoord(0, 0), new HexCoord(0, 0))).toEqual(0);
    expect(hexDistance(new HexCoord(0, 0), new HexCoord(0, 1))).toEqual(1);
    expect(hexDistance(new HexCoord(1, 0), new HexCoord(4, 2))).toEqual(5);
});
