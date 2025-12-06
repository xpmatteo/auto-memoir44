import {Section} from "../Section";
import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../moves/Move";
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
        // Use a greedy algorithm to assign units to sections optimally
        let sectionCounts = this.assignUnitsToSections(orderedUnits, unitsOrderer);

        let moves: Array<Move> = [];

        // For every ordered unit, allow unordering
        for (const unit of orderedUnits) {
            moves.push(new UnOrderMove(unit));
        }

        // Check if we can order each unordered unit
        for (const unit of unorderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(unit);

            // Can order if ANY of the unit's sections that are in the card's sections have quota available
            let hasAvailableSection = false;
            for (const unitSection of unitSections) {
                if (sectionCounts.has(unitSection)) {
                    if (sectionCounts.get(unitSection)! < this.howManyUnits) {
                        hasAvailableSection = true;
                        break;
                    }
                }
            }

            if (hasAvailableSection) {
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

    /**
     * Count the minimum number of units that must be assigned to each section.
     * Uses an iterative constraint propagation algorithm:
     * - Units in only one section must be assigned to that section
     * - Units whose other sections are full must be assigned to their remaining section
     * - Repeat until no more forced assignments
     */
    private assignUnitsToSections(orderedUnits: Unit[], unitsOrderer: UnitsOrderer): Map<Section, number> {
        let sectionCounts = new Map<Section, number>();
        for (const section of this.sections) {
            sectionCounts.set(section, 0);
        }

        // Get unit sections for all ordered units
        let unitSectionMap = new Map<Unit, Section[]>();
        for (const unit of orderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(unit);
            const relevantSections = unitSections.filter(s => sectionCounts.has(s));
            unitSectionMap.set(unit, relevantSections);
        }

        let assigned = new Set<Unit>();
        let changed = true;

        // Iteratively assign units that have no choice
        while (changed) {
            changed = false;

            for (const unit of orderedUnits) {
                if (assigned.has(unit)) continue;

                const unitSections = unitSectionMap.get(unit)!;
                if (unitSections.length === 0) {
                    assigned.add(unit);
                    continue;
                }

                // Find sections that still have room
                let availableSections = unitSections.filter(s =>
                    sectionCounts.get(s)! < this.howManyUnits
                );

                // If only one section available, must assign to it
                if (availableSections.length === 1) {
                    const section = availableSections[0];
                    sectionCounts.set(section, sectionCounts.get(section)! + 1);
                    assigned.add(unit);
                    changed = true;
                } else if (availableSections.length === 0) {
                    // No room anywhere - this shouldn't happen in valid game state
                    // Just assign to first section
                    const section = unitSections[0];
                    sectionCounts.set(section, sectionCounts.get(section)! + 1);
                    assigned.add(unit);
                    changed = true;
                }
            }
        }

        return sectionCounts;
    }
}
