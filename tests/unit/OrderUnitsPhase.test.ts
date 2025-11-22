// ABOUTME: Unit tests for Phase class

import {describe, expect, test} from "vitest";
import {Section} from "../../src/domain/Section";
import {ConfirmOrdersMove, ToggleUnitOrderedMove} from "../../src/domain/Move";
import {Infantry, Unit} from "../../src/domain/Unit";
import {Side} from "../../src/domain/Player";

import {OrderUnitsPhase} from "../../src/domain/phases/OrderUnitsPhase";


const unit1 = new Infantry(Side.ALLIES);
const unit2 = new Infantry(Side.ALLIES);
const unit3 = new Infantry(Side.AXIS);

const fakeUnitsorder = {
    units: [unit1, unit2, unit3],
    orderedUnits: [] as Unit[],
    getFriendlyUnitsInSection(section: Section): Array<Unit> {
        if (section !== Section.LEFT) {
            throw Error(`unexpected argument ${section}`);
        }
        return this.units;
    },
    isUnitOrdered(unit: Unit): boolean {
        return this.orderedUnits.includes(unit);
    }
};

describe("OrderUnitsPhase", () => {
    test("With no ordered units", () => {
        fakeUnitsorder.orderedUnits = [];
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
            new ToggleUnitOrderedMove(unit3),
        ]);
    });

    test("With less ordered units than card allows", () => {
        fakeUnitsorder.orderedUnits = [unit1];
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
            new ToggleUnitOrderedMove(unit3),
        ]);
    });

    test("With as many ordered units as card allows", () => {
        fakeUnitsorder.orderedUnits = [unit1, unit2];
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // Only the ordered units can be toggled
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new ToggleUnitOrderedMove(unit1),
            new ToggleUnitOrderedMove(unit2),
        ]);
    });

    test("With no units in the section", () => {
        fakeUnitsorder.units = [];
        const phase = new OrderUnitsPhase(Section.LEFT, 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // All you can do is continue to the next phase. Eventually you may also have the option to undo the card played
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
        ]);
    });

});

