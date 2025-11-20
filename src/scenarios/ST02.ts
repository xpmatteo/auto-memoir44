// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import { GameState } from "../domain/GameState";
import { createPlayer, Side, Position } from "../domain/Player";
import { Deck } from "../domain/Deck";
import { CardLocation } from "../domain/CommandCard";
import { Infantry, coordToKey, Unit } from "../domain/Unit";
import type { HexCoord } from "../utils/hex";

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

  // Create units with positions
  const infantry = new Infantry();
  const unitPositions = new Map<string, Unit>();

  // Helper to place a unit at coordinates
  const placeUnit = (id: string, q: number, r: number, owner: Side) => {
    const unit = infantry.createUnit(id, owner);
    const coord: HexCoord = { q, r };
    unitPositions.set(coordToKey(coord), unit);
  };

  // US infantry at bottom (6 units with 4 figures each)
  placeUnit("us-inf-1", -2, 7, Side.ALLIES);
  placeUnit("us-inf-2", -1, 7, Side.ALLIES);
  placeUnit("us-inf-3", 2, 7, Side.ALLIES);
  placeUnit("us-inf-4", 3, 7, Side.ALLIES);
  placeUnit("us-inf-5", 6, 7, Side.ALLIES);
  placeUnit("us-inf-6", 7, 7, Side.ALLIES);

  // German infantry at top (2 units with 4 figures each)
  placeUnit("de-inf-1", 5, 1, Side.AXIS);
  placeUnit("de-inf-2", 6, 1, Side.AXIS);

  // Create game state with bottom player (Allies) as active
  return new GameState([bottomPlayer, topPlayer], 0, deck, unitPositions);
}
