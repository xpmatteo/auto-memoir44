// ABOUTME: Unit tests for combat rules, specifically dice count calculation
// ABOUTME: Verifies that units roll the correct number of dice based on type and distance

import {describe, test, expect} from "vitest";
import {calculateDiceCount} from "../../../src/rules/combat";
import {Infantry, Unit} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {
    clearTerrain,
    hedgerowsTerrain,
    hillTerrain,
    Terrain,
    town1Terrain,
    woodsTerrain
} from "../../../src/domain/terrain/Terrain";

describe("calculateDiceCount", () => {
    const infantry = new Infantry(Side.ALLIES, 4);

    interface TestCase {
        attacker: Unit,
        attackerTerrain: Terrain | undefined,
        distance: number,
        defenderTerrain: Terrain | undefined,
        expectedDice: number,
    }
    const testCases = [
        {attacker: infantry, distance: 1, expectedDice: 3},
        {attacker: infantry, distance: 2, expectedDice: 2},
        {attacker: infantry, distance: 3, expectedDice: 1},
        {attacker: infantry, distance: 4, expectedDice: 0},

        // some terrains reduce infantry dice by 1
        {attacker: infantry, distance: 1, defenderTerrain: woodsTerrain, expectedDice: 2},
        {attacker: infantry, distance: 2, defenderTerrain: woodsTerrain, expectedDice: 1},
        {attacker: infantry, distance: 3, defenderTerrain: woodsTerrain, expectedDice: 0},
        {attacker: infantry, distance: 4, defenderTerrain: woodsTerrain, expectedDice: 0},
        {attacker: infantry, distance: 1, defenderTerrain: town1Terrain, expectedDice: 2},
        {attacker: infantry, distance: 2, defenderTerrain: town1Terrain, expectedDice: 1},
        {attacker: infantry, distance: 3, defenderTerrain: town1Terrain, expectedDice: 0},
        {attacker: infantry, distance: 4, defenderTerrain: town1Terrain, expectedDice: 0},
        {attacker: infantry, distance: 1, defenderTerrain: hedgerowsTerrain, expectedDice: 2},
        {attacker: infantry, distance: 2, defenderTerrain: hedgerowsTerrain, expectedDice: 1},
        {attacker: infantry, distance: 3, defenderTerrain: hedgerowsTerrain, expectedDice: 0},
        {attacker: infantry, distance: 4, defenderTerrain: hedgerowsTerrain, expectedDice: 0},

        // fighting uphill reduces dice by 1
        {attacker: infantry, attackerTerrain: clearTerrain, distance: 1, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: infantry, attackerTerrain: clearTerrain, distance: 2, defenderTerrain: hillTerrain, expectedDice: 1},
        {attacker: infantry, attackerTerrain: clearTerrain, distance: 3, defenderTerrain: hillTerrain, expectedDice: 0},
        {attacker: infantry, attackerTerrain: clearTerrain, distance: 4, defenderTerrain: hillTerrain, expectedDice: 0},

        // fighting from hill to hill does not reduce dice
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 1, defenderTerrain: hillTerrain, expectedDice: 3},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 2, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 3, defenderTerrain: hillTerrain, expectedDice: 1},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 4, defenderTerrain: hillTerrain, expectedDice: 0},
    ] as TestCase[];

    testCases.forEach(({attacker, attackerTerrain, distance, defenderTerrain, expectedDice}) => {
        attackerTerrain ??= clearTerrain;
        defenderTerrain ??= clearTerrain;
        test(`${attacker} in ${attackerTerrain} against defender in ${defenderTerrain} at distance ${distance} rolls ${expectedDice} dice`, () => {
            expect(calculateDiceCount(attacker, attackerTerrain, distance, defenderTerrain)).toBe(expectedDice);
        });
    });

});
