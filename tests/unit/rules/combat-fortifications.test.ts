// ABOUTME: Unit tests for combat calculations with fortifications
// ABOUTME: Tests max() logic for non-cumulative terrain and fortification bonuses

import {describe, expect, test} from 'vitest';
import {calculateDiceCount} from '../../../src/rules/combat';
import {Infantry, Armor} from '../../../src/domain/Unit';
import {Side} from '../../../src/domain/Player';
import {clearTerrain, hillTerrain, woodsTerrain} from '../../../src/domain/terrain/Terrain';
import {
    sandbagAllies,
    noFortification,
    Fortification
} from '../../../src/domain/fortifications/Fortification';

interface CombatFortificationCase {
    name: string;
    attacker: Infantry | Armor;
    attackerTerrain: typeof clearTerrain;
    distance: number;
    defenderTerrain: typeof clearTerrain | typeof woodsTerrain;
    defenderFortification: Fortification;
    expectedDice: number;
}

describe('calculateDiceCount with fortifications', () => {
    const cases: CombatFortificationCase[] = [
        {
            name: 'infantry vs sandbag at distance 1',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: clearTerrain,
            defenderFortification: sandbagAllies,
            expectedDice: 2,  // 3 base - 1 fortification
        },
        {
            name: 'armor vs sandbag at distance 1',
            attacker: new Armor(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: clearTerrain,
            defenderFortification: sandbagAllies,
            expectedDice: 2,  // 3 base - 1 fortification
        },
        {
            name: 'infantry vs sandbag at distance 2',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 2,
            defenderTerrain: clearTerrain,
            defenderFortification: sandbagAllies,
            expectedDice: 1,  // 2 base - 1 fortification
        },
        {
            name: 'infantry vs sandbag at distance 3',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 3,
            defenderTerrain: clearTerrain,
            defenderFortification: sandbagAllies,
            expectedDice: 0,  // 1 base - 1 fortification
        },
        {
            name: 'infantry vs woods with sandbag (max reduction)',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: woodsTerrain,  // -1 terrain
            defenderFortification: sandbagAllies,  // -1 fortification
            expectedDice: 2,  // 3 base - max(1, 1) = 2
        },
        {
            name: 'armor vs woods with sandbag (terrain wins)',
            attacker: new Armor(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: woodsTerrain,  // -2 terrain
            defenderFortification: sandbagAllies,  // -1 fortification
            expectedDice: 1,  // 3 base - max(2, 1) = 1
        },
        {
            name: 'infantry vs no fortification',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: clearTerrain,
            defenderFortification: noFortification,
            expectedDice: 3,  // 3 base - 0 = 3
        },
        {
            name: 'infantry vs hill with sandbag (max reduction)',
            attacker: new Infantry(Side.ALLIES),
            attackerTerrain: clearTerrain,
            distance: 1,
            defenderTerrain: hillTerrain,  // -1 terrain
            defenderFortification: sandbagAllies,  // -1 fortification
            expectedDice: 2,  // 3 base - max(1, 1) = 2
        },

    ];

    test.each(cases)('$name', ({attacker, attackerTerrain, distance, defenderTerrain, defenderFortification, expectedDice}) => {
        const dice = calculateDiceCount(attacker, attackerTerrain, distance, defenderTerrain, defenderFortification);
        expect(dice).toBe(expectedDice);
    });
});
