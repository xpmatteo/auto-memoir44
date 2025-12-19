// ABOUTME: Phase for ordering units for Dig In card
// ABOUTME: Similar to OrderUnitsByPredicatePhase but uses ConfirmDigInMove and checks fortifications

import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {Move, OrderUnitMove, UnOrderMove} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {ConfirmDigInMove} from "../moves/ConfirmDigInMove";

// Declare which methods from GameState we actually need
interface UnitsOrderer {
    getFriendlyUnits(): Array<Unit>;
    isUnitOrdered(unit: Unit): boolean;
}

export class DigInOrderPhase extends Phase {
    readonly name: string = "Dig In Order";
    readonly type = PhaseType.ORDER;
    private readonly maxUnits: number;
    private readonly eligibilityPredicate: (unit: Unit, gameState: GameState) => boolean;

    constructor(maxUnits: number, eligibilityPredicate: (unit: Unit, gameState: GameState) => boolean) {
        super();
        this.maxUnits = maxUnits;
        this.eligibilityPredicate = eligibilityPredicate;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(gameState: GameState & UnitsOrderer): Array<Move> {
        const allFriendlyUnits = gameState.getFriendlyUnits();

        // Filter by eligibility predicate (checks both unit type AND fortification status)
        const eligibleUnits = allFriendlyUnits.filter(u => this.eligibilityPredicate(u, gameState));

        const orderedUnits = eligibleUnits.filter(unit => gameState.isUnitOrdered(unit));
        const unorderedUnits = eligibleUnits.filter(unit => !gameState.isUnitOrdered(unit));

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

        // Return ConfirmDigInMove instead of ConfirmOrdersMove
        return [new ConfirmDigInMove(), ...moves];
    }
}
