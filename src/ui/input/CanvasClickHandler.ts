// ABOUTME: Canvas click handler for unit ordering interactions
// ABOUTME: Converts click coordinates to unit selection and executes toggle moves

import type { GameState } from "../../domain/GameState.js";
import type { GridConfig } from "../../utils/hex.js";
import { toCanvasCoords, pixelToHex } from "../../utils/hex.js";
import { ToggleUnitOrderedMove } from "../../domain/Move.js";

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
   * Converts click coordinates to hex, finds unit, and executes toggle move if available
   */
  handleClick(event: MouseEvent): void {
    const canvasCoord = toCanvasCoords(event, this.canvas);
    const hexCoord = pixelToHex(canvasCoord.x, canvasCoord.y, this.grid);
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
