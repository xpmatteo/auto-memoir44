// ABOUTME: Generic component that renders buttons for any Move with a uiButton() method
// ABOUTME: Replaces hardcoded phase-specific button components with domain-driven approach

import {GameState} from "../../domain/GameState";

export class MoveButtons {
    private container: HTMLDivElement;
    private gameState: GameState;
    private onButtonClick: () => void;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.onButtonClick = () => {
        };

        // Create container matching ConfirmOrdersButton structure
        this.container = document.createElement("div");
        this.container.id = "move-buttons-container";
    }

    setOnButtonClick(callback: () => void): void {
        this.onButtonClick = callback;
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    private handleClick(move: any): void {
        const uiButton = move.uiButton();
        if (uiButton && uiButton.callback) {
            uiButton.callback(this.gameState);
            this.onButtonClick();
        }
    }

    render(): void {
        // Clear existing buttons
        this.container.innerHTML = "";

        // Find all moves with UI buttons
        const moves = this.gameState.legalMoves();
        const buttonMoves = moves.filter(m => m.uiButton() !== null);

        if (buttonMoves.length === 0) {
            // Hide container when no buttons to maintain layout consistency
            this.container.style.visibility = "hidden";
            return;
        }

        this.container.style.visibility = "visible";

        // Create a button for each move
        buttonMoves.forEach(move => {
            const uiButton = move.uiButton();
            if (!uiButton) return;

            const button = document.createElement("button");
            button.textContent = uiButton.label;
            button.className = "move-button";
            button.addEventListener("click", () => this.handleClick(move));

            this.container.appendChild(button);
        });
    }
}
