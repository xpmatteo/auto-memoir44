// ABOUTME: Unit tests for Phase class

import {describe, expect, test} from "vitest";
import {Section} from "../../src/domain/Section";
import {ToggleUnitOrderedMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";

import {OrderUnitsPhase} from "../../src/domain/phases/OrderUnitsPhase";

describe("OrderUnitsPhase", () => {
    const unit1 = new Infantry(Side.ALLIES);
    const unit2 = new Infantry(Side.ALLIES);
    const unit3 = new Infantry(Side.AXIS);

    test("With no ordered units", () => {
        const unitOrderer = {
            getFriendlyUnitsInSection(section: Section): Array<Unit> {
                if (section !== Section.LEFT) {
                    throw Error(`unexpected argument ${section}`);
                }
                return [unit1, unit2, unit3];
            },
            isUnitOrdered(_unit: Unit): boolean {
                return false;
            }
        };
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(unitOrderer);

        expect(actual).toEqual([
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
            new ToggleUnitOrderedMove(unit3),
        ]);
    });

    test("With less ordered units than card allows", () => {
        const unitOrderer = {
            getFriendlyUnitsInSection(section: Section): Array<Unit> {
                if (section !== Section.LEFT) {
                    throw Error(`unexpected argument ${section}`);
                }
                return [unit1, unit2, unit3];
            },
            isUnitOrdered(unit: Unit): boolean {
                return unit === unit1;
            }
        };
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(unitOrderer);

        expect(actual).toEqual([
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
            new ToggleUnitOrderedMove(unit3),
        ]);
    });

    test("With as many ordered units as card allows", () => {
        const unitOrderer = {
            getFriendlyUnitsInSection(section: Section): Array<Unit> {
                if (section !== Section.LEFT) {
                    throw Error(`unexpected argument ${section}`);
                }
                return [unit1, unit2, unit3];
            },
            isUnitOrdered(unit: Unit): boolean {
                return unit === unit1 || unit === unit2;
            }
        };
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(unitOrderer);

        // Only the ordered units can be toggled
        expect(actual).toEqual([
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
        ]);
    });

});

