// ABOUTME: Phase for ordering units based on a list of predicate/count slots
// ABOUTME: Generalizes both section-based and predicate-based ordering using constraint propagation

import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {SituatedUnit} from "../SituatedUnit";

/**
 * A predicate that determines whether a unit is eligible for a particular ordering slot.
 */
export type UnitPredicate = (su: SituatedUnit) => boolean;

/**
 * An ordering slot: a predicate that defines eligibility and a maximum count of units.
 */
export interface OrderSlot {
    readonly predicate: UnitPredicate;
    readonly maxCount: number;
}

/**
 * Interface for testing - provides the units needed for ordering decisions.
 */
export interface UnitsProvider {
    getFriendlySituatedUnits(): SituatedUnit[];
}

export class GeneralOrderUnitsPhase extends Phase {
    readonly name: string = "Order Units";
    readonly type = PhaseType.ORDER;
    private readonly slots: OrderSlot[];

    constructor(slots: OrderSlot[]) {
        super();
        this.slots = slots;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitsProvider: UnitsProvider): Array<Move> {
        const allFriendly = unitsProvider.getFriendlySituatedUnits();

        // Filter to units matching ANY slot predicate
        const eligible = allFriendly.filter(su =>
            this.slots.some(slot => slot.predicate(su))
        );

        const ordered = eligible.filter(su => su.unitState.isOrdered);
        const unordered = eligible.filter(su => !su.unitState.isOrdered);

        const slotCounts = this.assignUnitsToSlots(ordered);
        const moves: Move[] = [];

        // Unorder moves for all ordered units
        for (const su of ordered) {
            moves.push(new UnOrderMove(su.unit));
        }

        // Order moves for units that can still fit in some slot
        for (const su of unordered) {
            if (this.canOrderUnit(su, slotCounts)) {
                moves.push(new OrderUnitMove(su.unit));
            }
        }

        return [new ConfirmOrdersMove(), ...moves];
    }

    /**
     * Check if a unit can be ordered given the current slot counts.
     * A unit can be ordered if any slot it matches has room.
     */
    private canOrderUnit(su: SituatedUnit, slotCounts: number[]): boolean {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].predicate(su) && slotCounts[i] < this.slots[i].maxCount) {
                return true;
            }
        }
        return false;
    }

    /**
     * Assign ordered units to slots using constraint propagation.
     *
     * When a unit can satisfy multiple slots (e.g., an infantry unit can fill
     * both "infantry" and "any" slots), we use an iterative algorithm:
     * 1. Units that can only go in one available slot are assigned there
     * 2. This may fill up slots, forcing other units into their remaining options
     * 3. Repeat until no more forced assignments
     *
     * Returns an array of counts, one per slot.
     */
    private assignUnitsToSlots(orderedUnits: SituatedUnit[]): number[] {
        const slotCounts = this.slots.map(() => 0);

        // For each unit, find which slot indices it can fill
        const unitSlotIndices = new Map<Unit, number[]>();
        for (const su of orderedUnits) {
            const indices = this.slots
                .map((slot, i) => slot.predicate(su) ? i : -1)
                .filter(i => i >= 0);
            unitSlotIndices.set(su.unit, indices);
        }

        const assigned = new Set<Unit>();
        let changed = true;

        // Constraint propagation
        while (changed) {
            changed = false;

            for (const su of orderedUnits) {
                if (assigned.has(su.unit)) continue;

                const indices = unitSlotIndices.get(su.unit)!;
                if (indices.length === 0) {
                    // Unit doesn't match any slot - mark as assigned (won't count)
                    assigned.add(su.unit);
                    continue;
                }

                // Find slots that still have room
                const availableSlots = indices.filter(i =>
                    slotCounts[i] < this.slots[i].maxCount
                );

                if (availableSlots.length === 1) {
                    // Only one option - must assign here
                    slotCounts[availableSlots[0]]++;
                    assigned.add(su.unit);
                    changed = true;
                } else if (availableSlots.length === 0) {
                    // No room anywhere - force assign to first compatible slot
                    // (This shouldn't happen in normal gameplay but handles edge cases)
                    slotCounts[indices[0]]++;
                    assigned.add(su.unit);
                    changed = true;
                }
            }
        }

        return slotCounts;
    }
}
