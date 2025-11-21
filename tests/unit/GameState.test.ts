// ABOUTME: Unit tests for GameState class
// ABOUTME: Tests current card management, unit positioning, and game state operations

import { describe, it, expect } from "vitest";
import { GameState } from "../../src/domain/GameState";
import {  Side } from "../../src/domain/Player";
import { Deck } from "../../src/domain/Deck";
import { Infantry } from "../../src/domain/Unit";
import type { HexCoord } from "../../src/utils/hex";
import {
  CardLocation
} from "../../src/domain/CommandCard";
import {PlayCardMove} from "../../src/domain/Move";

describe("GameState", () => {
  describe("setCurrentCard", () => {
    it("should set the current card when none is selected", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      // Get a real card from the deck
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const card = cards[0];

      gameState.setCurrentCard(card.id);

      expect(gameState.getCurrentCard()).toBe(card);
    });

    it("should throw error when a card is already selected", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      // Get real cards from the deck
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const cardId1 = cards[0].id;
      const cardId2 = cards[1].id;

      gameState.setCurrentCard(cardId1);

      expect(() => gameState.setCurrentCard(cardId2)).toThrow(
        `Cannot select card: a card is already selected (${cardId1}). Clear the current card first.`
      );
    });

    it("should include the existing card ID in the error message", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      // Get real cards from the deck
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const cardId1 = cards[0].id;
      const cardId2 = cards[1].id;

      gameState.setCurrentCard(cardId1);

      expect(() => gameState.setCurrentCard(cardId2)).toThrow(cardId1);
    });
  });

  describe("getCurrentCard", () => {
    it("should return null when no card is selected", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      expect(gameState.getCurrentCard()).toBeNull();
    });

    it("should return the current card when one is selected", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      // Get a real card from the deck
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const card = cards[0];

      gameState.setCurrentCard(card.id);

      expect(gameState.getCurrentCard()).toBe(card);
    });
  });

  describe("placeUnit", () => {
    it("should place a unit at an empty coordinate", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit = new Infantry(Side.ALLIES);
      const coord: HexCoord = { q: 5, r: 3 };

      gameState.placeUnit(coord, unit);

      expect(gameState.getUnitAt(coord)).toBe(unit);
    });

    it("should throw error when coordinate is already occupied", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES);
      const unit2 = new Infantry(Side.AXIS);
      const coord: HexCoord = { q: 5, r: 3 };

      gameState.placeUnit(coord, unit1);

      expect(() => gameState.placeUnit(coord, unit2)).toThrow(
        "Cannot place unit at (5, 3): coordinate already occupied"
      );
    });
  });

  describe("getUnitAt", () => {
    it("should return undefined for empty coordinate", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const coord: HexCoord = { q: 5, r: 3 };

      expect(gameState.getUnitAt(coord)).toBeUndefined();
    });

    it("should return the unit at the specified coordinate", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit = new Infantry(Side.ALLIES);
      const coord: HexCoord = { q: 5, r: 3 };

      gameState.placeUnit(coord, unit);

      expect(gameState.getUnitAt(coord)).toBe(unit);
    });

    it("should distinguish between different coordinates", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES);
      const unit2 = new Infantry(Side.AXIS);
      const coord1: HexCoord = { q: 5, r: 3 };
      const coord2: HexCoord = { q: 6, r: 4 };

      gameState.placeUnit(coord1, unit1);
      gameState.placeUnit(coord2, unit2);

      expect(gameState.getUnitAt(coord1)).toBe(unit1);
      expect(gameState.getUnitAt(coord2)).toBe(unit2);
    });
  });

  describe("moveUnit", () => {
    it("should move a unit from one coordinate to another", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit = new Infantry(Side.ALLIES);
      const from: HexCoord = { q: 5, r: 3 };
      const to: HexCoord = { q: 6, r: 3 };

      gameState.placeUnit(from, unit);
      gameState.moveUnit(from, to);

      expect(gameState.getUnitAt(from)).toBeUndefined();
      expect(gameState.getUnitAt(to)).toBe(unit);
    });

    it("should throw error when moving from empty coordinate", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const from: HexCoord = { q: 5, r: 3 };
      const to: HexCoord = { q: 6, r: 3 };

      expect(() => gameState.moveUnit(from, to)).toThrow(
        "No unit at (5, 3) to move"
      );
    });

    it("should throw error when destination is occupied", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES);
      const unit2 = new Infantry(Side.AXIS);
      const from: HexCoord = { q: 5, r: 3 };
      const to: HexCoord = { q: 6, r: 3 };

      gameState.placeUnit(from, unit1);
      gameState.placeUnit(to, unit2);

      expect(() => gameState.moveUnit(from, to)).toThrow(
        "Cannot move unit to (6, 3): coordinate already occupied"
      );
    });
  });

  describe("removeUnit", () => {
    it("should remove a unit from the board", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit = new Infantry(Side.ALLIES);
      const coord: HexCoord = { q: 5, r: 3 };

      gameState.placeUnit(coord, unit);
      gameState.removeUnit(coord);

      expect(gameState.getUnitAt(coord)).toBeUndefined();
    });

    it("should do nothing when removing from empty coordinate", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const coord: HexCoord = { q: 5, r: 3 };

      gameState.removeUnit(coord);

      expect(gameState.getUnitAt(coord)).toBeUndefined();
    });
  });

  describe("getAllUnitsWithPositions", () => {
    it("should return empty array when no units are on the board", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      expect(gameState.getAllUnitsWithPositions()).toHaveLength(0);
    });

    it("should return all units with their coordinates", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES);
      const unit2 = new Infantry(Side.AXIS);
      const coord1: HexCoord = { q: 5, r: 3 };
      const coord2: HexCoord = { q: 6, r: 4 };

      gameState.placeUnit(coord1, unit1);
      gameState.placeUnit(coord2, unit2);

      const unitsWithPositions = gameState.getAllUnitsWithPositions();

      expect(unitsWithPositions).toHaveLength(2);
      expect(unitsWithPositions).toContainEqual({ coord: coord1, unit: unit1 });
      expect(unitsWithPositions).toContainEqual({ coord: coord2, unit: unit2 });
    });

    it("should reflect changes after removing a unit", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES);
      const unit2 = new Infantry(Side.AXIS);
      const coord1: HexCoord = { q: 5, r: 3 };
      const coord2: HexCoord = { q: 6, r: 4 };

      gameState.placeUnit(coord1, unit1);
      gameState.placeUnit(coord2, unit2);
      gameState.removeUnit(coord1);

      const unitsWithPositions = gameState.getAllUnitsWithPositions();

      expect(unitsWithPositions).toHaveLength(1);
      expect(unitsWithPositions).toContainEqual({ coord: coord2, unit: unit2 });
    });
  });

  describe("legalMoves", () => {
    it("should return an array", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const moves = gameState.legalMoves();

      expect(Array.isArray(moves)).toBe(true);
    });

    it("should currently return empty array (placeholder implementation)", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      expect(gameState.legalMoves()).toHaveLength(0);
    });
  });

  describe("integration: current card workflow", () => {
    it("should support full card selection lifecycle", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      // Get real cards from the deck
      const cards = deck.getCardsInLocation(CardLocation.DECK);
      const card1 = cards[0];
      const card2 = cards[1];

      // Initially no card selected
      expect(gameState.getCurrentCard()).toBeNull();

      // Select a card
      gameState.setCurrentCard(card1.id);
      expect(gameState.getCurrentCard()).toBe(card1);

      // Cannot select another card
      expect(() => gameState.setCurrentCard(card2.id)).toThrow();
    });
  });

  describe("integration: unit placement and movement", () => {
    it("should support placing multiple units and moving them", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);

      const unit1 = new Infantry(Side.ALLIES, 4);
      const unit2 = new Infantry(Side.ALLIES, 3);
      const unit3 = new Infantry(Side.AXIS, 4);

      // Place units
      gameState.placeUnit({ q: 0, r: 0 }, unit1);
      gameState.placeUnit({ q: 1, r: 0 }, unit2);
      gameState.placeUnit({ q: 10, r: 8 }, unit3);

      expect(gameState.getAllUnitsWithPositions()).toHaveLength(3);

      // Move unit1
      gameState.moveUnit({ q: 0, r: 0 }, { q: 0, r: 1 });

      expect(gameState.getUnitAt({ q: 0, r: 0 })).toBeUndefined();
      expect(gameState.getUnitAt({ q: 0, r: 1 })).toBe(unit1);

      // Remove unit2
      gameState.removeUnit({ q: 1, r: 0 });

      expect(gameState.getAllUnitsWithPositions()).toHaveLength(2);
    });
  });

  describe("Available actions at the beginning of the game", () => {
    it("should allow playing the cards in the hand", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);
      gameState.drawCards(3, CardLocation.BOTTOM_PLAYER_HAND);
      let [card1, card2, card3] = gameState.getCardsInLocation(CardLocation.BOTTOM_PLAYER_HAND)

      let moves = gameState.legalMoves();

      expect(moves).toEqual([new PlayCardMove(card1), new PlayCardMove(card2), new PlayCardMove(card3)]);
    });

    it("should allow playing the cards in the hand for other player", () => {
      const deck = Deck.createStandardDeck();
      const gameState = new GameState(deck);
      gameState.switchActivePlayer();
      gameState.drawCards(3, CardLocation.TOP_PLAYER_HAND);
      let [card1, card2, card3] = gameState.getCardsInLocation(CardLocation.TOP_PLAYER_HAND)

      let moves = gameState.legalMoves();

      expect(moves).toEqual([new PlayCardMove(card1), new PlayCardMove(card2), new PlayCardMove(card3)]);
    });

  });
});
