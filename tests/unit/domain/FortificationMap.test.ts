// ABOUTME: Unit tests for FortificationMap
// ABOUTME: Tests set/get/remove operations and cloning

import {describe, expect, test} from 'vitest';
import {FortificationMap} from '../../../src/domain/FortificationMap';
import {sandbagAllies, sandbagAxis, noFortification} from '../../../src/domain/fortifications/Fortification';
import {HexCoord, hexOf} from '../../../src/utils/hex';

interface FortificationMapCase {
    name: string;
    setup: (map: FortificationMap) => void;
    test: (map: FortificationMap) => void;
}

describe('FortificationMap', () => {
    const cases: FortificationMapCase[] = [
        {
            name: 'set and get fortification',
            setup: (map) => {
                map.set(hexOf(0, 0), sandbagAllies);
            },
            test: (map) => {
                const fort = map.get(hexOf(0, 0));
                expect(fort).toBe(sandbagAllies);
            },
        },
        {
            name: 'get returns noFortification for empty hex',
            setup: (_map) => {
                // No setup needed
            },
            test: (map) => {
                expect(map.get(hexOf(0, 0))).toBe(noFortification);
            },
        },
        {
            name: 'remove fortification',
            setup: (map) => {
                map.set(hexOf(0, 0), sandbagAllies);
                map.remove(hexOf(0, 0));
            },
            test: (map) => {
                expect(map.get(hexOf(0, 0))).toBe(noFortification);
            },
        },
        {
            name: 'can set multiple fortifications',
            setup: (map) => {
                map.set(hexOf(0, 0), sandbagAllies);
                map.set(hexOf(1, 1), sandbagAxis);
            },
            test: (map) => {
                expect(map.get(hexOf(0, 0))).toBe(sandbagAllies);
                expect(map.get(hexOf(1, 1))).toBe(sandbagAxis);
            },
        },
        {
            name: 'clone preserves fortifications',
            setup: (map) => {
                map.set(hexOf(0, 0), sandbagAllies);
            },
            test: (map) => {
                const cloned = map.clone();
                expect(cloned.get(hexOf(0, 0))).toBe(sandbagAllies);
            },
        },
        {
            name: 'clone creates independent copy',
            setup: (map) => {
                map.set(hexOf(0, 0), sandbagAllies);
            },
            test: (map) => {
                const cloned = map.clone();
                map.remove(hexOf(0, 0));
                // Original removed (returns noFortification), but clone should still have it
                expect(map.get(hexOf(0, 0))).toBe(noFortification);
                expect(cloned.get(hexOf(0, 0))).toBe(sandbagAllies);
            },
        },
    ];

    test.each(cases)('$name', ({setup, test}) => {
        const map = new FortificationMap();
        setup(map);
        test(map);
    });
});

describe('FortificationMap.forEach', () => {
    test('iterates over all fortifications', () => {
        const map = new FortificationMap();
        map.set(hexOf(0, 0), sandbagAllies);
        map.set(hexOf(1, 1), sandbagAxis);

        const forts: Array<{hex: HexCoord, fort: any}> = [];
        map.forEach((fort, hex) => {
            forts.push({hex, fort});
        });

        expect(forts).toHaveLength(2);
        expect(forts.some(f => f.hex.q === 0 && f.hex.r === 0 && f.fort === sandbagAllies)).toBe(true);
        expect(forts.some(f => f.hex.q === 1 && f.hex.r === 1 && f.fort === sandbagAxis)).toBe(true);
    });
});
