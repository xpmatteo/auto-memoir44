// ABOUTME: Phase for ordering units in specific board sections
// ABOUTME: Players select units to activate based on the played command card's section restrictions

import {Section, isHexInSection} from "../Section";
import {GameState} from "../GameState";
import {Move} from "../moves/Move";
import {Phase, PhaseType} from "./Phase";
import {GeneralOrderUnitsPhase} from "./GeneralOrderUnitsPhase";
import {SituatedUnit} from "../SituatedUnit";

export class OrderUnitsPhase extends Phase {
    readonly name: string = "Order Units";
    readonly type = PhaseType.ORDER;
    private readonly sections: Section[];
    private readonly howManyUnits: number;

    constructor(sections: Section[], howManyUnits: number) {
        super();
        this.sections = sections;
        this.howManyUnits = howManyUnits;
    }

    legalMoves(gameState: GameState): Array<Move> {
        // Build slots lazily to capture the active player's position
        const playerPosition = gameState.activePlayer.position;

        // One slot per section - use isHexInSection to check membership
        const slots = this.sections.map(section => ({
            predicate: (su: SituatedUnit) =>
                isHexInSection(su.coord, section, playerPosition),
            maxCount: this.howManyUnits
        }));

        const delegate = new GeneralOrderUnitsPhase(slots);
        return delegate.legalMoves(gameState);
    }
}
