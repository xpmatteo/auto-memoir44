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
