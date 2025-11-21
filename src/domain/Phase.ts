import {GameState} from "./GameState";
import {Move, ToggleUnitOrderedMove, PlayCardMove} from "./Move";
import {Position} from "./Player";
import {CardLocation} from "./CommandCard";
import {Section} from "./Section";
import {Unit} from "./Unit";

export interface Phase {
    legalMoves(gameState: GameState): Array<Move>;
}

export class PlayCardPhase implements Phase {
    legalMoves(gameState: GameState): Array<Move> {
        let location = (gameState.activePlayer.position === Position.BOTTOM) ?
            CardLocation.BOTTOM_PLAYER_HAND : CardLocation.TOP_PLAYER_HAND;
        return gameState.getCardsInLocation(location).map(card => new PlayCardMove(card));
    }
}

interface UnitsOrderer {
    getUnitsInSection(section: Section): Array<Unit>;
}

export class OrderUnitsPhase implements Phase {
    private readonly section;

    constructor(section: Section) {
        this.section = section;
    }

    legalMoves(gameState: GameState): Array<Move> {
        return this.doLegalMoves(gameState);
    }

    doLegalMoves(unitsOrderer: UnitsOrderer) {
        return unitsOrderer.getUnitsInSection(this.section)
            .map(unit => new ToggleUnitOrderedMove(unit));
    }
}
