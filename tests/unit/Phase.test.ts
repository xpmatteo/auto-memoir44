// ABOUTME: Unit tests for Phase class

import {describe, expect, test} from "vitest";
import {Section} from "../../src/domain/Section";
import {ToggleUnitOrderedMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";
import {OrderUnitsPhase} from "../../src/domain/Phase";

describe("Phases", () => {
    describe("OrderUnitPhase", () => {
        const unit1 = new Infantry(Side.ALLIES);
        const unit2 = new Infantry(Side.ALLIES);
        const unit3 = new Infantry(Side.AXIS);

        test("All units are not ordered", () => {
            const unitOrderer = {
                getUnitsInSection(section: Section): Array<Unit> {
                    if (section !== Section.LEFT) {
                        throw Error(`unexpected argument ${section}`);
                    }
                    return [unit1, unit2, unit3];
                },
            };
            const phase = new OrderUnitsPhase(Section.LEFT);

            let actual = phase.doLegalMoves(unitOrderer);

            expect(actual).toEqual([
                new ToggleUnitOrderedMove(unit1),
                new ToggleUnitOrderedMove(unit2),
                new ToggleUnitOrderedMove(unit3),
            ]);
        });
    });
});
