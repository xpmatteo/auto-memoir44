// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import { GameState } from "../domain/GameState";
import { createPlayer, Side, Position } from "../domain/Player";
import { Deck } from "../domain/Deck";
import { CardLocation } from "../domain/CommandCard";

export function createST02Scenario(): GameState {
  // Create standard deck with 10 Probe Center cards
  const deck = Deck.createStandardDeck();

  // Create players
  const bottomPlayer = createPlayer(Side.ALLIES, Position.BOTTOM);
  const topPlayer = createPlayer(Side.AXIS, Position.TOP);

  // Draw 5 cards for each player
  for (let i = 0; i < 5; i++) {
    deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
  }
  for (let i = 0; i < 4; i++) {
    deck.drawCard(CardLocation.TOP_PLAYER_HAND);
  }

  // Create game state with bottom player (Allies) as active
  return new GameState([bottomPlayer, topPlayer], 0, deck);
}
