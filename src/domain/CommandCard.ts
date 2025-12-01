// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

import {GameState} from "./GameState";
import {Section} from "./Section";

import {OrderUnitsPhase} from "./phases/OrderUnitsPhase";
import {MovePhase} from "./phases/MovePhase";
import {BattlePhase} from "./phases/BattlePhase";
import {ReplenishHandPhase} from "./phases/ReplenishHandPhase";
import {ReplenishHandDrawTwoChooseOnePhase} from "./phases/ReplenishHandDrawTwoChooseOnePhase";

export const CardLocation = {
    DECK: "Deck",
    DISCARD_PILE: "DiscardPile",
    BOTTOM_PLAYER_HAND: "BottomPlayerHand",
    TOP_PLAYER_HAND: "TopPlayerHand",
    PEEK: "Peek",
} as const;

export type CardLocation = typeof CardLocation[keyof typeof CardLocation];

let nextCardId = 1;

/**
 * Base class for all command cards
 */
export abstract class CommandCard {
    readonly id: string;
    abstract readonly name: string;
    abstract readonly imagePath: string;
    abstract readonly sections: Section[];
    abstract readonly howManyUnits: number;

    constructor() {
        let idString = nextCardId < 10 ? `0${nextCardId}` : nextCardId;
        this.id = `card-${idString}`;
        nextCardId++;
    }

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new ReplenishHandPhase());
        gameState.pushPhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());
        gameState.pushPhase(new OrderUnitsPhase(this.sections, this.howManyUnits));
    }
}

// Assault cards
export class AssaultCenter extends CommandCard {
    readonly name = "Assault Center";
    readonly imagePath = "images/cards/a2_assault_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

export class AssaultLeft extends CommandCard {
    readonly name = "Assault Left";
    readonly imagePath = "images/cards/a2_assault_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

export class AssaultRight extends CommandCard {
    readonly name = "Assault Right";
    readonly imagePath = "images/cards/a2_assault_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 1000;

    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(this.sections[0]);
    }
}

// Attack cards
export class AttackCenter extends CommandCard {
    readonly name = "Attack Center";
    readonly imagePath = "images/cards/a4_attack_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 3;
}

export class AttackLeft extends CommandCard {
    readonly name = "Attack Left";
    readonly imagePath = "images/cards/a3_attack_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 3;
}

export class AttackRight extends CommandCard {
    readonly name = "Attack Right";
    readonly imagePath = "images/cards/a3_attack_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 3;
}

// Probe cards
export class ProbeCenter extends CommandCard {
    readonly name = "Probe Center";
    readonly imagePath = "images/cards/a5_probe_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 2;
}

export class ProbeLeft extends CommandCard {
    readonly name = "Probe Left";
    readonly imagePath = "images/cards/a4_probe_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 2;
}

export class ProbeRight extends CommandCard {
    readonly name = "Probe Right";
    readonly imagePath = "images/cards/a4_probe_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 2;
}

// Recon cards
function onReconCardPlayed(card: CommandCard, gameState: GameState): void {
    gameState.setCurrentCard(card.id);
    gameState.replacePhase(new ReplenishHandDrawTwoChooseOnePhase());
    gameState.pushPhase(new BattlePhase());
    gameState.pushPhase(new MovePhase());
    gameState.pushPhase(new OrderUnitsPhase(card.sections, card.howManyUnits));
}

export class ReconCenter extends CommandCard {
    readonly name = "Recon Center";
    readonly imagePath = "images/cards/a4_recon_center.png";
    readonly sections = [Section.CENTER];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

export class ReconLeft extends CommandCard {
    readonly name = "Recon Left";
    readonly imagePath = "images/cards/a2_recon_left.png";
    readonly sections = [Section.LEFT];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

export class ReconRight extends CommandCard {
    readonly name = "Recon Right";
    readonly imagePath = "images/cards/a2_recon_right.png";
    readonly sections = [Section.RIGHT];
    readonly howManyUnits = 1;
    onCardPlayed(gameState: GameState): void {
        onReconCardPlayed(this, gameState);
    }
}

// Multi-section cards
export class PincerMove extends CommandCard {
    readonly name = "Pincer Move";
    readonly imagePath = "images/cards/a1_pincer.png";
    readonly sections = [Section.LEFT, Section.RIGHT];
    readonly howManyUnits = 2;
}

export class ReconInForce extends CommandCard {
    readonly name = "Recon In Force";
    readonly imagePath = "images/cards/a3_recon_in_force.png";
    readonly sections = [Section.LEFT, Section.CENTER, Section.RIGHT];
    readonly howManyUnits = 1;
}
