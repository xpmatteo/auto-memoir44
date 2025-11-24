// ABOUTME: Test helper functions for creating test fixtures
// ABOUTME: Provides convenient factory functions for tests

import { Deck } from "../../src/domain/Deck";
import { GameState } from "../../src/domain/GameState";
import { Dice } from "../../src/domain/Dice";

/**
 * Create a GameState with a standard deck and default dice for testing
 */
export function createTestGameState(): GameState {
  const deck = Deck.createStandardDeck();
  // Use a simple incrementing random for deterministic tests
  let counter = 0;
  const testDice = new Dice(() => {
    counter = (counter + 1) % 6;
    return counter / 6;
  });
  return new GameState(deck, testDice);
}
