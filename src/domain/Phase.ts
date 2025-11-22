import {GameState} from "./GameState";
import {Move, ToggleUnitOrderedMove, PlayCardMove} from "./Move";
import {Position} from "./Player";
import {CardLocation} from "./CommandCard";
import {Section} from "./Section";
import {Unit} from "./Unit";

export interface Phase {
    readonly name: string;

    legalMoves(gameState: GameState): Array<Move>;
}

export class PlayCardPhase implements Phase {
    name: string = "Play Card";

    legalMoves(gameState: GameState): Array<Move> {
        let location = (gameState.activePlayer.position === Position.BOTTOM) ?
            CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return gameState.getCardsInLocation(location).map(card => new PlayCardMove(card));
    }
}

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

        if (orderedUnits.length < this.howManyUnits) {
            return friendlyUnitsInSection
                .map(unit => new ToggleUnitOrderedMove(unit));
        } else {
            return orderedUnits
                .map(unit => new ToggleUnitOrderedMove(unit));
        }
    }
}
