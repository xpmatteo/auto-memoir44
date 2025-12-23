// ABOUTME: Unit tests for OrderSlotCombinationGenerator
// ABOUTME: Tests all combinations of ordering constraints using tabular test style

import {describe, expect, test} from "vitest";
import {situatedUnit, SituatedUnit} from '../../../../src/domain/SituatedUnit';
import {Infantry} from '../../../../src/domain/Unit';
import {CommandCard} from "../../../../src/domain/cards/CommandCard";
import {HexCoord, hexOf} from "../../../../src/utils/hex";
import {AssaultLeft, AttackLeft, GeneralAdvance, PincerMove, ProbeLeft, ReconInForce, ReconLeft} from "../../../../src/domain/cards/SectionCards";
import {Position} from "../../../../src/domain/Player";

interface TestCase {
    name: string
    card: CommandCard
    units: SituatedUnit[]
    expectedCombinations: Array<Array<SituatedUnit>>
}


const leftHex1 = hexOf(0, 0);
const leftHex2 = hexOf(1, 0);
const leftHex3 = hexOf(2, 0);
const centerLeftHex = hexOf(3, 1);
const centerLeftHex2 = hexOf(2, 3);
const centerHex1 = hexOf(5, 0);
const centerHex2 = hexOf(6, 0);
const centerRightHex = hexOf(8, 1);
const rightHex1 = hexOf(9, 0);
const rightHex2 = hexOf(10, 0);
const infantryLeft1 = createUnit(Infantry, leftHex1);
const infantryLeft2 = createUnit(Infantry, leftHex2);
const infantryLeft3 = createUnit(Infantry, leftHex3);
const infantryCenterLeft1 = createUnit(Infantry, centerLeftHex);
const infantryCenterLeft2 = createUnit(Infantry, centerLeftHex2);
const infantryCenter1 = createUnit(Infantry, centerHex1);
const infantryCenter2 = createUnit(Infantry, centerHex2);
const infantryCenterRight = createUnit(Infantry, centerRightHex);
const infantryRight1 = createUnit(Infantry, rightHex1);
const infantryRight2 = createUnit(Infantry, rightHex2);

function createUnit(unitClass: any, hex: HexCoord) {
    return situatedUnit()
        .at(hex.q, hex.r)
        .withUnit(new unitClass())
        .build();
}

