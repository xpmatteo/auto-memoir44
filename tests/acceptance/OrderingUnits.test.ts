// ABOUTME: Acceptance tests for ordering units with command cards
// ABOUTME: Tests section-based unit ordering when cards are played

import { describe, it, expect } from "vitest";
import { GameState } from "../../src/domain/GameState";
import { createPlayer, Side, Position } from "../../src/domain/Player";
import { Deck } from "../../src/domain/Deck";
import { Infantry } from "../../src/domain/Unit";
import { AssaultLeft } from "../../src/domain/CommandCard";
import { CardLocation } from "../../src/domain/CommandCard";

describe("Ordering Units with Command Cards", () => {
  describe("Assault Left card", () => {
    it("should order all units in the bottom player's left section when Assault Left is played", () => {
      // Setup
      const bottomPlayer = createPlayer(Side.ALLIES, Position.BOTTOM);
      const topPlayer = createPlayer(Side.AXIS, Position.TOP);

      // Create an Assault Left card
      const card = new AssaultLeft(CardLocation.BOTTOM_PLAYER_HAND);

      // Create deck with this card
      const deck = new Deck([card]);
      const gameState = new GameState([bottomPlayer, topPlayer], 0, deck);

      // Place units in different sections for bottom player (Allies)
      // Bottom player's left section
      const leftUnit1 = new Infantry(Side.ALLIES);
      const leftUnit2 = new Infantry(Side.ALLIES);
      gameState.placeUnit({ q: -2, r: 7 }, leftUnit1);
      gameState.placeUnit({ q: -1, r: 7 }, leftUnit2);

      // This hex is both left and right
      const straddlingUnit = new Infantry(Side.ALLIES);
      gameState.placeUnit({ q: 0, r: 7 }, straddlingUnit);

      // Center section
      const centerUnit = new Infantry(Side.ALLIES);
      gameState.placeUnit({ q: 2, r: 7 }, centerUnit);

      // Right section: q = 9-12
      const rightUnit = new Infantry(Side.ALLIES);
      gameState.placeUnit({ q: 7, r: 7 }, rightUnit);

      // Initially, no units should be ordered
      expect(gameState.isUnitOrdered(leftUnit1)).toBe(false);
      expect(gameState.isUnitOrdered(leftUnit2)).toBe(false);
      expect(gameState.isUnitOrdered(straddlingUnit)).toBe(false);
      expect(gameState.isUnitOrdered(centerUnit)).toBe(false);
      expect(gameState.isUnitOrdered(rightUnit)).toBe(false);

      // Act: Play the Assault Left card (set it as current card)
      gameState.setCurrentCard(card.id);

      // Assert: Only left section units should be ordered
      expect(gameState.isUnitOrdered(leftUnit1)).toBe(true);
      expect(gameState.isUnitOrdered(leftUnit2)).toBe(true);
      expect(gameState.isUnitOrdered(straddlingUnit)).toBe(true);
      expect(gameState.isUnitOrdered(centerUnit)).toBe(false);
      expect(gameState.isUnitOrdered(rightUnit)).toBe(false);
    });

    it("should order all units in the top player's left section when Assault Left is played", () => {
      // Setup
      const bottomPlayer = createPlayer(Side.ALLIES, Position.BOTTOM);
      const topPlayer = createPlayer(Side.AXIS, Position.TOP);

      // Create an Assault Left card
      const card = new AssaultLeft(CardLocation.TOP_PLAYER_HAND);

      // Create deck with this card
      const deck = new Deck([card]);
      const gameState = new GameState([bottomPlayer, topPlayer], 1, deck); // Top player active

      // Place units in different sections for top player (Axis)
      // Top player's left section is FLIPPED: screen-right
      const leftUnit1 = new Infantry(Side.AXIS);
      const leftUnit2 = new Infantry(Side.AXIS);
      gameState.placeUnit({ q: 9, r: 1 }, leftUnit1);
      gameState.placeUnit({ q: 10, r: 1 }, leftUnit2);

      // Center section
      const centerUnit = new Infantry(Side.AXIS);
      gameState.placeUnit({ q: 6, r: 1 }, centerUnit);

      // Right section for top player: screen-left
      const rightUnit = new Infantry(Side.AXIS);
      gameState.placeUnit({ q: 2, r: 1 }, rightUnit);

      // Initially, no units should be ordered
      expect(gameState.isUnitOrdered(leftUnit1)).toBe(false);
      expect(gameState.isUnitOrdered(leftUnit2)).toBe(false);
      expect(gameState.isUnitOrdered(centerUnit)).toBe(false);
      expect(gameState.isUnitOrdered(rightUnit)).toBe(false);

      // Act: Play the Assault Left card
      gameState.setCurrentCard(card.id);

      // Assert: Only left section units (q: 9-12 for top player) should be ordered
      expect(gameState.isUnitOrdered(leftUnit1)).toBe(true);
      expect(gameState.isUnitOrdered(leftUnit2)).toBe(true);
      expect(gameState.isUnitOrdered(centerUnit)).toBe(false);
      expect(gameState.isUnitOrdered(rightUnit)).toBe(false);
    });

    it("should not order enemy units when Assault Left is played", () => {
      // Setup
      const bottomPlayer = createPlayer(Side.ALLIES, Position.BOTTOM);
      const topPlayer = createPlayer(Side.AXIS, Position.TOP);

      // Create an Assault Left card
      const card = new AssaultLeft(CardLocation.BOTTOM_PLAYER_HAND);

      // Create deck with this card
      const deck = new Deck([card]);
      const gameState = new GameState([bottomPlayer, topPlayer], 0, deck);

      // Place friendly unit in left section
      const friendlyUnit = new Infantry(Side.ALLIES);
      gameState.placeUnit({ q: -1, r: 7 }, friendlyUnit);

      // Place enemy unit in left section (same q range)
      const enemyUnit = new Infantry(Side.AXIS);
      gameState.placeUnit({ q: 1, r: 1 }, enemyUnit);

      gameState.setCurrentCard(card.id);

      // Only friendly unit should be ordered
      expect(gameState.isUnitOrdered(friendlyUnit)).toBe(true);
      expect(gameState.isUnitOrdered(enemyUnit)).toBe(false);
    });
  });
});
