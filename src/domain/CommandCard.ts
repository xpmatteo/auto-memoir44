// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

import {GameState} from "./GameState";
import {Section} from "./Section";

import {OrderUnitsPhase} from "./phases/OrderUnitsPhase";
import {MovePhase} from "./phases/MovePhase";
import {BattlePhase} from "./phases/BattlePhase";

export const CardLocation = {
    DECK: "Deck",
    DISCARD_PILE: "DiscardPile",
    BOTTOM_PLAYER_HAND: "BottomPlayerHand",
    TOP_PLAYER_HAND: "TopPlayerHand",
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
    abstract readonly section: Section;
    abstract readonly howManyUnits: number;

    constructor() {
        this.id = `card-${nextCardId++}`;
    }

    onCardPlayed(gameState: GameState): void {
        gameState.setCurrentCard(this.id);
        gameState.replacePhase(new BattlePhase());
        gameState.pushPhase(new MovePhase());
        gameState.pushPhase(new OrderUnitsPhase(this.section, this.howManyUnits));
    }
}

// Assault cards
export class AssaultCenter extends CommandCard {
    readonly name = "Assault Center";
    readonly imagePath = "images/cards/a2_assault_center.png";
    readonly section = Section.CENTER;
    readonly howManyUnits = 1000;
    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(Section.CENTER);
    }
}

export class AssaultLeft extends CommandCard {
    readonly name = "Assault Left";
    readonly imagePath = "images/cards/a2_assault_left.png";
    readonly section = Section.LEFT;
    readonly howManyUnits = 1000;
    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(Section.LEFT);
    }
}

export class AssaultRight extends CommandCard {
    readonly name = "Assault Right";
    readonly imagePath = "images/cards/a2_assault_right.png";
    readonly section = Section.RIGHT;
    readonly howManyUnits = 1000;
    onCardPlayed(gameState: GameState): void {
        super.onCardPlayed(gameState);
        gameState.orderAllFriendlyUnitsInSection(Section.RIGHT);
    }
}

// Attack cards
export class AttackCenter extends CommandCard {
    readonly name = "Attack Center";
    readonly imagePath = "images/cards/a4_attack_center.png";
    readonly section = Section.CENTER;
    readonly howManyUnits = 3;
}

export class AttackLeft extends CommandCard {
    readonly name = "Attack Left";
    readonly imagePath = "images/cards/a3_attack_left.png";
    readonly section = Section.LEFT;
    readonly howManyUnits = 3;
}

export class AttackRight extends CommandCard {
    readonly name = "Attack Right";
    readonly imagePath = "images/cards/a3_attack_right.png";
    readonly section = Section.RIGHT;
    readonly howManyUnits = 3;
}

// Probe cards
export class ProbeCenter extends CommandCard {
    readonly name = "Probe Center";
    readonly imagePath = "images/cards/a5_probe_center.png";
    readonly section = Section.CENTER;
    readonly howManyUnits = 2;
}

export class ProbeLeft extends CommandCard {
    readonly name = "Probe Left";
    readonly imagePath = "images/cards/a4_probe_left.png";
    readonly section = Section.LEFT;
    readonly howManyUnits = 2;
}

export class ProbeRight extends CommandCard {
    readonly name = "Probe Right";
    readonly imagePath = "images/cards/a4_probe_right.png";
    readonly section = Section.RIGHT;
    readonly howManyUnits = 2;
}

// Recon cards
export class ReconCenter extends CommandCard {
    readonly name = "Recon Center";
    readonly imagePath = "images/cards/a4_recon_center.png";
    readonly section = Section.CENTER;
    readonly howManyUnits = 1;
}

export class ReconLeft extends CommandCard {
    readonly name = "Recon Left";
    readonly imagePath = "images/cards/a2_recon_left.png";
    readonly section = Section.LEFT;
    readonly howManyUnits = 1;
}

export class ReconRight extends CommandCard {
    readonly name = "Recon Right";
    readonly imagePath = "images/cards/a2_recon_right.png";
    readonly section = Section.RIGHT;
    readonly howManyUnits = 1;
}
