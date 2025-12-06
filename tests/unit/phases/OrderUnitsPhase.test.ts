// ABOUTME: Unit tests for Phase class

import {describe, expect, test} from "vitest";
import {Section} from "../../../src/domain/Section";
import {ConfirmOrdersMove, OrderUnitMove, UnOrderMove} from "../../../src/domain/moves/Move";
import {Infantry, Unit} from "../../../src/domain/Unit";
import {Side} from "../../../src/domain/Player";
import {OrderUnitsPhase} from "../../../src/domain/phases/OrderUnitsPhase";


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
    },
    getUnitSections(_unit: Unit): Section[] {
        // For these tests, all units are in LEFT section only
        return [Section.LEFT];
    }
};

describe("OrderUnitsPhase", () => {
    test("With no ordered units", () => {
        fakeUnitsorder.orderedUnits = [];
        const phase = new OrderUnitsPhase([Section.LEFT], 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // Can order any unit (since 0 < 2)
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new OrderUnitMove(unit1),
            new OrderUnitMove(unit2),
            new OrderUnitMove(unit3),
        ]);
    });

    test("With less ordered units than card allows", () => {
        fakeUnitsorder.orderedUnits = [unit1];
        const phase = new OrderUnitsPhase([Section.LEFT], 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // Can unorder the ordered unit, and can order the unordered units (since 1 < 2)
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new UnOrderMove(unit1),
            new OrderUnitMove(unit2),
            new OrderUnitMove(unit3),
        ]);
    });

    test("With as many ordered units as card allows", () => {
        fakeUnitsorder.orderedUnits = [unit1, unit2];
        const phase = new OrderUnitsPhase([Section.LEFT], 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // Can only unorder the ordered units (since 2 >= 2, we're at the limit)
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
            new UnOrderMove(unit1),
            new UnOrderMove(unit2),
        ]);
    });

    test("With no units in the section", () => {
        const originalUnits = fakeUnitsorder.units;
        fakeUnitsorder.units = [];
        const phase = new OrderUnitsPhase([Section.LEFT], 2);

        let actual = phase.doLegalMoves(fakeUnitsorder);

        // All you can do is continue to the next phase. Eventually you may also have the option to undo the card played
        expect(actual).toEqual([
            new ConfirmOrdersMove(),
        ]);

        // Restore original units for subsequent tests
        fakeUnitsorder.units = originalUnits;
    });

});

