import {describe, expect, test} from "vitest";
import {hasLineOfSight, HexCoord} from "../../../src/utils/hex";

function hexOf(q:number, r:number) {
    return new HexCoord(q, r);
}

describe('line of sight', () => {
    [
        {from: hexOf(0,0), to: hexOf(0,1), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(0,2), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(0,3), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(1,0), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(2,0), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(3,0), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(1,1), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(1,2), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(2,1), withObstaclesAt: [], expected: true },
        {from: hexOf(0,0), to: hexOf(-1,2), withObstaclesAt: [], expected: true },

        {from: hexOf(0,0), to: hexOf(0,2), withObstaclesAt: [hexOf(0,1)], expected: false },
        {from: hexOf(0,0), to: hexOf(2,1), withObstaclesAt: [hexOf(1,1)], expected: false },
        {from: hexOf(0,0), to: hexOf(1,2), withObstaclesAt: [hexOf(1,1)], expected: false },
        {from: hexOf(0,0), to: hexOf(0,2), withObstaclesAt: [hexOf(1,1)], expected: true },
        {from: hexOf(0,0), to: hexOf(2,0), withObstaclesAt: [hexOf(1,1)], expected: true },

        // north-south edge cases
        // {from: hexOf(3,0), to: hexOf(2,2), withObstaclesAt: [hexOf(3,1)], expected: true },
        // {from: hexOf(3,0), to: hexOf(2,2), withObstaclesAt: [hexOf(2,1)], expected: true },
        // {from: hexOf(3,0), to: hexOf(2,2), withObstaclesAt: [hexOf(2,1), hexOf(3,1)], expected: false },
        // {from: hexOf(2,2), to: hexOf(3,0), withObstaclesAt: [hexOf(3,1)], expected: true },
        // {from: hexOf(2,2), to: hexOf(3,0), withObstaclesAt: [hexOf(2,1)], expected: true },
        // {from: hexOf(2,2), to: hexOf(3,0), withObstaclesAt: [hexOf(2,1), hexOf(3,1)], expected: false },
        //
        // // nw-se edge cases
        // {from: hexOf(0,0), to: hexOf(1,1), withObstaclesAt: [hexOf(1,0)], expected: true },
        // {from: hexOf(0,0), to: hexOf(1,1), withObstaclesAt: [hexOf(0,1)], expected: true },
        // {from: hexOf(0,0), to: hexOf(1,1), withObstaclesAt: [hexOf(1,0), hexOf(0,1)], expected: false },
        // {from: hexOf(1,1), to: hexOf(0,0), withObstaclesAt: [hexOf(1,0)], expected: true },
        // {from: hexOf(1,1), to: hexOf(0,0), withObstaclesAt: [hexOf(0,1)], expected: true },
        // {from: hexOf(1,1), to: hexOf(0,0), withObstaclesAt: [hexOf(1,0), hexOf(0,1)], expected: false },
        //
        // // ne-sw edge cases
        // {from: hexOf(1,2), to: hexOf(3,1), withObstaclesAt: [hexOf(2,1)], expected: true },
        // {from: hexOf(1,2), to: hexOf(3,1), withObstaclesAt: [hexOf(2,2)], expected: true },
        // {from: hexOf(1,2), to: hexOf(3,1), withObstaclesAt: [hexOf(2,1), hexOf(2,2)], expected: false },
        // {from: hexOf(3,1), to: hexOf(1,2), withObstaclesAt: [hexOf(2,1)], expected: true },
        // {from: hexOf(3,1), to: hexOf(1,2), withObstaclesAt: [hexOf(2,2)], expected: true },
        // {from: hexOf(3,1), to: hexOf(1,2), withObstaclesAt: [hexOf(2,1), hexOf(2,2)], expected: false },

    ].forEach(({from, to, withObstaclesAt, expected}) => {
        test(`Line of sight from ${from} to ${to} with obstacles at ${withObstaclesAt}: ${expected}`, () => {
            const blocked = (hex: HexCoord) =>
                withObstaclesAt.some(obs => obs.q === hex.q && obs.r === hex.r) ||
                (hex.q === from.q && hex.r === from.r) ||
                (hex.q === to.q && hex.r === to.r);
            expect(hasLineOfSight(to, from, blocked)).toBe(expected);
        });
    });

});
