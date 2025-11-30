// ABOUTME: Unit tests for combat rules, specifically dice count calculation
// ABOUTME: Verifies that units roll the correct number of dice based on type and distance

import {describe, test, expect} from "vitest";
import {calculateDiceCount} from "../../../src/rules/combat";
import {Infantry} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";

describe("calculateDiceCount", () => {
    const infantry = new Infantry(Side.ALLIES, 4);

    const testCases = [
        {attacker: infantry, distance: 1, expectedDice: 3},
        {attacker: infantry, distance: 2, expectedDice: 2},
        {attacker: infantry, distance: 3, expectedDice: 1},
        {attacker: infantry, distance: 4, expectedDice: 0},
    ];

    testCases.forEach(({attacker, distance, expectedDice}) => {
        test(`${attacker} rolls ${expectedDice} dice at distance ${distance}`, () => {
            expect(calculateDiceCount(attacker, distance)).toBe(expectedDice);
        });
    });

});
