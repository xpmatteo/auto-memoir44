// ABOUTME: Unit tests for hex coordinate utilities
// ABOUTME: Tests distance calculations and coordinate transformations (ported from doc/hexlib.test.js)

import {expect, test} from "vitest";
import {hexDistance} from "../../src/utils/hex";
import {HexCoord} from "../../src/utils/hex";

test('hex distance', () => {
    expect(hexDistance({q: 0, r: 0}, {q: 0, r: 0})).toEqual(0);
    expect(hexDistance({q: 0, r: 0}, {q: 0, r: 1})).toEqual(1);
    expect(hexDistance({q: 1, r: 0}, {q: 4, r: 2})).toEqual(5);
});
