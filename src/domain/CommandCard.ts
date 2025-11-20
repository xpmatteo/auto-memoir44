// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

export const CardLocation = {
  DECK: "Deck",
  DISCARD_PILE: "DiscardPile",
  BOTTOM_PLAYER_HAND: "BottomPlayerHand",
  TOP_PLAYER_HAND: "TopPlayerHand",
} as const;

export type CardLocation = typeof CardLocation[keyof typeof CardLocation];

export interface CommandCard {
  id: string;
  name: string;
  imagePath: string;
  location: CardLocation;
}

export function createCommandCard(
  id: string,
  name: string,
  imagePath: string,
  location: CardLocation = CardLocation.DECK
): CommandCard {
  return { id, name, imagePath, location };
}

/**
 * Base class for card types
 * Each card type defines its name and image path
 */
export abstract class CardType {
  abstract readonly name: string;
  abstract readonly imagePath: string;

  /**
   * Create a command card instance of this type
   */
  createCard(id: string, location: CardLocation = CardLocation.DECK): CommandCard {
    return createCommandCard(id, this.name, this.imagePath, location);
  }
}

// Assault cards
export class AssaultCenter extends CardType {
  readonly name = "Assault Center";
  readonly imagePath = "images/cards/a2_assault_center.png";
}

export class AssaultLeft extends CardType {
  readonly name = "Assault Left";
  readonly imagePath = "images/cards/a2_assault_left.png";
}

export class AssaultRight extends CardType {
  readonly name = "Assault Right";
  readonly imagePath = "images/cards/a2_assault_right.png";
}

// Attack cards
export class AttackCenter extends CardType {
  readonly name = "Attack Center";
  readonly imagePath = "images/cards/a4_attack_center.png";
}

export class AttackLeft extends CardType {
  readonly name = "Attack Left";
  readonly imagePath = "images/cards/a3_attack_left.png";
}

export class AttackRight extends CardType {
  readonly name = "Attack Right";
  readonly imagePath = "images/cards/a3_attack_right.png";
}

// Probe cards
export class ProbeCenter extends CardType {
  readonly name = "Probe Center";
  readonly imagePath = "images/cards/a5_probe_center.png";
}

export class ProbeLeft extends CardType {
  readonly name = "Probe Left";
  readonly imagePath = "images/cards/a4_probe_left.png";
}

export class ProbeRight extends CardType {
  readonly name = "Probe Right";
  readonly imagePath = "images/cards/a4_probe_right.png";
}

// Recon cards
export class ReconCenter extends CardType {
  readonly name = "Recon Center";
  readonly imagePath = "images/cards/a4_recon_center.png";
}

export class ReconLeft extends CardType {
  readonly name = "Recon Left";
  readonly imagePath = "images/cards/a2_recon_left.png";
}

export class ReconRight extends CardType {
  readonly name = "Recon Right";
  readonly imagePath = "images/cards/a2_recon_right.png";
}
