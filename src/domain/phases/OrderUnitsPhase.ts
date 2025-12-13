import {Section} from "../Section";
import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {SituatedUnit} from "../SituatedUnit";

// Declare which methods from GameState we actually need to do our job
interface UnitsOrderer {
    getFriendlyUnitsInSection(section: Section): Array<SituatedUnit>;

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

        let orderedUnits = allFriendlyUnits.filter(su => su.unitState.isOrdered);
        let unorderedUnits = allFriendlyUnits.filter(su => !su.unitState.isOrdered);

        // Track how many units have been ordered from each section
        // Use a greedy algorithm to assign units to sections optimally
        let sectionCounts = this.assignUnitsToSections(orderedUnits, unitsOrderer);

        let moves: Array<Move> = [];

        // For every ordered unit, allow unordering
        for (const su of orderedUnits) {
            moves.push(new UnOrderMove(su.unit));
        }

        // Check if we can order each unordered unit
        for (const su of unorderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(su.unit);

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
                moves.push(new OrderUnitMove(su.unit));
            }
        }

        return [new ConfirmOrdersMove(), ...moves];
    }

    private allFriendlyUnits(unitsOrderer: UnitsOrderer): SituatedUnit[] {
        let allFriendlyUnitsMap = new Map<string, SituatedUnit>();
        for (const section of this.sections) {
            const situatedUnits = unitsOrderer.getFriendlyUnitsInSection(section);
            for (const su of situatedUnits) {
                // Use unit ID as key to deduplicate units that appear in multiple sections
                allFriendlyUnitsMap.set(su.unit.id, su);
            }
        }
        return [...allFriendlyUnitsMap.values()];
    }

    /**
     * Count the minimum number of units that must be assigned to each section.
     * Uses an iterative constraint propagation algorithm:
     * - Units in only one section must be assigned to that section
     * - Units whose other sections are full must be assigned to their remaining section
     * - Repeat until no more forced assignments
     */
    private assignUnitsToSections(orderedUnits: SituatedUnit[], unitsOrderer: UnitsOrderer): Map<Section, number> {
        let sectionCounts = new Map<Section, number>();
        for (const section of this.sections) {
            sectionCounts.set(section, 0);
        }

        // Get unit sections for all ordered units
        let unitSectionMap = new Map<Unit, Section[]>();
        for (const su of orderedUnits) {
            const unitSections = unitsOrderer.getUnitSections(su.unit);
            const relevantSections = unitSections.filter(s => sectionCounts.has(s));
            unitSectionMap.set(su.unit, relevantSections);
        }

        let assigned = new Set<Unit>();
        let changed = true;

        // Iteratively assign units that have no choice
        while (changed) {
            changed = false;

            for (const su of orderedUnits) {
                if (assigned.has(su.unit)) continue;

                const unitSections = unitSectionMap.get(su.unit)!;
                if (unitSections.length === 0) {
                    assigned.add(su.unit);
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
                    assigned.add(su.unit);
                    changed = true;
                } else if (availableSections.length === 0) {
                    // No room anywhere - this shouldn't happen in valid game state
                    // Just assign to first section
                    const section = unitSections[0];
                    sectionCounts.set(section, sectionCounts.get(section)! + 1);
                    assigned.add(su.unit);
                    changed = true;
                }
            }
        }

        return sectionCounts;
    }
}
