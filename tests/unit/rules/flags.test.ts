import {describe, test, expect} from "vitest";
import {FlagResult, handleFlags} from "../../../src/rules/flags";
import {HexCoord, hexOf} from "../../../src/utils/hex";
import {RetreatPaths} from "../../../src/rules/retreatPaths";

function buildRetreatPaths(retreatPathLength: number): RetreatPaths {
    const paths = new Map<number, Array<HexCoord>>();
    for (let i = 0; i <= retreatPathLength; i++) {
        paths.set(i, [hexOf(i, i)]);
    }
    return {
        maxDistance: retreatPathLength,
        paths: paths,
    };
}

function assertHandleFlags(
    flags: number,
    retreatHexesPerFlag: number,
    ignorableFlags: number,
    retreatPathLength: number,
    expectedResult: FlagResult,
    message?: string
) {
    if (!message) {
        message = `${flags} ${retreatHexesPerFlag} ${ignorableFlags} ${retreatPathLength}`;
    }

    test(message, () => {
        const retreatPaths = buildRetreatPaths(retreatPathLength);
        const actualResult = handleFlags(flags, ignorableFlags, retreatPaths, retreatHexesPerFlag);
        expect(actualResult).toEqual(expectedResult);
    });
}

describe('handleFlags when not ignorable and retreat is clear', () => {
    assertHandleFlags(0, 2, 0, 0, FlagResult.NO_EFFECT, "no flags");
    assertHandleFlags(1, 1, 0, 1, FlagResult.retreat([hexOf(1, 1)]));
    assertHandleFlags(1, 2, 0, 2, FlagResult.retreat([hexOf(2, 2)]));
    assertHandleFlags(2, 2, 0, 4, FlagResult.retreat([hexOf(4, 4)]));
});

describe('handleFlags when not ignorable and retreat is blocked', () => {
    assertHandleFlags(0, 0, 0, 0, FlagResult.NO_EFFECT);
    assertHandleFlags(1, 1, 0, 0, FlagResult.damage(1));
    assertHandleFlags(1, 2, 0, 0, FlagResult.damage(2));
    assertHandleFlags(1, 2, 0, 1, new FlagResult(1, [hexOf(1, 1)]));
    assertHandleFlags(2, 2, 0, 2, new FlagResult(2, [hexOf(2, 2)]));
    assertHandleFlags(2, 2, 0, 3, new FlagResult(1, [hexOf(3, 3)]));
});

describe('handleFlags when ignorable and no damage', () => {
    assertHandleFlags(1, 1, 1, 1, FlagResult.retreat([hexOf(0, 0), hexOf(1, 1)]));
    assertHandleFlags(2, 1, 1, 2, FlagResult.retreat([hexOf(1, 1), hexOf(2, 2)]));
    assertHandleFlags(3, 1, 1, 3, FlagResult.retreat([hexOf(2, 2), hexOf(3, 3)]));
    assertHandleFlags(1, 2, 1, 2, FlagResult.retreat([hexOf(0, 0), hexOf(2, 2)]));
    assertHandleFlags(2, 2, 1, 4, FlagResult.retreat([hexOf(2, 2), hexOf(4, 4)]));
});

describe('handleFlags when ignorable and there is or would be damage, so the flag MUST be ignored', () => {
    assertHandleFlags(0, 1, 1, 1, new FlagResult(0, []));
    assertHandleFlags(1, 1, 1, 0, new FlagResult(0, []));
    assertHandleFlags(2, 1, 1, 1, new FlagResult(0, [hexOf(1, 1)]));
    assertHandleFlags(3, 1, 1, 2, new FlagResult(0, [hexOf(2, 2)]));
    assertHandleFlags(2, 1, 1, 0, new FlagResult(1, []));
    assertHandleFlags(3, 1, 1, 1, new FlagResult(1, [hexOf(1, 1)]));
    assertHandleFlags(3, 1, 1, 2, new FlagResult(0, [hexOf(2, 2)]));
    assertHandleFlags(1, 2, 1, 1, new FlagResult(0, []));
    assertHandleFlags(1, 2, 1, 0, new FlagResult(0, []));
    assertHandleFlags(2, 2, 1, 0, new FlagResult(2, []));
    assertHandleFlags(2, 2, 1, 1, new FlagResult(1, [hexOf(1, 1)]));
    assertHandleFlags(2, 2, 1, 2, new FlagResult(0, [hexOf(2, 2)]));
    assertHandleFlags(3, 2, 1, 2, new FlagResult(2, [hexOf(2, 2)]));
    assertHandleFlags(3, 2, 1, 3, new FlagResult(1, [hexOf(3, 3)]));
});