const cases: TestCase[] = [
    {
        name: "ReconLeft orders 1 unit left",
        card: new ReconLeft(),
        units: [
            infantryLeft1,
            infantryCenterLeft1,
        ],
        expectedCombinations: [[infantryLeft1],[infantryCenterLeft1],]
    },

    {
        name: "ProbeLeft orders 2 units left",
        card: new ProbeLeft(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryCenterLeft1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2],
            [infantryLeft1, infantryCenterLeft1],
            [infantryLeft2, infantryCenterLeft1],
        ]
    },

    {
        name: "ProbeLeft orders 2 units left, with 2 units straddling",
        card: new ProbeLeft(),
        units: [
            infantryLeft1,
            infantryCenterLeft1,
            infantryCenterLeft2,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryCenterLeft1],
            [infantryLeft1, infantryCenterLeft2],
            [infantryCenterLeft1, infantryCenterLeft2],
        ]
    },
    {
        name: "Assault left orders all units left",
        card: new AssaultLeft(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryLeft3,
            infantryCenterLeft1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2, infantryLeft3, infantryCenterLeft1],
        ]
    },
    {
        name: "ReconInForce orders 1 unit per section (but there are no units in right section)",
        card: new ReconInForce(),
        units: [
            infantryLeft1,
            infantryCenterLeft1,
            infantryCenter1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryCenterLeft1],
            [infantryLeft1, infantryCenter1],
            [infantryCenterLeft1, infantryCenter1],
        ]
    },

    {
        name: "ReconInForce orders 1 unit per section (one unit straddling left, one in the right)",
        card: new ReconInForce(),
        units: [
            infantryLeft1,
            infantryCenterLeft1,
            infantryCenter1,
            infantryRight1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryCenterLeft1, infantryRight1],
            [infantryLeft1, infantryCenter1, infantryRight1],
            [infantryCenterLeft1, infantryCenter1, infantryRight1],
        ]
    },

    {
        name: "ReconInForce orders 1 unit per section (two units straddling)",
        card: new ReconInForce(),
        units: [
            infantryLeft1,
            infantryCenterLeft1,
            infantryCenter1,
            infantryCenterRight,
            infantryRight1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryCenterLeft1, infantryCenterRight],
            [infantryLeft1, infantryCenterLeft1, infantryRight1],
            [infantryLeft1, infantryCenter1, infantryCenterRight],
            [infantryLeft1, infantryCenter1, infantryRight1],
            [infantryLeft1, infantryCenterRight, infantryRight1],
            [infantryCenterLeft1, infantryCenter1, infantryCenterRight],
            [infantryCenterLeft1, infantryCenter1, infantryRight1],
            [infantryCenterLeft1, infantryCenterRight, infantryRight1],
        ]
    },

    {
        name: "AttackLeft with exactly 3 units returns single combination",
        card: new AttackLeft(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryLeft3,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2, infantryLeft3],
        ]
    },
    {
        name: "AttackLeft with 4 units returns all 3-unit combinations",
        card: new AttackLeft(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryLeft3,
            infantryCenterLeft1,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2, infantryLeft3],
            [infantryLeft1, infantryLeft2, infantryCenterLeft1],
            [infantryLeft1, infantryLeft3, infantryCenterLeft1],
            [infantryLeft2, infantryLeft3, infantryCenterLeft1],
        ]
    },
    {
        name: "PincerMove orders 2 units from left AND right",
        card: new PincerMove(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryRight1,
            infantryRight2,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2, infantryRight1, infantryRight2],
        ]
    },
    {
        name: "GeneralAdvance orders 2 units from each section",
        card: new GeneralAdvance(),
        units: [
            infantryLeft1,
            infantryLeft2,
            infantryCenter1,
            infantryCenter2,
            infantryRight1,
            infantryRight2,
        ],
        expectedCombinations: [
            [infantryLeft1, infantryLeft2, infantryCenter1, infantryCenter2, infantryRight1, infantryRight2],
        ]
    },
    {
        name: "ReconLeft with no units in left section returns empty set",
        card: new ReconLeft(),
        units: [
            infantryCenter1,
            infantryRight1,
        ],
        expectedCombinations: []
    },
    {
        name: "ProbeLeft with only 1 unit (allows 2) returns 1 unit",
        card: new ProbeLeft(),
        units: [
            infantryLeft1,
        ],
        expectedCombinations: [[infantryLeft1],]
    },
];

describe('OrderableSets', () => {
    test.each(cases)('$name', ({ card, units, expectedCombinations }) => {
        const actual = card.getOrderableSets(units, Position.BOTTOM);
        const actualArrays = setOfSetsToSortedArrays(actual);
        const expectedArrays = expectedCombinations.sort((a, b) => {
            if (a.length !== b.length) return a.length - b.length;
            return JSON.stringify(a) > JSON.stringify(b) ? 1 : -1;
        });
        expect(actualArrays).toEqual(expectedArrays);
    })
})

// Helper function to convert Set<Set<T>> to sorted Array<Array<T>> for comparison
function setOfSetsToSortedArrays<T>(setOfSets: Set<Set<T>>): Array<Array<T>> {
    return Array.from(setOfSets)
        .map(innerSet => Array.from(innerSet))
        .sort((a, b) => {
            // Sort by length first, then by string representation for consistency
            if (a.length !== b.length) return a.length - b.length;
            return JSON.stringify(a) > JSON.stringify(b) ? 1 : -1;
        });
}
