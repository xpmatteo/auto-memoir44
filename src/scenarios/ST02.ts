// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import { GameState } from "../domain/GameState";
import { createPlayer, Side, Position } from "../domain/Player";
import { Deck } from "../domain/Deck";
import { CardLocation } from "../domain/CommandCard";
import { createUnit, Unit } from "../domain/Unit";

export function createST02Scenario(): GameState {
  // Create standard deck with 35 command cards
  const deck = Deck.createStandardDeck();

  // Create players
  const bottomPlayer = createPlayer(Side.ALLIES, Position.BOTTOM);
  const topPlayer = createPlayer(Side.AXIS, Position.TOP);

  // Draw 5 cards for bottom player, 4 cards for top player
  for (let i = 0; i < 5; i++) {
    deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
  }
  for (let i = 0; i < 4; i++) {
    deck.drawCard(CardLocation.TOP_PLAYER_HAND);
  }

  // Create units
  const units: Unit[] = [
    // US infantry at bottom (6 units with 4 figures each)
    createUnit("us-inf-1", "infantry", 4, -2, 7, Side.ALLIES),
    createUnit("us-inf-2", "infantry", 4, -1, 7, Side.ALLIES),
    createUnit("us-inf-3", "infantry", 4, 2, 7, Side.ALLIES),
    createUnit("us-inf-4", "infantry", 4, 3, 7, Side.ALLIES),
    createUnit("us-inf-5", "infantry", 4, 6, 7, Side.ALLIES),
    createUnit("us-inf-6", "infantry", 4, 7, 7, Side.ALLIES),

    // German infantry at top (2 units with 4 figures each)
    createUnit("de-inf-1", "infantry", 4, 5, 1, Side.AXIS),
    createUnit("de-inf-2", "infantry", 4, 6, 1, Side.AXIS),
  ];

  // Create game state with bottom player (Allies) as active
  return new GameState([bottomPlayer, topPlayer], 0, deck, units);
}
