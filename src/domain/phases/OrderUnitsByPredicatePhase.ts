// ABOUTME: Phase for ordering units based on a predicate function rather than section restrictions
// ABOUTME: Used by cards like "Direct from HQ" and "Move Out!" that have special ordering rules

import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {GeneralOrderUnitsPhase} from "./GeneralOrderUnitsPhase";

export class OrderUnitsByPredicatePhase extends Phase {
    readonly name: string = "Order Units";
    readonly type = PhaseType.ORDER;
    private readonly delegate: GeneralOrderUnitsPhase;

    constructor(maxUnits: number, eligibilityPredicate: (unit: Unit) => boolean) {
        super();
        // Wrap the Unit predicate to work with SituatedUnit
        this.delegate = new GeneralOrderUnitsPhase([{
            predicate: su => eligibilityPredicate(su.unit),
            maxCount: maxUnits
        }]);
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.delegate.legalMoves(gameState);
    }
}
