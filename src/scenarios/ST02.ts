// ABOUTME: Sainte-Mère-Église scenario setup
// ABOUTME: Initializes game state with Allies at bottom, 5 cards each player

import type { GameState } from "../domain/GameState";
import type { Scenario } from "./Scenario";
import { CardLocation } from "../domain/CommandCard";
import { Infantry } from "../domain/Unit";
import { Side } from "../domain/Player";
import type { HexCoord } from "../utils/hex";

export class ST02Scenario implements Scenario {
  setup(gameState: GameState): void {
    // Draw 5 cards for bottom player, 4 cards for top player
    for (let i = 0; i < 5; i++) {
      gameState.deck.drawCard(CardLocation.BOTTOM_PLAYER_HAND);
    }
    for (let i = 0; i < 4; i++) {
      gameState.deck.drawCard(CardLocation.TOP_PLAYER_HAND);
    }

    // Helper to place a unit at coordinates
    const placeUnit = (q: number, r: number, owner: Side) => {
      const unit = new Infantry(owner);
      const coord: HexCoord = { q, r };
      gameState.placeUnit(coord, unit);
    };

    // US infantry at bottom (6 units with 4 figures each)
    placeUnit(-2, 7, Side.ALLIES);
    placeUnit(-1, 7, Side.ALLIES);
    placeUnit(2, 7, Side.ALLIES);
    placeUnit(3, 7, Side.ALLIES);
    placeUnit(6, 7, Side.ALLIES);
    placeUnit(7, 7, Side.ALLIES);

    // German infantry at top (2 units with 4 figures each)
    placeUnit(5, 1, Side.AXIS);
    placeUnit(6, 1, Side.AXIS);
  }
}
