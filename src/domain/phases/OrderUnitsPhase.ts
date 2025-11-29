import {Section} from "../Section";
import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, OrderUnitMove, UnOrderMove} from "../Move";
import {Phase, PhaseType} from "./Phase";

// Declare which methods from GameState we actually need to do our job
interface UnitsOrderer {
    getFriendlyUnitsInSection(section: Section): Array<Unit>;

    isUnitOrdered(unit: Unit): boolean;
}

export class OrderUnitsPhase implements Phase {
    name: string = "Order Units";
    type = PhaseType.ORDER;
    private readonly section;
    private readonly howManyUnits: number;

    constructor(section: Section, howManyUnits: number) {
        this.howManyUnits = howManyUnits;
        this.section = section;
    }

    legalMoves(gameState: GameState): Array<Move> {
        // Delegate to a function that is easily tested with a stub UnitsOrderer
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitsOrderer: UnitsOrderer) {
        let friendlyUnitsInSection = unitsOrderer.getFriendlyUnitsInSection(this.section);
        let orderedUnits = friendlyUnitsInSection
            .filter(unit => unitsOrderer.isUnitOrdered(unit));
        let unorderedUnits = friendlyUnitsInSection
            .filter(unit => !unitsOrderer.isUnitOrdered(unit));

        let moves: Array<Move> = [];

        // For every ordered unit, allow unordering
        for (const unit of orderedUnits) {
            moves.push(new UnOrderMove(unit));
        }

        // If we haven't reached the limit, allow ordering unordered units
        if (orderedUnits.length < this.howManyUnits) {
            for (const unit of unorderedUnits) {
                moves.push(new OrderUnitMove(unit));
            }
        }

        return [new ConfirmOrdersMove(), ...moves];
    }
}
