// ABOUTME: Phase for ordering units based on a predicate function rather than section restrictions
// ABOUTME: Used by cards like "Direct from HQ" and "Move Out!" that have special ordering rules

import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";

// Declare which methods from GameState we actually need
interface UnitsOrderer {
    getFriendlyUnits(): Array<Unit>;
    isUnitOrdered(unit: Unit): boolean;
}

export class OrderUnitsByPredicatePhase implements Phase {
    readonly name: string = "Order Units";
    readonly type = PhaseType.ORDER;
    private readonly maxUnits: number;
    private readonly eligibilityPredicate: (unit: Unit) => boolean;

    constructor(maxUnits: number, eligibilityPredicate: (unit: Unit) => boolean) {
        this.maxUnits = maxUnits;
        this.eligibilityPredicate = eligibilityPredicate;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitsOrderer: UnitsOrderer): Array<Move> {
        const allFriendlyUnits = unitsOrderer.getFriendlyUnits();

        // Filter by eligibility predicate
        const eligibleUnits = allFriendlyUnits.filter(u => this.eligibilityPredicate(u));

        const orderedUnits = eligibleUnits.filter(unit => unitsOrderer.isUnitOrdered(unit));
        const unorderedUnits = eligibleUnits.filter(unit => !unitsOrderer.isUnitOrdered(unit));

        const moves: Array<Move> = [];

        // Can always unorder any currently ordered unit
        for (const unit of orderedUnits) {
            moves.push(new UnOrderMove(unit));
        }

        // Can order unordered units if we're under the limit
        if (orderedUnits.length < this.maxUnits) {
            for (const unit of unorderedUnits) {
                moves.push(new OrderUnitMove(unit));
            }
        }

        return [new ConfirmOrdersMove(), ...moves];
    }
}
