// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import { GameState } from "../domain/GameState";
import { createPlayer } from "../domain/Player";
import { Deck } from "../domain/Deck";

export function createST02Scenario(): GameState {
  // Create standard deck with 10 Probe Center cards
  const deck = Deck.createStandardDeck();

  // Create players
  const bottomPlayer = createPlayer("Allies", "Bottom");
  const topPlayer = createPlayer("Axis", "Top");

  // Draw 5 cards for each player
  for (let i = 0; i < 5; i++) {
    deck.drawCard("BottomPlayerHand");
  }
  for (let i = 0; i < 5; i++) {
    deck.drawCard("TopPlayerHand");
  }

  // Create game state with bottom player (Allies) as active
  return new GameState([bottomPlayer, topPlayer], 0, deck);
}
