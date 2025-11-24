// ABOUTME: Canvas click handler for unit ordering and movement interactions
// ABOUTME: Converts click coordinates to unit selection and executes moves (phase-aware)

import type { GameState } from "../../domain/GameState.js";
import type { GridConfig } from "../../utils/hex.js";
import type { Unit } from "../../domain/Unit.js";
import { toCanvasCoords, pixelToHex, HexCoord } from "../../utils/hex.js";
import { ToggleUnitOrderedMove, MoveUnitMove } from "../../domain/Move.js";
import { OrderUnitsPhase } from "../../domain/phases/OrderUnitsPhase.js";
import { MovePhase } from "../../domain/phases/MovePhase.js";
import { uiState } from "../UIState.js";

export class CanvasClickHandler {
  private boundHandler: (event: MouseEvent) => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private gameState: GameState,
    private grid: GridConfig,
    private onUpdate: () => void
  ) {
    this.boundHandler = this.handleClick.bind(this);
  }

  /**
   * Handle click events on the canvas
   * Phase-aware: handles unit ordering in OrderUnitsPhase, movement in MovePhase
   */
  handleClick(event: MouseEvent): void {
    const canvasCoord = toCanvasCoords(event, this.canvas);
    const hexCoord = pixelToHex(canvasCoord.x, canvasCoord.y, this.grid);
    const currentPhase = this.gameState.activePhase;

    if (currentPhase instanceof OrderUnitsPhase) {
      this.handleOrderingClick(hexCoord);
    } else if (currentPhase instanceof MovePhase) {
      this.handleMovementClick(hexCoord);
    }
  }

  /**
   * Handle clicks during OrderUnitsPhase
   * Toggles unit ordering when clicking on a unit
   */
  private handleOrderingClick(hexCoord: HexCoord): void {
    const unit = this.gameState.getUnitAt(hexCoord);

    if (unit) {
      const moves = this.gameState.legalMoves();
      const toggleMove = moves.find(
        (m) => m instanceof ToggleUnitOrderedMove && m.unit.id === unit.id
      );

      if (toggleMove) {
        this.gameState.executeMove(toggleMove);
        this.onUpdate();
      }
    }
  }

  /**
   * Handle clicks during MovePhase
   * Two-click flow: select unit -> select destination -> execute move
   */
  private handleMovementClick(hexCoord: HexCoord): void {
    const unit = this.gameState.getUnitAt(hexCoord);
    const legalMoves = this.gameState.legalMoves();

    // Check if clicking on a valid destination for selected unit
    if (uiState.selectedUnit && uiState.isDestinationValid(hexCoord)) {
      // Find the selected unit's location in the game state
      const selectedUnitLocation = this.findUnitLocation(uiState.selectedUnit);

      if (selectedUnitLocation) {
        const moveToExecute = legalMoves.find(
          (m) =>
            m instanceof MoveUnitMove &&
            m.from.q === selectedUnitLocation.q &&
            m.from.r === selectedUnitLocation.r &&
            m.to.q === hexCoord.q &&
            m.to.r === hexCoord.r
        ) as MoveUnitMove | undefined;

        if (moveToExecute) {
          this.gameState.executeMove(moveToExecute);
          uiState.clearSelection();
          this.onUpdate();
        }
      }
      return;
    }

    // Check if clicking on an ordered unit that can move
    if (unit && this.gameState.isUnitOrdered(unit) && !this.gameState.isUnitMoved(unit)) {
      const validMovesForUnit = legalMoves.filter(
        (m) =>
          m instanceof MoveUnitMove &&
          m.from.q === hexCoord.q &&
          m.from.r === hexCoord.r
      ) as MoveUnitMove[];

      if (validMovesForUnit.length > 0) {
        const destinations = validMovesForUnit.map((m) => m.to);
        uiState.selectUnit(unit, hexCoord, destinations);
        this.onUpdate();
      }
      return;
    }

    // Clicked elsewhere - clear selection
    uiState.clearSelection();
    this.onUpdate();
  }

  /**
   * Find the location of a unit on the board
   */
  private findUnitLocation(unit: Unit): HexCoord | null {
    const allUnits = this.gameState.getAllUnitsWithPositions();
    const found = allUnits.find(({ unit: u }) => u.id === unit.id);
    return found ? found.coord : null;
  }

  /**
   * Attach this handler to the canvas
   */
  attach(): void {
    this.canvas.addEventListener("click", this.boundHandler);
  }

  /**
   * Detach this handler from the canvas
   */
  detach(): void {
    this.canvas.removeEventListener("click", this.boundHandler);
  }
}
