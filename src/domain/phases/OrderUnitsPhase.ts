import {Section} from "../Section";
import {Unit} from "../Unit";
import {GameState} from "../GameState";
import {ConfirmOrdersMove, Move, ToggleUnitOrderedMove} from "../Move";
import {Phase} from "./Phase";

// Declare which methods from GameState we actually need to do our job
interface UnitsOrderer {
    getFriendlyUnitsInSection(section: Section): Array<Unit>;

    isUnitOrdered(unit: Unit): boolean;
}

export class OrderUnitsPhase implements Phase {
    name: string = "Order Units";
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

        let moveOrders;
        if (orderedUnits.length < this.howManyUnits) {
            moveOrders = friendlyUnitsInSection
                .map(unit => new ToggleUnitOrderedMove(unit));
        } else {
            moveOrders = orderedUnits
                .map(unit => new ToggleUnitOrderedMove(unit));
        }
        return [new ConfirmOrdersMove(), ...moveOrders];
    }
}
