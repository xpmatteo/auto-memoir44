// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

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
  id: string;
  abstract readonly name: string;
  abstract readonly imagePath: string;
  location: CardLocation;

  constructor(location: CardLocation = CardLocation.DECK) {
    this.id = `card-${nextCardId++}`;
    this.location = location;
  }
}

// Assault cards
export class AssaultCenter extends CommandCard {
  readonly name = "Assault Center";
  readonly imagePath = "images/cards/a2_assault_center.png";
}

export class AssaultLeft extends CommandCard {
  readonly name = "Assault Left";
  readonly imagePath = "images/cards/a2_assault_left.png";
}

export class AssaultRight extends CommandCard {
  readonly name = "Assault Right";
  readonly imagePath = "images/cards/a2_assault_right.png";
}

// Attack cards
export class AttackCenter extends CommandCard {
  readonly name = "Attack Center";
  readonly imagePath = "images/cards/a4_attack_center.png";
}

export class AttackLeft extends CommandCard {
  readonly name = "Attack Left";
  readonly imagePath = "images/cards/a3_attack_left.png";
}

export class AttackRight extends CommandCard {
  readonly name = "Attack Right";
  readonly imagePath = "images/cards/a3_attack_right.png";
}

// Probe cards
export class ProbeCenter extends CommandCard {
  readonly name = "Probe Center";
  readonly imagePath = "images/cards/a5_probe_center.png";
}

export class ProbeLeft extends CommandCard {
  readonly name = "Probe Left";
  readonly imagePath = "images/cards/a4_probe_left.png";
}

export class ProbeRight extends CommandCard {
  readonly name = "Probe Right";
  readonly imagePath = "images/cards/a4_probe_right.png";
}

// Recon cards
export class ReconCenter extends CommandCard {
  readonly name = "Recon Center";
  readonly imagePath = "images/cards/a4_recon_center.png";
}

export class ReconLeft extends CommandCard {
  readonly name = "Recon Left";
  readonly imagePath = "images/cards/a2_recon_left.png";
}

export class ReconRight extends CommandCard {
  readonly name = "Recon Right";
  readonly imagePath = "images/cards/a2_recon_right.png";
}
