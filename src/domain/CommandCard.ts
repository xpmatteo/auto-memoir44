// ABOUTME: Command card model with location tracking for deck management
// ABOUTME: Cards can be in Deck, DiscardPile, or either player's hand

export type CardLocation = "Deck" | "DiscardPile" | "BottomPlayerHand" | "TopPlayerHand";

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
  location: CardLocation = "Deck"
): CommandCard {
  return { id, name, imagePath, location };
}
