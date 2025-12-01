import {Section} from "../Section";
import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../Move";
import {Phase, PhaseType} from "./Phase";

// Declare which methods from GameState we actually need to do our job
interface UnitsOrderer {
    getFriendlyUnitsInSection(section: Section): Array<Unit>;

    isUnitOrdered(unit: Unit): boolean;

    getUnitSections(unit: Unit): Section[];
}

export class OrderUnitsPhase implements Phase {
    name: string = "Order Units";
    type = PhaseType.ORDER;
    private readonly sections: Section[];
    private readonly howManyUnits: number;

    constructor(sections: Section[], howManyUnits: number) {
        this.sections = sections;
        this.howManyUnits = howManyUnits;
    }

    legalMoves(gameState: GameState): Array<Move> {
        // Delegate to a function that is easily tested with a stub UnitsOrderer
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitsOrderer: UnitsOrderer) {
        // Gather all friendly units from ALL target sections
        let allFriendlyUnits = this.allFriendlyUnits(unitsOrderer);

        let orderedUnits = allFriendlyUnits.filter(unit => unitsOrderer.isUnitOrdered(unit));
        let unorderedUnits = allFriendlyUnits.filter(unit => !unitsOrderer.isUnitOrdered(unit));

        // Track how many units have been ordered from each section
        let sectionCounts = new Map<Section, number>();
        for (const section of this.sections) {
            sectionCounts.set(section, 0);
        }

        for (const unit of orderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(unit);
            for (const section of unitSections) {
                if (sectionCounts.has(section)) {
                    sectionCounts.set(section, sectionCounts.get(section)! + 1);
                }
            }
        }

        let moves: Array<Move> = [];

        // For every ordered unit, allow unordering
        for (const unit of orderedUnits) {
            moves.push(new UnOrderMove(unit));
        }

        // Check if we can order each unordered unit
        for (const unit of unorderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(unit);

            // Can only order if ALL of the unit's sections that are in the card's sections have quota available
            let canOrder = true;
            for (const unitSection of unitSections) {
                if (sectionCounts.has(unitSection)) {
                    if (sectionCounts.get(unitSection)! >= this.howManyUnits) {
                        canOrder = false;
                        break;
                    }
                }
            }

            if (canOrder) {
                moves.push(new OrderUnitMove(unit));
            }
        }

        return [new ConfirmOrdersMove(), ...moves];
    }

    private allFriendlyUnits(unitsOrderer: UnitsOrderer):Unit[] {
        let allFriendlyUnits = new Set<Unit>();
        for (const section of this.sections) {
            const units = unitsOrderer.getFriendlyUnitsInSection(section);
            for (const unit of units) {
                allFriendlyUnits.add(unit);
            }
        }
        return [...allFriendlyUnits];
    }
}
