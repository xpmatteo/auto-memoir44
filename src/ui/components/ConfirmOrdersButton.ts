// ABOUTME: UI component that displays a "Confirm Orders" button when ConfirmOrdersMove is available
// ABOUTME: Follows the component pattern used by HandDisplay and CurrentCardDisplay

import { GameState } from "../../domain/GameState";
import { ConfirmOrdersMove } from "../../domain/Move";

export class ConfirmOrdersButton {
  private gameState: GameState;
  public onConfirm: (() => void) | null;
  private container: HTMLDivElement;
  private button: HTMLButtonElement;

  constructor(gameState: GameState, onConfirm?: () => void) {
    this.gameState = gameState;
    this.onConfirm = onConfirm || null;

    // Create container
    this.container = document.createElement("div");
    this.container.id = "confirm-orders-container";

    // Create button
    this.button = document.createElement("button");
    this.button.id = "confirm-orders-button";
    this.button.textContent = "Confirm Orders";
    this.button.addEventListener("click", () => this.handleClick());

    this.container.appendChild(this.button);
  }

  private handleClick(): void {
    const moves = this.gameState.legalMoves();
    const confirmMove = moves.find((m) => m instanceof ConfirmOrdersMove);

    if (confirmMove) {
      this.gameState.executeMove(confirmMove);
      if (this.onConfirm) {
        this.onConfirm();
      }
    }
  }

  public render(): void {
    const moves = this.gameState.legalMoves();
    const hasConfirmMove = moves.some((m) => m instanceof ConfirmOrdersMove);

    // Use visibility instead of display to maintain space reservation
    this.button.style.visibility = hasConfirmMove ? "visible" : "hidden";
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public getElement(): HTMLDivElement {
    return this.container;
  }
}
