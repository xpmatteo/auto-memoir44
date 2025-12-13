// ABOUTME: Unit tests for canvas click handler
// ABOUTME: Tests that clicks on units execute the appropriate toggle moves

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CanvasClickHandler } from "../../../../src/ui/input/CanvasClickHandler";
import { GameState } from "../../../../src/domain/GameState";
import { Deck } from "../../../../src/domain/Deck";
import { Infantry } from "../../../../src/domain/Unit";
import { Side } from "../../../../src/domain/Player";
import { ProbeLeft, CardLocation } from "../../../../src/domain/cards/CommandCard";
import { PlayCardMove, ConfirmOrdersMove } from "../../../../src/domain/moves/Move";
import type { GridConfig } from "../../../../src/utils/hex";
import { HexCoord } from "../../../../src/utils/hex";
import { uiState } from "../../../../src/ui/UIState";
import * as hexUtils from "../../../../src/utils/hex";

describe("CanvasClickHandler", () => {
  const testGrid: GridConfig = {
    cols: 13,
    rows: 9,
    hexRadius: 87.7,
    originX: 90,
    originY: 182,
    lineWidth: 2.5,
    strokeStyle: "rgba(0, 255, 255, 0.72)",
    showCoords: false,
    coordColor: "rgba(0, 0, 0, 0.85)"
  };

  function setupGameWithUnit() {
    const card = new ProbeLeft();
    const deck = new Deck([card]);
    const gameState = new GameState(deck);
    gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

    const unit = new Infantry(Side.ALLIES);
    const unitCoord = new HexCoord(-4, 8); // Left section
    gameState.placeUnit(unitCoord, unit);
    gameState.executeMove(new PlayCardMove(card));

    return { gameState, unit, unitCoord };
  }

  it("should toggle unit order when clicking on a unit that can be ordered", () => {
    const { gameState, unit } = setupGameWithUnit();
    const canvas = document.createElement("canvas");
    const updateCallback = vi.fn();
    const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

    // Simulate what happens when a click converts to the unit's hex coordinate
    // We'll test handleClick by creating a minimal mock event
    const mockEvent = {
      clientX: 0,
      clientY: 0
    } as MouseEvent;

    // Mock toCanvasCoords and pixelToHex by spying on gameState.getUnitAt
    // to return our unit (simulating a successful click on that unit)
    vi.spyOn(gameState, "getUnitAt").mockReturnValue(unit);

    handler.handleClick(mockEvent);

    expect(gameState.getOrderedUnits()).toContain(unit);
    expect(updateCallback).toHaveBeenCalledTimes(1);
  });

  it("should unorder unit when clicking an already ordered unit", () => {
    const { gameState, unit } = setupGameWithUnit();
    const canvas = document.createElement("canvas");
    const updateCallback = vi.fn();
    const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

    const mockEvent = { clientX: 0, clientY: 0 } as MouseEvent;
    vi.spyOn(gameState, "getUnitAt").mockReturnValue(unit);

    // Click once to order
    handler.handleClick(mockEvent);
    expect(gameState.getOrderedUnits()).toContain(unit);

    // Click again to unorder
    handler.handleClick(mockEvent);
    expect(gameState.getOrderedUnits()).not.toContain(unit);
    expect(updateCallback).toHaveBeenCalledTimes(2);
  });

  it("should do nothing when clicking empty hex", () => {
    const { gameState } = setupGameWithUnit();
    const canvas = document.createElement("canvas");
    const updateCallback = vi.fn();
    const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

    const mockEvent = { clientX: 0, clientY: 0 } as MouseEvent;
    vi.spyOn(gameState, "getUnitAt").mockReturnValue(undefined);

    handler.handleClick(mockEvent);

    expect(gameState.getOrderedUnits()).toHaveLength(0);
    expect(updateCallback).not.toHaveBeenCalled();
  });

  it("should only execute legal moves", () => {
    const { gameState } = setupGameWithUnit();
    // Place a unit in center section that cannot be ordered with ProbeLeft
    const centerUnit = new Infantry(Side.ALLIES);
    gameState.placeUnit(new HexCoord(3, 8), centerUnit);

    const canvas = document.createElement("canvas");
    const updateCallback = vi.fn();
    const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

    const mockEvent = { clientX: 0, clientY: 0 } as MouseEvent;
    vi.spyOn(gameState, "getUnitAt").mockReturnValue(centerUnit);

    handler.handleClick(mockEvent);

    // Center unit should not be ordered (ProbeLeft only affects left section)
    expect(gameState.getOrderedUnits()).not.toContain(centerUnit);
    expect(updateCallback).not.toHaveBeenCalled();
  });

  it("should attach and detach event listeners", () => {
    const { gameState } = setupGameWithUnit();
    const canvas = document.createElement("canvas");
    const updateCallback = vi.fn();
    const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

    const addSpy = vi.spyOn(canvas, "addEventListener");
    const removeSpy = vi.spyOn(canvas, "removeEventListener");

    handler.attach();
    expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function));

    handler.detach();
    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));
  });

  describe("MovePhase", () => {
    beforeEach(() => {
      // Clear UI state before each test
      uiState.clearSelection();
    });

    function setupGameInMovePhase() {
      const card = new ProbeLeft();
      const deck = new Deck([card]);
      const gameState = new GameState(deck);
      gameState.drawCards(1, CardLocation.BOTTOM_PLAYER_HAND);

      const unit = new Infantry(Side.ALLIES);
      const unitCoord = new HexCoord(-4, 8); // Left section
      gameState.placeUnit(unitCoord, unit);

      // Play card and order the unit
      gameState.executeMove(new PlayCardMove(card));
      gameState.orderUnit(unit);

      // Confirm orders to enter MovePhase
      gameState.executeMove(new ConfirmOrdersMove());

      return { gameState, unit, unitCoord };
    }

    it("should deselect unit when clicking on selected unit again", () => {
      const { gameState, unit, unitCoord } = setupGameInMovePhase();

      // Verify game state setup
      expect(gameState.isUnitOrdered(unit)).toBe(true);
      expect(gameState.isUnitMoved(unit)).toBe(false);
      expect(gameState.activePhase.name).toContain("Move");

      const canvas = document.createElement("canvas");
      const updateCallback = vi.fn();
      const handler = new CanvasClickHandler(canvas, gameState, testGrid, updateCallback);

      // Mock pixelToHex to always return our unit's coordinate
      vi.spyOn(hexUtils, "pixelToHex").mockReturnValue(unitCoord);
      vi.spyOn(hexUtils, "toCanvasCoords").mockReturnValue({ x: 0, y: 0 });

      const mockEvent = { clientX: 0, clientY: 0 } as MouseEvent;

      // First click: select the unit
      handler.handleClick(mockEvent);

      // Verify unit is selected
      expect(uiState.selectedUnit).toBe(unit);
      expect(uiState.selectedUnitLocation).toEqual(unitCoord);
      expect(updateCallback).toHaveBeenCalledTimes(1);

      // Second click: click on the same unit
      handler.handleClick(mockEvent);

      // Verify unit is deselected
      expect(uiState.selectedUnit).toBeNull();
      expect(uiState.selectedUnitLocation).toBeNull();
      expect(updateCallback).toHaveBeenCalledTimes(2);

      // Verify unit has not moved
      expect(gameState.isUnitMoved(unit)).toBe(false);
    });
  });
});
