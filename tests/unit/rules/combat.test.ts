// ABOUTME: Unit tests for combat rules, specifically dice count calculation
// ABOUTME: Verifies that units roll the correct number of dice based on type and distance

import { describe, it, expect } from "vitest";
import { calculateDiceCount } from "../../../src/rules/combat";
import { Infantry, UnitType } from "../../../src/domain/Unit";
import { Side } from "../../../src/domain/Player";

describe("calculateDiceCount", () => {
  describe("Infantry units", () => {
    const infantry = new Infantry(Side.ALLIES, 4);

    it("should roll 3 dice at distance 1", () => {
      expect(calculateDiceCount(infantry, 1)).toBe(3);
    });

    it("should roll 2 dice at distance 2", () => {
      expect(calculateDiceCount(infantry, 2)).toBe(2);
    });

    it("should roll 1 die at distance 3", () => {
      expect(calculateDiceCount(infantry, 3)).toBe(1);
    });
  });

  describe("Invalid distances", () => {
    const infantry = new Infantry(Side.ALLIES, 4);

    it("should throw error for distance 0", () => {
      expect(() => calculateDiceCount(infantry, 0)).toThrow(
        "Invalid battle distance: 0. Valid range is 1-3."
      );
    });

    it("should throw error for distance 4", () => {
      expect(() => calculateDiceCount(infantry, 4)).toThrow(
        "Invalid battle distance: 4. Valid range is 1-3."
      );
    });

    it("should throw error for negative distance", () => {
      expect(() => calculateDiceCount(infantry, -1)).toThrow(
        "Invalid battle distance: -1. Valid range is 1-3."
      );
    });
  });

  describe("Unsupported unit types", () => {
    it("should throw error for armor units", () => {
      // Create a mock armor unit since Armor class doesn't exist yet
      const mockArmorUnit = {
        type: UnitType.ARMOR,
        side: Side.ALLIES,
        strength: 3,
      };

      expect(() => calculateDiceCount(mockArmorUnit as any, 1)).toThrow(
        "Unsupported unit type for dice calculation: armor"
      );
    });

    it("should throw error for unknown unit types", () => {
      const mockUnknownUnit = {
        type: "artillery" as any,
        side: Side.ALLIES,
        strength: 3,
      };

      expect(() => calculateDiceCount(mockUnknownUnit as any, 1)).toThrow(
        "Unsupported unit type for dice calculation: artillery"
      );
    });
  });
});
