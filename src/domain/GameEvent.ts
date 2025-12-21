// ABOUTME: GameEvent types for tracking what happens during move execution
// ABOUTME: User-facing event descriptions for logging and UI display

import {Unit} from "./Unit";
import {HexCoord} from "../utils/hex";
import {DiceResult} from "./Dice";
import {Side} from "./Player";

/**
 * Base class for all game events
 * Events describe what happened in user-facing language
 */
export class GameEvent {
    constructor(readonly description: string) {}
}

/**
 * Player played a command card
 */
export class CardPlayedEvent extends GameEvent {
    constructor(cardName: string, playerSide: Side) {
        super(`${playerSide} player played "${cardName}"`);
    }
}

/**
 * Unit moved from one hex to another
 */
export class UnitMovedEvent extends GameEvent {
    constructor(unit: Unit, from: HexCoord, to: HexCoord) {
        if (from.q === to.q && from.r === to.r) {
            super(`${unit.type} at ${from} stayed in place`);
        } else {
            super(`${unit.type} moved from ${from} to ${to}`);
        }
    }
}

/**
 * Battle occurred with combined outcome (dice + damage/elimination/retreat)
 */
export class BattleEvent extends GameEvent {
    constructor(
        attacker: Unit,
        attackerPos: HexCoord,
        defender: Unit,
        defenderPos: HexCoord,
        diceResults: DiceResult[],
        outcome: BattleOutcome
    ) {
        const diceNames = diceResults.map(r => r.name).join(", ");
        const battleDesc = `${attacker.type} at ${attackerPos} battles ${defender.type} at ${defenderPos}, rolls ${diceNames}`;

        let outcomeDesc: string;
        if (outcome.type === 'damage') {
            const points = outcome.damage === 1 ? "point" : "points";
            outcomeDesc = `${defender.type} takes ${outcome.damage} ${points} of damage`;
        } else if (outcome.type === 'eliminated') {
            outcomeDesc = `${defender.type} is eliminated`;
        } else if (outcome.type === 'retreat') {
            const hexes = outcome.flagCount === 1 ? "hex" : "hexes";
            outcomeDesc = `${defender.type} must retreat ${outcome.flagCount} ${hexes}`;
        } else {
            outcomeDesc = "No effect";
        }

        super(`${battleDesc}. ${outcomeDesc}.`);
    }
}

export type BattleOutcome =
    | { type: 'damage', damage: number }
    | { type: 'eliminated' }
    | { type: 'retreat', flagCount: number }
    | { type: 'no_effect' };

/**
 * Unit retreated
 */
export class UnitRetreatedEvent extends GameEvent {
    constructor(unit: Unit, from: HexCoord, to: HexCoord) {
        if (from.q === to.q && from.r === to.r) {
            super(`${unit.type} at ${from} cannot retreat (no valid paths)`);
        } else {
            super(`${unit.type} retreated from ${from} to ${to}`);
        }
    }
}

/**
 * Attacking unit took ground after close combat
 */
export class TookGroundEvent extends GameEvent {
    constructor(unit: Unit, from: HexCoord, to: HexCoord) {
        super(`${unit.type} advanced from ${from} to ${to}`);
    }
}

/**
 * Player earned a medal
 */
export class MedalEarnedEvent extends GameEvent {
    constructor(earningSide: Side, eliminatedUnit: Unit) {
        super(`${earningSide} earned a medal (eliminated ${eliminatedUnit.type})`);
    }
}

/**
 * Fortification was applied to a hex
 */
export class FortificationAppliedEvent extends GameEvent {
    constructor(fortificationType: string, position: HexCoord) {
        super(`${fortificationType} placed at ${position}`);
    }
}

/**
 * Player won the game
 */
export class GameWonEvent extends GameEvent {
    constructor(winningSide: Side, medals: number) {
        super(`${winningSide} won the game with ${medals} medals!`);
    }
}

/**
 * Phase ended (for debugging)
 */
export class PhaseEndedEvent extends GameEvent {
    constructor(phaseName: string) {
        super(`${phaseName} phase ended`);
    }
}
