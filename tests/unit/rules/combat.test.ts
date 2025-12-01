// ABOUTME: Unit tests for combat rules, specifically dice count calculation
// ABOUTME: Verifies that units roll the correct number of dice based on type and distance

import {describe, test, expect} from "vitest";
import {calculateDiceCount, resolveHits} from "../../../src/rules/combat";
import {Armor, Infantry, Unit} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {
    DiceResult,
    RESULT_INFANTRY,
    RESULT_ARMOR,
    RESULT_GRENADE,
    RESULT_STAR,
    RESULT_FLAG
} from "../../../src/domain/Dice";
import {
    clearTerrain,
    hedgerowsTerrain,
    hillTerrain,
    Terrain,
    town1Terrain,
    woodsTerrain
} from "../../../src/domain/terrain/Terrain";

describe("calculateDiceCount", () => {
    const infantry = new Infantry(Side.ALLIES);
    const armor = new Armor(Side.ALLIES);

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
        {attacker: armor, attackerTerrain: clearTerrain, distance: 1, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: armor, attackerTerrain: clearTerrain, distance: 2, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: armor, attackerTerrain: clearTerrain, distance: 3, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: armor, attackerTerrain: clearTerrain, distance: 4, defenderTerrain: hillTerrain, expectedDice: 0},

        // fighting from hill to hill does not reduce dice
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 1, defenderTerrain: hillTerrain, expectedDice: 3},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 2, defenderTerrain: hillTerrain, expectedDice: 2},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 3, defenderTerrain: hillTerrain, expectedDice: 1},
        {attacker: infantry, attackerTerrain: hillTerrain, distance: 4, defenderTerrain: hillTerrain, expectedDice: 0},
        {attacker: armor, attackerTerrain: hillTerrain, distance: 1, defenderTerrain: hillTerrain, expectedDice: 3},
        {attacker: armor, attackerTerrain: hillTerrain, distance: 2, defenderTerrain: hillTerrain, expectedDice: 3},
        {attacker: armor, attackerTerrain: hillTerrain, distance: 3, defenderTerrain: hillTerrain, expectedDice: 3},
        {attacker: armor, attackerTerrain: hillTerrain, distance: 4, defenderTerrain: hillTerrain, expectedDice: 0},

        // Armor
        {attacker: armor, distance: 1, expectedDice: 3},
        {attacker: armor, distance: 2, expectedDice: 3},
        {attacker: armor, distance: 3, expectedDice: 3},
        {attacker: armor, distance: 4, expectedDice: 0},
        {attacker: armor, distance: 1, defenderTerrain: woodsTerrain, expectedDice: 1},
        {attacker: armor, distance: 2, defenderTerrain: woodsTerrain, expectedDice: 1},
        {attacker: armor, distance: 3, defenderTerrain: woodsTerrain, expectedDice: 1},
        {attacker: armor, distance: 4, defenderTerrain: woodsTerrain, expectedDice: 0},
        {attacker: armor, distance: 1, defenderTerrain: town1Terrain, expectedDice: 1},
        {attacker: armor, distance: 2, defenderTerrain: town1Terrain, expectedDice: 1},
        {attacker: armor, distance: 3, defenderTerrain: town1Terrain, expectedDice: 1},
        {attacker: armor, distance: 4, defenderTerrain: town1Terrain, expectedDice: 0},
        {attacker: armor, distance: 1, defenderTerrain: hedgerowsTerrain, expectedDice: 1},
        {attacker: armor, distance: 2, defenderTerrain: hedgerowsTerrain, expectedDice: 1},
        {attacker: armor, distance: 3, defenderTerrain: hedgerowsTerrain, expectedDice: 1},
        {attacker: armor, distance: 4, defenderTerrain: hedgerowsTerrain, expectedDice: 0},


    ] as TestCase[];

    testCases.forEach(({attacker, attackerTerrain, distance, defenderTerrain, expectedDice}) => {
        attackerTerrain ??= clearTerrain;
        defenderTerrain ??= clearTerrain;
        test(`${attacker} in ${attackerTerrain} against defender in ${defenderTerrain} at distance ${distance} rolls ${expectedDice} dice`, () => {
            expect(calculateDiceCount(attacker, attackerTerrain, distance, defenderTerrain)).toBe(expectedDice);
        });
    });

});

describe("resolveHits", () => {
    const infantry = new Infantry(Side.ALLIES);
    const armor = new Armor(Side.ALLIES);

    interface ResolveHitsCase {
        name: string;
        diceResults: DiceResult[];
        target: Unit;
        expectedHits: number;
    }

    const cases: ResolveHitsCase[] = [
        // Infantry target cases
        {name: "no dice vs infantry", diceResults: [], target: infantry, expectedHits: 0},
        {name: "1 infantry symbol vs infantry", diceResults: [RESULT_INFANTRY], target: infantry, expectedHits: 1},
        {name: "2 infantry symbols vs infantry", diceResults: [RESULT_INFANTRY, RESULT_INFANTRY], target: infantry, expectedHits: 2},
        {name: "1 grenade vs infantry", diceResults: [RESULT_GRENADE], target: infantry, expectedHits: 1},
        {name: "1 armor symbol vs infantry", diceResults: [RESULT_ARMOR], target: infantry, expectedHits: 0},
        {name: "1 star vs infantry", diceResults: [RESULT_STAR], target: infantry, expectedHits: 0},
        {name: "1 flag vs infantry", diceResults: [RESULT_FLAG], target: infantry, expectedHits: 0},
        {name: "mixed hits vs infantry", diceResults: [RESULT_INFANTRY, RESULT_GRENADE, RESULT_INFANTRY], target: infantry, expectedHits: 3},
        {name: "mixed with misses vs infantry", diceResults: [RESULT_INFANTRY, RESULT_ARMOR, RESULT_GRENADE, RESULT_STAR, RESULT_FLAG], target: infantry, expectedHits: 2},
        {name: "all misses vs infantry", diceResults: [RESULT_ARMOR, RESULT_STAR, RESULT_FLAG], target: infantry, expectedHits: 0},

        // Armor target cases
        {name: "no dice vs armor", diceResults: [], target: armor, expectedHits: 0},
        {name: "1 armor symbol vs armor", diceResults: [RESULT_ARMOR], target: armor, expectedHits: 1},
        {name: "2 armor symbols vs armor", diceResults: [RESULT_ARMOR, RESULT_ARMOR], target: armor, expectedHits: 2},
        {name: "1 grenade vs armor", diceResults: [RESULT_GRENADE], target: armor, expectedHits: 1},
        {name: "1 infantry symbol vs armor", diceResults: [RESULT_INFANTRY], target: armor, expectedHits: 0},
        {name: "1 star vs armor", diceResults: [RESULT_STAR], target: armor, expectedHits: 0},
        {name: "1 flag vs armor", diceResults: [RESULT_FLAG], target: armor, expectedHits: 0},
        {name: "mixed hits vs armor", diceResults: [RESULT_ARMOR, RESULT_GRENADE, RESULT_ARMOR], target: armor, expectedHits: 3},
        {name: "mixed with misses vs armor", diceResults: [RESULT_ARMOR, RESULT_INFANTRY, RESULT_GRENADE, RESULT_STAR, RESULT_FLAG], target: armor, expectedHits: 2},
        {name: "all misses vs armor", diceResults: [RESULT_INFANTRY, RESULT_STAR, RESULT_FLAG], target: armor, expectedHits: 0},
    ];

    test.each(cases)('$name', ({diceResults, target, expectedHits}) => {
        const hits = resolveHits(diceResults, target);
        expect(hits).toBe(expectedHits);
    });
});
